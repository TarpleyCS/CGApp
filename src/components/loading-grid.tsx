"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_LOADING_SEQUENCE, LOWER_DECK_POSITIONS, PALLET_WEIGHT_LIMITS } from '@/lib/constants';
import { convertWeight, getWeightUnit, type Units } from '@/lib/units';

/** Return the max weight (lbs) for a given position code. */
function getMaxWeight(position: string): number {
  return LOWER_DECK_POSITIONS.has(position)
    ? PALLET_WEIGHT_LIMITS.LOWER_DECK
    : PALLET_WEIGHT_LIMITS.MAIN_DECK;
}

interface LoadingGridProps {
  onWeightChange: (weights: Array<{ weight: number; position: string }>) => void;
  onFuelLoad?: (fuelGallons: number) => void;
  loadingSequence?: string[];
  initialWeights?: Array<{ weight: number; position: string }>;
  units?: Units;
}

// Default pallet weight in pounds
const DEFAULT_PALLET_WEIGHT = 5000;

export function LoadingGrid({
  onWeightChange,
  onFuelLoad,
  loadingSequence = [...DEFAULT_LOADING_SEQUENCE],
  initialWeights,
  units = 'LB'
}: LoadingGridProps) {
  const [weights, setWeights] = useState<Array<{ weight: number; position: string; id: string }>>(() => {
    if (initialWeights && initialWeights.length > 0) {
      return initialWeights.map((w, i) => ({ ...w, id: `${w.position}-${i}` }));
    }
    return [{ weight: DEFAULT_PALLET_WEIGHT, position: loadingSequence[0], id: `${loadingSequence[0]}-0` }];
  });
  const [fuelGallons, setFuelGallons] = useState<number>(0);

  useEffect(() => {
    if (initialWeights && initialWeights.length > 0) {
      setWeights(initialWeights.map((w, i) => ({ ...w, id: `${w.position}-${i}` })));
    }
  }, [initialWeights]);

  const handleWeightChange = (index: number, value: string) => {
    // Convert input value from display units to pounds (for internal calculations)
    const inputWeight = Number(value) || 0;
    // If user is entering KG, convert to LB; otherwise keep as LB
    const weightInPounds = units === 'KG' ? Math.round(inputWeight / 0.453592) : inputWeight;

    // Clamp to per-position limit
    const position = weights[index].position;
    const maxLbs = getMaxWeight(position);
    const clampedWeight = Math.min(weightInPounds, maxLbs);

    const newWeights = weights.map((w, i) =>
      i === index ? { ...w, weight: clampedWeight } : w
    );
    setWeights(newWeights);
    onWeightChange(newWeights.map(({ weight, position: pos }) => ({ weight, position: pos })));
  };

  const addWeight = () => {
    if (weights.length >= loadingSequence.length) {
      return; // Maximum positions reached
    }

    const nextPosition = loadingSequence[weights.length];
    const newWeights = [...weights, { weight: DEFAULT_PALLET_WEIGHT, position: nextPosition, id: `${nextPosition}-${weights.length}` }];
    setWeights(newWeights);
    onWeightChange(newWeights.map(({ weight, position }) => ({ weight, position })));
  };

  const removeWeight = (index: number) => {
    // Don't remove if it would leave us with no weights
    if (weights.length === 1) {
      const resetWeights = [{ weight: 0, position: DEFAULT_LOADING_SEQUENCE[0], id: `${DEFAULT_LOADING_SEQUENCE[0]}-0` }];
      setWeights(resetWeights);
      onWeightChange(resetWeights.map(({ weight, position }) => ({ weight, position })));
      return;
    }

    const newWeights = weights.filter((_, i) => i !== index);
    setWeights(newWeights);
    onWeightChange(newWeights.map(({ weight, position }) => ({ weight, position })));
  };

  const handleFuelChange = (value: string) => {
    const gallons = Number(value) || 0;
    setFuelGallons(gallons);
  };

  const handleLoadFuel = () => {
    if (onFuelLoad) {
      onFuelLoad(fuelGallons);
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="font-bold text-center mb-4 text-black">Pallet Loading Sequence</div>
          {weights.map((weight, index) => (
            <div key={weight.id} className="flex items-center gap-2">
              <div className="w-20 text-right text-sm text-black">
                {`${index + 1}. ${weight.position}`}
              </div>
              <input
                type="number"
                value={weight.weight ? convertWeight(weight.weight, units) : ''}
                onChange={(e) => handleWeightChange(index, e.target.value)}
                onKeyDown={(e) => {
                  // Prevent arrow keys from triggering unwanted behavior
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.stopPropagation();
                  }
                }}
                onWheel={(e) => {
                  // Prevent mouse wheel from changing number input values when focused
                  if (document.activeElement === e.currentTarget) {
                    e.preventDefault();
                  }
                }}
                className={`flex-1 px-3 py-2 border rounded-md text-center text-black ${
                  weight.weight > getMaxWeight(weight.position) ? 'border-red-500 bg-red-50' : ''
                }`}
                min={0}
                max={Math.round(convertWeight(getMaxWeight(weight.position), units))}
                step={units === 'KG' ? 10 : 100}
                placeholder={`Max ${Math.round(convertWeight(getMaxWeight(weight.position), units)).toLocaleString()} ${getWeightUnit(units)}`}
              />
              <button
                onClick={() => removeWeight(index)}
                disabled={weights.length === 1}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove pallet"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          ))}
          <div className="flex gap-4 text-black">
            <Button
              onClick={addWeight}
              variant="outline"
              className="flex-1"
              disabled={weights.length >= DEFAULT_LOADING_SEQUENCE.length}
            >
              Add Pallet
            </Button>
          </div>

          {weights.length >= DEFAULT_LOADING_SEQUENCE.length && (
            <div className="text-sm text-amber-600 text-center">
              Maximum loading positions reached
            </div>
          )}

          {/* Fuel Loading Section */}
          {onFuelLoad && (
            <div className="mt-8 pt-4 border-t">
              <div className="font-bold text-center mb-4 text-black">Fuel Loading</div>
              <div className="flex items-center gap-2">
                <div className="w-20 text-right text-sm text-black">
                  Fuel (gal.)
                </div>
                <input
                  type="number"
                  value={fuelGallons || ''}
                  onChange={(e) => handleFuelChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-center text-black"
                  min={0}
                  max={47890}
                  step={100}
                  placeholder="Enter fuel (gallons)"
                />
              </div>
              <Button
                onClick={handleLoadFuel}
                className="w-full mt-4"
                variant="default"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 22v-3" />
                  <path d="M6 17h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Z" />
                  <path d="M14 17v5" />
                  <path d="M18 17v5" />
                  <path d="M10 17v2" />
                  <path d="M3 11h2" />
                  <path d="M13 5V2" />
                  <path d="M19 5V3" />
                </svg>
                Load Fuel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
