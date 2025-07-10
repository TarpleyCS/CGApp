"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_LOADING_SEQUENCE } from '@/lib/constants';

interface LoadingGridProps {
  onWeightChange: (weights: Array<{ weight: number; position: string }>) => void;
  onFuelLoad?: (fuelWeight: number) => void;
  loadingSequence?: string[];
  initialWeights?: Array<{ weight: number; position: string }>;
}


export function LoadingGrid({ 
  onWeightChange, 
  onFuelLoad, 
  loadingSequence = [...DEFAULT_LOADING_SEQUENCE],
  initialWeights
}: LoadingGridProps) {
  const [weights, setWeights] = useState<Array<{ weight: number; position: string }>>(() => {
    if (initialWeights && initialWeights.length > 0) {
      return initialWeights;
    }
    return [{ weight: 500, position: loadingSequence[0] }];
  });
  const [fuelWeight, setFuelWeight] = useState<number>(0);

  useEffect(() => {
    if (initialWeights && initialWeights.length > 0) {
      setWeights(initialWeights);
    }
  }, [initialWeights]);

  const handleWeightChange = (index: number, value: string) => {
    const newWeights = weights.map((w, i) => 
      i === index ? { ...w, weight: Number(value) || 0 } : w
    );
    setWeights(newWeights);
    onWeightChange(newWeights);
  };

  const addWeight = () => {
    if (weights.length >= loadingSequence.length) {
      return; // Maximum positions reached
    }
    
    const nextPosition = loadingSequence[weights.length];
    const newWeights = [...weights, { weight: 6000, position: nextPosition }];
    setWeights(newWeights);
    onWeightChange(newWeights);
  };

  const removeWeight = (index: number) => {
    // Don't remove if it would leave us with no weights
    if (weights.length === 1) {
      const resetWeights = [{ weight: 0, position: DEFAULT_LOADING_SEQUENCE[0] }];
      setWeights(resetWeights);
      onWeightChange(resetWeights);
      return;
    }

    const newWeights = weights.filter((_, i) => i !== index);
    setWeights(newWeights);
    onWeightChange(newWeights);
  };

  const handleFuelChange = (value: string) => {
    const newFuelWeight = Number(value) || 0;
    setFuelWeight(newFuelWeight);
  };

  const handleLoadFuel = () => {
    if (onFuelLoad) {
      onFuelLoad(fuelWeight);
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="font-bold text-center mb-4">Pallet Loading Sequence</div>
          {weights.map((weight, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-20 text-right text-sm text-gray-500">
                {`${index + 1}. ${weight.position}`}
              </div>
              <input
                type="number"
                value={weight.weight || ''}
                onChange={(e) => handleWeightChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-center"
                min={0}
                max={12000}
                step={500}
                placeholder="Enter weight"
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
          <div className="flex gap-4">
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
              <div className="font-bold text-center mb-4">Fuel Loading</div>
              <div className="flex items-center gap-2">
                <div className="w-20 text-right text-sm text-gray-500">
                  Fuel (lb)
                </div>
                <input
                  type="number"
                  value={fuelWeight}
                  onChange={(e) => handleFuelChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-center"
                  min={0}
                  max={270000}
                  step={1000}
                  placeholder="Enter fuel weight"
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