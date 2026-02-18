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
 * Get fuel moment arm based on gallons using interpolation.
 * FUEL_CG_DATA format: [gallons, weight_lbs, moment_arm]
 */
export function getFuelArm(fuelGallons: number): number {
  if (fuelGallons <= 0) return 0;

  // Find closest data points by gallons (index 0)
  let lowerIndex = 0;
  for (let i = 0; i < FUEL_CG_DATA.length; i++) {
    if (FUEL_CG_DATA[i][0] <= fuelGallons) {
      lowerIndex = i;
    } else {
      break;
    }
  }

  // Get upper index (bounded to prevent out of range)
  const upperIndex = Math.min(lowerIndex + 1, FUEL_CG_DATA.length - 1);

  // If we're at exact data point or beyond max, return direct value
  if (lowerIndex === upperIndex || fuelGallons >= FUEL_CG_DATA[FUEL_CG_DATA.length - 1][0]) {
    return FUEL_CG_DATA[lowerIndex][2];
  }

  // Interpolate between data points using gallons (index 0) and moment arm (index 2)
  const lowerGallons = FUEL_CG_DATA[lowerIndex][0];
  const upperGallons = FUEL_CG_DATA[upperIndex][0];
  const lowerArm = FUEL_CG_DATA[lowerIndex][2];
  const upperArm = FUEL_CG_DATA[upperIndex][2];

  return lowerArm + ((fuelGallons - lowerGallons) / (upperGallons - lowerGallons)) * (upperArm - lowerArm);
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
 * Add fuel to existing calculation results.
 * Accepts fuel in gallons, computes weight as gallons × 6.7 lbs/gal.
 * Returns intermediate loading points for each FUEL_CG_DATA entry to
 * produce a curved fuel line on the CG chart.
 *
 * @param cargoResult  The pre-fuel (cargo-only) baseline result
 * @param endGallons   Total fuel gallons to reach
 * @param startGallons Fuel gallons already loaded (skip these in the curve)
 */
export function addFuelToCalculation(
  cargoResult: CalculationResult,
  endGallons: number,
  startGallons: number = 0
): {
  result: CalculationResult;
  loadingPoints: LoadingPoint[];
} {
  const loadingPoints: LoadingPoint[] = [];

  // Generate intermediate loading points through FUEL_CG_DATA.
  // Each entry is [gallons, weight_lbs, moment_arm] for cumulative fuel state.
  // Skip entries at or below startGallons (already plotted).
  for (let i = 0; i < FUEL_CG_DATA.length; i++) {
    const [gal, wt, arm] = FUEL_CG_DATA[i];
    if (gal <= startGallons) continue;
    if (gal > endGallons) break;

    const totalWeight = cargoResult.sumWeight + wt;
    const totalMoment = cargoResult.sumMoment + (wt * arm);
    const ba = totalMoment / totalWeight;
    const cg = convertMomentArmToCG(ba);

    loadingPoints.push({ cg, weight: totalWeight });
  }

  // Compute the final point (with interpolation if endGallons isn't an exact table entry)
  const fuelWeight = endGallons * 6.7;
  const fuelArm = getFuelArm(endGallons);
  const fuelMoment = fuelWeight * fuelArm;

  const newTotalWeight = cargoResult.sumWeight + fuelWeight;
  const newTotalMoment = cargoResult.sumMoment + fuelMoment;
  const newBA = newTotalMoment / newTotalWeight;
  const newCG = convertMomentArmToCG(newBA);

  // Add final interpolated point if it differs from the last table entry
  const lastPoint = loadingPoints[loadingPoints.length - 1];
  if (!lastPoint || Math.abs(lastPoint.weight - newTotalWeight) > 0.1) {
    loadingPoints.push({ cg: newCG, weight: newTotalWeight });
  }

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

  return { result, loadingPoints };
}