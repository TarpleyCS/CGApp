// Shared calculation utilities for weight and balance

import { CG_CONSTANTS, FUEL_CG_DATA, POSITION_MAP, OEW_DATA } from './constants';
import type { PositionCode, AircraftVariant } from './constants';

// Interface definitions
export interface WeightData {
  weight: number;
  position: string;
}

export interface LoadingPoint {
  cg: number;
  weight: number;
}

export interface CalculationResult {
  position: string;
  momentArm: number;
  weight: number;
  moment: number;
  sumWeight: number;
  sumMoment: number;
  sumBA: number;
  mac: number;
}

/**
 * Convert moment arm to center of gravity percentage
 */
export function convertMomentArmToCG(momentArm: number): number {
  return ((momentArm - CG_CONSTANTS.MOMENT_ARM_REFERENCE) * 100) / CG_CONSTANTS.MAC_REFERENCE;
}

/**
 * Get fuel arm based on weight using interpolation
 */
export function getFuelArm(fuelWeight: number): number {
  if (fuelWeight <= 0) return 0;
  
  // Convert to hundreds for table lookup
  const hundreds = Math.floor(fuelWeight);
  
  // Find closest data points
  let lowerIndex = 0;
  for (let i = 0; i < FUEL_CG_DATA.length; i++) {
    if (FUEL_CG_DATA[i][0] <= hundreds) {
      lowerIndex = i;
    } else {
      break;
    }
  }
  
  // Get upper index (bounded to prevent out of range)
  const upperIndex = Math.min(lowerIndex + 1, FUEL_CG_DATA.length - 1);
  
  // If we're at exact data point or beyond max, return direct value
  if (lowerIndex === upperIndex || hundreds >= FUEL_CG_DATA[FUEL_CG_DATA.length - 1][0]) {
    return FUEL_CG_DATA[lowerIndex][1];
  }
  
  // Interpolate between data points
  const lowerWeight = FUEL_CG_DATA[lowerIndex][0];
  const upperWeight = FUEL_CG_DATA[upperIndex][0];
  const lowerArm = FUEL_CG_DATA[lowerIndex][1];
  const upperArm = FUEL_CG_DATA[upperIndex][1];
  
  return lowerArm + ((hundreds - lowerWeight) / (upperWeight - lowerWeight)) * (upperArm - lowerArm);
}

/**
 * Calculate cumulative weights, moments, and CG for a loading sequence
 */
export function calculateCumulativeWeights(
  weights: WeightData[],
  variant: AircraftVariant
): {
  results: CalculationResult[];
  loadingPoints: LoadingPoint[];
} {
  const OEW = OEW_DATA[variant];
  let currentWeight = OEW.weight;
  let currentMoment = OEW.moment;
  
  const results: CalculationResult[] = [{
    position: 'OEW',
    momentArm: OEW.momentArm,
    weight: OEW.weight,
    moment: OEW.moment,
    sumWeight: currentWeight,
    sumMoment: currentMoment,
    sumBA: OEW.momentArm,
    mac: OEW.cg
  }];

  const loadingPoints: LoadingPoint[] = [{ cg: OEW.cg, weight: OEW.weight }];

  weights.forEach(({ weight, position }) => {
    if (weight === 0) return;

    const momentArm = POSITION_MAP[position as PositionCode];
    if (!momentArm) {
      console.warn(`Unknown position code: ${position}`);
      return;
    }

    const moment = weight * momentArm;
    currentWeight += weight;
    currentMoment += moment;
    const sumBA = currentMoment / currentWeight;
    const mac = convertMomentArmToCG(sumBA);

    results.push({
      position,
      momentArm,
      weight,
      moment,
      sumWeight: currentWeight,
      sumMoment: currentMoment,
      sumBA,
      mac
    });

    loadingPoints.push({ cg: mac, weight: currentWeight });
  });

  return { results, loadingPoints };
}

/**
 * Add fuel to existing calculation results
 */
export function addFuelToCalculation(
  lastResult: CalculationResult,
  fuelWeight: number
): {
  result: CalculationResult;
  loadingPoint: LoadingPoint;
} {
  const fuelArm = getFuelArm(fuelWeight);
  const fuelMoment = fuelWeight * fuelArm;
  
  const newTotalWeight = lastResult.sumWeight + fuelWeight;
  const newTotalMoment = lastResult.sumMoment + fuelMoment;
  const newBA = newTotalMoment / newTotalWeight;
  const newCG = convertMomentArmToCG(newBA);
  
  const result: CalculationResult = {
    position: 'FUEL',
    momentArm: fuelArm,
    weight: fuelWeight,
    moment: fuelMoment,
    sumWeight: newTotalWeight,
    sumMoment: newTotalMoment,
    sumBA: newBA,
    mac: newCG
  };

  const loadingPoint: LoadingPoint = { cg: newCG, weight: newTotalWeight };

  return { result, loadingPoint };
}