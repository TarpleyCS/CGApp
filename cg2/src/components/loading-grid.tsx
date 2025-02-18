"use client"
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingGridProps {
  onWeightChange: (weights: Array<{ weight: number; position: string }>) => void;
  onCompute: () => void;
  loadingSequence?: string[];
}



// Define loading sequence based on the provided spreadsheet
const LOADING_SEQUENCE = [
  'R', 'PL', 'PR', 'AL', 'AR', 'BL', 'BR', 'CL', 'CR', 'DL', 'DR',
  'EL', 'ER', 'FL', 'FR', 'GL', 'GR', 'HL', 'HR', 'JL', 'JR',
  'KL', 'KR', 'LR', 'LL', 'ML', 'MR'
];

export function LoadingGrid({ onWeightChange, onCompute, loadingSequence = LOADING_SEQUENCE }: LoadingGridProps) {
  const [weights, setWeights] = useState<Array<{ weight: number; position: string }>>([
    { weight: 500, position: loadingSequence[0] }
  ]);

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
      const resetWeights = [{ weight: 0, position: LOADING_SEQUENCE[0] }];
      setWeights(resetWeights);
      onWeightChange(resetWeights);
      return;
    }

    const newWeights = weights.filter((_, i) => i !== index);
    setWeights(newWeights);
    onWeightChange(newWeights);
  };

  return (
    <Card>
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
              disabled={weights.length >= LOADING_SEQUENCE.length}
            >
              Add Pallet
            </Button>
          </div>
          
          {weights.length >= LOADING_SEQUENCE.length && (
            <div className="text-sm text-amber-600 text-center">
              Maximum loading positions reached
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}