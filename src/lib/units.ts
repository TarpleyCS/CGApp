// Unit conversion utilities for weight and balance calculations

export type UnitSystem = 'imperial' | 'metric';

// Conversion constants
const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;

// Weight conversion functions
export function convertWeight(weight: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return weight;
  
  if (from === 'imperial' && to === 'metric') {
    return weight * LBS_TO_KG;
  } else if (from === 'metric' && to === 'imperial') {
    return weight * KG_TO_LBS;
  }
  
  return weight;
}

// Format weight with appropriate unit label
export function formatWeight(weight: number, unitSystem: UnitSystem, includeUnit: boolean = true): string {
  const formatted = new Intl.NumberFormat().format(Math.round(weight));
  if (!includeUnit) return formatted;
  
  const unit = unitSystem === 'imperial' ? 'lbs' : 'kg';
  return `${formatted} ${unit}`;
}

// Get unit label
export function getWeightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
}

// Get max weight limits for input validation (in the specified unit system)
export function getMaxWeightLimits(unitSystem: UnitSystem) {
  const limits = {
    pallet: unitSystem === 'imperial' ? 12000 : 5443, // 12,000 lbs = ~5,443 kg
    fuel: unitSystem === 'imperial' ? 270000 : 122472, // 270,000 lbs = ~122,472 kg
    maxTakeoff: unitSystem === 'imperial' ? 768000 : 348455, // 768,000 lbs = ~348,455 kg
  };
  
  return limits;
}

// Convert weight step sizes for inputs
export function getWeightStep(unitSystem: UnitSystem, type: 'pallet' | 'fuel'): number {
  if (unitSystem === 'imperial') {
    return type === 'pallet' ? 500 : 1000;
  } else {
    return type === 'pallet' ? 227 : 454; // ~500 lbs and ~1000 lbs in kg
  }
}

// Convert default weights for different systems
export function getDefaultWeights(unitSystem: UnitSystem) {
  return {
    pallet: unitSystem === 'imperial' ? 500 : 227, // 500 lbs ≈ 227 kg
    palletAdd: unitSystem === 'imperial' ? 6000 : 2722, // 6000 lbs ≈ 2722 kg
    testFillMin: unitSystem === 'imperial' ? 5000 : 2268, // 5000 lbs ≈ 2268 kg
    testFillMax: unitSystem === 'imperial' ? 8000 : 3629, // 8000 lbs ≈ 3629 kg
  };
}