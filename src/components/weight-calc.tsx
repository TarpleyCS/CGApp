"use client"

import React, { useState } from 'react';
import { LoadingGrid } from './loading-grid';
import { WeightChart} from './weight-chart';
import { LoadingTable } from './loading-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import shared constants and utilities
import { OEW_DATA, LOADING_PATTERNS } from '@/lib/constants';
import { 
  calculateCumulativeWeights, 
  addFuelToCalculation, 
  getFuelArm,
  type WeightData,
  type LoadingPoint,
  type CalculationResult
} from '@/lib/calculations';
import { 
  convertWeight, 
  formatWeight, 
  getDefaultWeights,
  type UnitSystem 
} from '@/lib/units';




export default function WeightCalculator() {
  const [variant, setVariant] = useState<'300ER' | '200LR'>('300ER');
  const [selectedPattern, setSelectedPattern] = useState('default');
  const [loadingPoints, setLoadingPoints] = useState<LoadingPoint[]>([
    { cg: OEW_DATA[variant].cg, weight: OEW_DATA[variant].weight }
  ]);
  const [fuelLoaded, setFuelLoaded] = useState(false);
  const [fuelWeight, setFuelWeight] = useState(0);
  const [tableData, setTableData] = useState<CalculationResult[]>([]);
  const [testWeights, setTestWeights] = useState<WeightData[]>([]);
  const [opportunityWindow, setOpportunityWindow] = useState<LoadingPoint[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');


  const handleCompute = (weights: WeightData[]) => {
    // Reset fuel state when weights change
    setFuelLoaded(false);
    setFuelWeight(0);
    
    const { results, loadingPoints: points } = calculateCumulativeWeights(weights, variant);
    
    setLoadingPoints(points);
    setTableData(results);
    
    // Calculate opportunity window if we have weights
    if (weights.length > 1 && weights.some(w => w.weight > 0)) {
      const windowPoints = calculateOpportunityWindow(weights);
      setOpportunityWindow(windowPoints);
    } else {
      setOpportunityWindow([]);
    }
  };

  const handleFuelLoad = (weight: number) => {
    if (weight <= 0) return;
    setFuelWeight(weight);
    
    const lastResult = tableData[tableData.length - 1];
    const { result, loadingPoint } = addFuelToCalculation(lastResult, weight);
    
    setLoadingPoints([...loadingPoints, loadingPoint]);
    setTableData([...tableData, result]);
    setFuelLoaded(true);
  };

  const handleTestFill = () => {
    const pattern = LOADING_PATTERNS[selectedPattern as keyof typeof LOADING_PATTERNS];
    const defaults = getDefaultWeights(unitSystem);
    const generatedWeights = pattern.map((position) => ({
      position,
      weight: Math.floor(Math.random() * (defaults.testFillMax - defaults.testFillMin)) + defaults.testFillMin
    }));
    
    setTestWeights(generatedWeights);
    handleCompute(generatedWeights);
  };

  // Simple point-in-polygon check for CG envelope
  const isPointInEnvelope = (cg: number, weight: number): boolean => {
    const envelope = variant === '300ER' ? 
      [
        { cg: 14.0, weight: 300000 },
        { cg: 14.0, weight: 460000 },
        { cg: 14.7, weight: 492000 },
        { cg: 18.0, weight: 722300 },
        { cg: 19.7, weight: 752000 },
        { cg: 23.0, weight: 758143 },
        { cg: 26.0, weight: 763815 },
        { cg: 28.2, weight: 768000 },
        { cg: 30.6, weight: 768000 },
        { cg: 37.8, weight: 752000 },
        { cg: 41.2, weight: 705300 },
        { cg: 44.0, weight: 609000 },
        { cg: 34.9, weight: 347000 },
        { cg: 23.2, weight: 300000 }
      ] : [
        { cg: 14.0, weight: 250000 },
        { cg: 14.0, weight: 460000 },
        { cg: 16.3, weight: 582000 },
        { cg: 20.9, weight: 646300 },
        { cg: 23.0, weight: 650000 },
        { cg: 27.4, weight: 657000 },
        { cg: 31.1, weight: 657000 },
        { cg: 37.4, weight: 642000 },
        { cg: 44.0, weight: 565000 },
        { cg: 44.0, weight: 250000 }
      ];

    // Simple bounds check - if outside basic bounds, definitely not in envelope
    if (cg < 14.0 || cg > 44.0) return false;
    if (weight < 250000 || weight > 768000) return false;

    // For more precise check, we'd need full point-in-polygon algorithm
    // For now, do a simplified envelope check
    const maxWeightForCG = getMaxWeightForCG(cg, envelope);
    const minWeightForCG = getMinWeightForCG(cg, envelope);
    
    return weight >= minWeightForCG && weight <= maxWeightForCG;
  };

  const getMaxWeightForCG = (targetCG: number, envelope: Array<{cg: number, weight: number}>): number => {
    // Find the maximum weight allowed for a given CG
    let maxWeight = 0;
    for (let i = 0; i < envelope.length - 1; i++) {
      const p1 = envelope[i];
      const p2 = envelope[i + 1];
      
      if ((p1.cg <= targetCG && targetCG <= p2.cg) || (p2.cg <= targetCG && targetCG <= p1.cg)) {
        // Interpolate weight for this CG
        const ratio = (targetCG - p1.cg) / (p2.cg - p1.cg);
        const interpolatedWeight = p1.weight + ratio * (p2.weight - p1.weight);
        maxWeight = Math.max(maxWeight, interpolatedWeight);
      }
    }
    return maxWeight || 768000; // Default max if not found
  };

  const getMinWeightForCG = (targetCG: number, envelope: Array<{cg: number, weight: number}>): number => {
    // Find the minimum weight allowed for a given CG
    let minWeight = Infinity;
    for (let i = 0; i < envelope.length - 1; i++) {
      const p1 = envelope[i];
      const p2 = envelope[i + 1];
      
      if ((p1.cg <= targetCG && targetCG <= p2.cg) || (p2.cg <= targetCG && targetCG <= p1.cg)) {
        // Interpolate weight for this CG
        const ratio = (targetCG - p1.cg) / (p2.cg - p1.cg);
        const interpolatedWeight = p1.weight + ratio * (p2.weight - p1.weight);
        minWeight = Math.min(minWeight, interpolatedWeight);
      }
    }
    return minWeight === Infinity ? 250000 : minWeight; // Default min if not found
  };

  const handleOptimize = () => {
    if (tableData.length === 0) return;

    const currentWeights = testWeights.length > 0 ? testWeights : [];
    if (currentWeights.length === 0) return;

    // Try different arrangements to find one that keeps final CG in optimal range
    let bestWeights = [...currentWeights];
    let bestScore = Infinity;

    // Try 50 random arrangements
    for (let attempt = 0; attempt < 50; attempt++) {
      // Shuffle the weights but keep positions in order
      const shuffledWeights = [...currentWeights];
      for (let i = shuffledWeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledWeights[i].weight, shuffledWeights[j].weight] = [shuffledWeights[j].weight, shuffledWeights[i].weight];
      }

      // Calculate the result for this arrangement
      const { loadingPoints: points } = calculateCumulativeWeights(shuffledWeights, variant);
      
      if (points.length < 2) continue;
      
      // Focus primarily on final CG position (last point in loading sequence)
      const finalPoint = points[points.length - 1];
      let score = 0;
      let finalViolation = 0;
      
      // Heavy penalty if final CG is out of envelope
      if (!isPointInEnvelope(finalPoint.cg, finalPoint.weight)) {
        const envelope = variant === '300ER' ? 
          [{ cg: 14.0, weight: 300000 }, { cg: 44.0, weight: 609000 }] : 
          [{ cg: 14.0, weight: 250000 }, { cg: 44.0, weight: 565000 }];
        const maxAllowed = getMaxWeightForCG(finalPoint.cg, envelope);
        finalViolation = Math.abs(finalPoint.weight - maxAllowed);
        score += 1000000; // Heavy penalty for final CG violation
      }
      
      // Secondary consideration: intermediate points
      let intermediateViolations = 0;
      points.forEach((point, index) => {
        if (index === 0 || index === points.length - 1) return; // Skip OEW and final point
        
        if (!isPointInEnvelope(point.cg, point.weight)) {
          intermediateViolations += 1;
        }
      });
      
      // Prefer arrangements that keep final CG in bounds, then minimize intermediate violations
      const totalScore = score + (finalViolation * 10000) + (intermediateViolations * 1000);
      
      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestWeights = [...shuffledWeights];
      }
    }

    // Apply the best arrangement found
    setTestWeights(bestWeights);
    handleCompute(bestWeights);
  };

  const calculateOpportunityWindow = (weights: WeightData[]): LoadingPoint[] => {
    if (weights.length === 0) return [];

    const pattern = LOADING_PATTERNS[selectedPattern as keyof typeof LOADING_PATTERNS];
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) return [];

    // Generate multiple arrangements to find min/max CG for the FINAL weight only
    const arrangements: WeightData[][] = [];
    
    // Add current arrangement
    arrangements.push([...weights]);
    
    // Generate systematic arrangements to explore CG range
    const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);
    const numArrangements = Math.min(100, factorial(Math.min(weights.length, 7))); // Limit to prevent too many calculations
    
    for (let i = 0; i < numArrangements; i++) {
      const shuffled = [...weights];
      // Use different shuffling strategies
      if (i < 20) {
        // Forward-biased arrangements (heavy weights first)
        shuffled.sort((a, b) => b.weight - a.weight);
        if (i > 0) {
          // Add some randomness
          for (let j = 0; j < i; j++) {
            const idx1 = Math.floor(Math.random() * shuffled.length);
            const idx2 = Math.floor(Math.random() * shuffled.length);
            [shuffled[idx1].weight, shuffled[idx2].weight] = [shuffled[idx2].weight, shuffled[idx1].weight];
          }
        }
      } else if (i < 40) {
        // Aft-biased arrangements (light weights first)
        shuffled.sort((a, b) => a.weight - b.weight);
        if (i > 20) {
          // Add some randomness
          for (let j = 0; j < (i - 20); j++) {
            const idx1 = Math.floor(Math.random() * shuffled.length);
            const idx2 = Math.floor(Math.random() * shuffled.length);
            [shuffled[idx1].weight, shuffled[idx2].weight] = [shuffled[idx2].weight, shuffled[idx1].weight];
          }
        }
      } else {
        // Random arrangements
        for (let j = shuffled.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [shuffled[j].weight, shuffled[k].weight] = [shuffled[k].weight, shuffled[j].weight];
        }
      }
      
      // Reassign positions based on pattern
      const arrangedWeights = shuffled.map((w, idx) => ({
        ...w,
        position: pattern[idx]
      }));
      
      arrangements.push(arrangedWeights);
    }

    // Calculate FINAL CG for all arrangements (only last point matters)
    let minFinalCG = Infinity;
    let maxFinalCG = -Infinity;
    let finalWeight = 0;
    
    arrangements.forEach(arrangement => {
      const { loadingPoints: points } = calculateCumulativeWeights(arrangement, variant);
      if (points.length > 1) {
        const finalPoint = points[points.length - 1]; // Last point (final weight)
        finalWeight = finalPoint.weight;
        minFinalCG = Math.min(minFinalCG, finalPoint.cg);
        maxFinalCG = Math.max(maxFinalCG, finalPoint.cg);
      }
    });

    // Return only the min/max range for the final weight
    if (minFinalCG !== Infinity && maxFinalCG !== -Infinity && minFinalCG !== maxFinalCG) {
      return [
        { cg: minFinalCG, weight: finalWeight },
        { cg: maxFinalCG, weight: finalWeight }
      ];
    }

    return [];
  };

  const handleOpportunitySelect = (direction: 'forward' | 'aft') => {
    const currentWeights = testWeights.length > 0 ? testWeights : [];
    if (currentWeights.length === 0) return;

    const pattern = LOADING_PATTERNS[selectedPattern as keyof typeof LOADING_PATTERNS];
    let bestWeights = [...currentWeights];
    let bestCG = direction === 'forward' ? -Infinity : Infinity;

    // Generate multiple arrangements to find the one with max forward or aft CG
    const numArrangements = Math.min(200, 5040); // Limit to prevent excessive calculations
    
    for (let attempt = 0; attempt < numArrangements; attempt++) {
      const shuffled = [...currentWeights];
      
      if (attempt === 0) {
        // First attempt: current arrangement
        // Do nothing, keep current order
      } else if (attempt < 50) {
        // Strategic arrangements for forward CG (heavy weights first for forward CG)
        if (direction === 'forward') {
          shuffled.sort((a, b) => b.weight - a.weight);
        } else {
          shuffled.sort((a, b) => a.weight - b.weight);
        }
        // Add some randomness based on attempt number
        for (let i = 0; i < Math.floor(attempt / 10); i++) {
          const idx1 = Math.floor(Math.random() * shuffled.length);
          const idx2 = Math.floor(Math.random() * shuffled.length);
          [shuffled[idx1].weight, shuffled[idx2].weight] = [shuffled[idx2].weight, shuffled[idx1].weight];
        }
      } else {
        // Random arrangements
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i].weight, shuffled[j].weight] = [shuffled[j].weight, shuffled[i].weight];
        }
      }

      // Reassign positions based on pattern
      const arrangedWeights = shuffled.map((w, idx) => ({
        ...w,
        position: pattern[idx]
      }));

      // Calculate the final CG for this arrangement
      const { loadingPoints: points } = calculateCumulativeWeights(arrangedWeights, variant);
      
      if (points.length > 1) {
        const finalPoint = points[points.length - 1];
        const isNewBest = direction === 'forward' ? 
          finalPoint.cg > bestCG : 
          finalPoint.cg < bestCG;
        
        if (isNewBest) {
          bestCG = finalPoint.cg;
          bestWeights = [...arrangedWeights];
        }
      }
    }

    // Apply the best arrangement found
    setTestWeights(bestWeights);
    handleCompute(bestWeights);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-96 lg:w-96 md:w-80 sm:w-72'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative min-w-16`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">777 Weight & Balance</h1>
              
              {/* Aircraft Variant Selection */}
              <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                setVariant('300ER');
                setLoadingPoints([{ cg: OEW_DATA['300ER'].cg, weight: OEW_DATA['300ER'].weight }]);
                setTableData([]);
                setFuelLoaded(false);
                setFuelWeight(0);
                setTestWeights([]);
                setOpportunityWindow([]);
              }}
              variant={variant === '300ER' ? 'default' : 'outline'}
              size="sm"
            >
              777-300ER
            </Button>
            <Button
              onClick={() => {
                setVariant('200LR');
                setLoadingPoints([{ cg: OEW_DATA['200LR'].cg, weight: OEW_DATA['200LR'].weight }]);
                setTableData([]);
                setFuelLoaded(false);
                setFuelWeight(0);
                setTestWeights([]);
                setOpportunityWindow([]);
              }}
              variant={variant === '200LR' ? 'default' : 'outline'}
              size="sm"
            >
              777-200LR
            </Button>
              </div>
              
              {/* Unit System Toggle */}
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => setUnitSystem('imperial')}
                  variant={unitSystem === 'imperial' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                >
                  Imperial (lbs)
                </Button>
                <Button
                  onClick={() => setUnitSystem('metric')}
                  variant={unitSystem === 'metric' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                >
                  Metric (kg)
                </Button>
              </div>
            </div>
          )}
          
          {/* Collapse Button */}
          <Button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            {sidebarCollapsed ? '→' : '←'}
          </Button>
        </div>

        {/* Controls */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Loading Pattern</label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={selectedPattern}
              onChange={(e) => {
                setSelectedPattern(e.target.value);
                setTableData([]);
                setLoadingPoints([{ 
                  cg: OEW_DATA[variant].cg,
                  weight: OEW_DATA[variant].weight 
                }]);
                setFuelLoaded(false);
                setFuelWeight(0);
                setTestWeights([]);
                setOpportunityWindow([]);
              }}
            >
              <option value="default">Default Loading Pattern</option>
              <option value="forward">Forward Loading</option>
              <option value="aft">Aft Loading</option>
              <option value="balanced">Balanced Loading</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleTestFill}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100"
            >
              Test Fill
            </Button>
            <Button
              onClick={handleOptimize}
              variant="outline"
              size="sm"
              className="bg-green-50 hover:bg-green-100"
              disabled={tableData.length === 0}
            >
              Optimize
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleOpportunitySelect('forward')}
              variant="outline"
              size="sm"
              className="bg-purple-50 hover:bg-purple-100"
              disabled={opportunityWindow.length === 0}
            >
              Max Fwd CG
            </Button>
            <Button
              onClick={() => handleOpportunitySelect('aft')}
              variant="outline"
              size="sm"
              className="bg-orange-50 hover:bg-orange-100"
              disabled={opportunityWindow.length === 0}
            >
              Max Aft CG
            </Button>
          </div>
          </div>
        )}

        {/* Scrollable Loading Grid */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            <LoadingGrid 
              key={selectedPattern}
              onWeightChange={handleCompute} 
              onFuelLoad={handleFuelLoad}
              loadingSequence={[...LOADING_PATTERNS[selectedPattern as keyof typeof LOADING_PATTERNS]]}
              initialWeights={testWeights}
              unitSystem={unitSystem}
            />
          </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chart and Data Section */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="chart" className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 bg-white px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger value="chart">CG Envelope Chart</TabsTrigger>
                <TabsTrigger value="data">Loading Data</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-4">
              <TabsContent value="chart" className="h-full mt-0">
                <Card className="h-full">
                  <CardContent className="h-full p-4">
                    <div className="h-full">
                      {variant === '300ER' ? (
                        <WeightChart
                          variant="300ER"
                          loadingPoints={loadingPoints}
                          opportunityWindow={opportunityWindow}
                          unitSystem={unitSystem}
                        />
                      ) : (
                        <WeightChart
                          variant="200LR"
                          loadingPoints={loadingPoints}
                          opportunityWindow={opportunityWindow}
                          unitSystem={unitSystem}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="h-full mt-0">
                <Card className="h-full">
                  <CardContent className="h-full p-4 overflow-auto">
                    {tableData.length > 1 ? (
                      <LoadingTable data={tableData} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <p className="text-lg">No loading data available</p>
                          <p className="text-sm">Use the Test Fill button or manually add weights to see loading progression data</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Summary Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Summary</h2>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {tableData.length > 1 ? (
              <div className="space-y-4">
                {/* Weight Summary */}
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg bg-blue-50">
                    <div className="font-bold text-sm">ZFW</div>
                    <div className="text-xl font-mono">
                      {formatWeight(
                        convertWeight(
                          fuelLoaded ? 
                            loadingPoints[loadingPoints.length - 2].weight : 
                            loadingPoints[loadingPoints.length - 1].weight,
                          'imperial',
                          unitSystem
                        ),
                        unitSystem
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {fuelLoaded ? 
                        loadingPoints[loadingPoints.length - 2].cg.toFixed(2) : 
                        loadingPoints[loadingPoints.length - 1].cg.toFixed(2)}% MAC
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-yellow-50">
                    <div className="font-bold text-sm">Fuel</div>
                    <div className="text-xl font-mono">
                      {formatWeight(convertWeight(fuelWeight, 'imperial', unitSystem), unitSystem)}
                    </div>
                    {fuelLoaded && (
                      <div className="text-xs text-gray-600">
                        Arm: {getFuelArm(fuelWeight).toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-3 border rounded-lg ${fuelLoaded ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <div className="font-bold text-sm">TOW</div>
                    <div className="text-xl font-mono">
                      {formatWeight(
                        convertWeight(loadingPoints[loadingPoints.length - 1].weight, 'imperial', unitSystem),
                        unitSystem
                      )}
                    </div>
                    <div className={`text-xs ${fuelLoaded ? 'text-green-600' : 'text-orange-600'}`}>
                      {loadingPoints[loadingPoints.length - 1].cg.toFixed(2)}% MAC
                    </div>
                  </div>
                </div>

                {/* CG Opportunity Range */}
                {opportunityWindow.length > 0 && (
                  <div className="p-3 border rounded-lg bg-cyan-50">
                    <h3 className="font-bold text-sm mb-2">CG Opportunity Range</h3>
                    <p className="text-xs text-gray-600 mb-2">
                      Range of possible CG positions with current cargo weights
                    </p>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Forward-most:</span>
                        <span className="font-mono">{Math.max(...opportunityWindow.map(p => p.cg)).toFixed(2)}% MAC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aft-most:</span>
                        <span className="font-mono">{Math.min(...opportunityWindow.map(p => p.cg)).toFixed(2)}% MAC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Flexibility:</span>
                        <span className="font-mono">{(Math.max(...opportunityWindow.map(p => p.cg)) - Math.min(...opportunityWindow.map(p => p.cg))).toFixed(2)}% MAC</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Status */}
                <div className="p-3 border rounded-lg bg-gray-50">
                  <h3 className="font-bold text-sm mb-2">Current Status</h3>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Aircraft:</span>
                      <span className="font-mono">777-{variant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pattern:</span>
                      <span className="font-mono capitalize">{selectedPattern}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pallets:</span>
                      <span className="font-mono">{testWeights.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fuel Status:</span>
                      <span className={`font-mono ${fuelLoaded ? 'text-green-600' : 'text-orange-600'}`}>
                        {fuelLoaded ? 'Loaded' : 'Not Loaded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Envelope Status */}
                {loadingPoints.length > 1 && (
                  <div className="p-3 border rounded-lg">
                    <h3 className="font-bold text-sm mb-2">Envelope Status</h3>
                    <div className="text-xs">
                      {loadingPoints.slice(1).every(point => 
                        isPointInEnvelope(point.cg, point.weight)
                      ) ? (
                        <div className="text-green-600 font-medium">✓ All points within envelope</div>
                      ) : (
                        <div className="text-red-600 font-medium">⚠ Some points outside envelope</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <p className="text-sm">No data available</p>
                  <p className="text-xs mt-1">Use Test Fill to see summary</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 