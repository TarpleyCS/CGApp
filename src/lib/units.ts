// Shared utility functions for unit conversions

export type Units = 'LB' | 'KG';

export function convertWeight(weight: number, units: Units): number {
  return units === 'KG' ? Math.round(weight * 0.453592) : weight;
}

export function formatWeight(weight: number, units: Units): string {
  const convertedWeight = convertWeight(weight, units);
  return units === 'KG' ? `${convertedWeight.toLocaleString()} KG` : `${convertedWeight.toLocaleString()} LB`;
}

export function getWeightUnit(units: Units): string {
  return units === 'KG' ? 'kg' : 'lbs';
}

export function getWeightUnitShort(units: Units): string {
  return units === 'KG' ? 'KG' : 'LB';
}