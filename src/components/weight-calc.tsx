"use client"

import React, { useState } from 'react';
import { LoadingGrid } from './loading-grid';
import { WeightChart } from './weight-chart';
import { LoadingTable } from './loading-table';
import { AnalyticsDashboard } from './analytics-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { convertWeight, getWeightUnit } from '@/lib/units';

// Import shared constants and utilities
import { OEW_DATA, LOADING_PATTERNS, POSITION_MAP, BOEING_PALLET_SPECS, CUSTOM_PALLET_POSITIONS, WEIGHT_LIMITS, REFERENCE_TEST_FILL, LOWER_DECK_POSITIONS, PALLET_WEIGHT_LIMITS, CG_OPTIMIZATION_TARGETS } from '@/lib/constants';
import { useLoadingPatterns, useOptimizationHistory, usePatternRankings, useCustomPositions, useCustomPalletStyles } from '@/hooks/useDatabase';
import {
  calculateCumulativeWeights,
  addFuelToCalculation,
  getFuelArm,
  isPointInEnvelope,
  type WeightData,
  type LoadingPoint,
  type CalculationResult
} from '@/lib/calculations';
import {
  optimizeCargoWithPSO,
  optimizeCargoWithILP,
  createCGFitnessFunction,
  createConstraintFunction,
  createObjectiveFunction,
  type PSO_Config,
  type ILP_Config
} from '@/lib/optimization';




export default function WeightCalculator() {
  const [variant, setVariant] = useState<'200LR' | '300ER'>('200LR');
  const [units, setUnits] = useState<'LB' | 'KG'>('LB');
  const [selectedPattern, setSelectedPattern] = useState('default');
  const [loadingPoints, setLoadingPoints] = useState<LoadingPoint[]>([
    { cg: OEW_DATA[variant].cg, weight: OEW_DATA[variant].weight }
  ]);
  const [fuelLoaded, setFuelLoaded] = useState(false);
  const [fuelGallons, setFuelGallons] = useState(0);
  const [fuelLoadingPoints, setFuelLoadingPoints] = useState<LoadingPoint[]>([]);
  const [tableData, setTableData] = useState<CalculationResult[]>([]);
  const [testWeights, setTestWeights] = useState<WeightData[]>([]);
  const [fillKey, setFillKey] = useState(0);
  const [opportunityWindow, setOpportunityWindow] = useState<LoadingPoint[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    method: string;
    timestamp: number;
    duration: number;
    attempts: number;
    bestScore: number;
    initialCG: number;
    finalCG: number;
    targetCG: number;
    targetRange: { min: number; max: number };
    inEnvelope: boolean;
    inTargetRange: boolean;
    weightLimitViolations: number;
    intermediateViolations: number;
    swaps: { position: string; from: number; to: number }[];
  } | null>(null);
  const [customPatterns, setCustomPatterns] = useState<{ [key: string]: string[] }>({});
  const [newPatternName, setNewPatternName] = useState('');
  const [newPatternOrder, setNewPatternOrder] = useState<string[]>([]);
  const [isCreatingPattern, setIsCreatingPattern] = useState(false);

  // Database hooks
  const { patterns: dbPatterns, savePattern } = useLoadingPatterns();
  const { saveOptimization } = useOptimizationHistory();
  const { updateRanking } = usePatternRankings();
  const { positions: dbCustomPositions, savePosition: saveCustomPosition } = useCustomPositions();
  const { styles: dbCustomPalletStyles, saveStyle: saveCustomPalletStyle } = useCustomPalletStyles();

  // Pattern rating state - reserved for future use
  // const [patternRatings, setPatternRatings] = useState<{[key: string]: number}>({});
  // const [showRatingDialog, setShowRatingDialog] = useState<string | null>(null);

  // Pallet style management
  const [customPalletStyles, setCustomPalletStyles] = useState<{
    [key: string]: {
      description: string;
      maxWeight: number;
      dimensions: string;
      momentMultiplier: number;
      category: string;
    }
  }>({});
  const [newPalletName, setNewPalletName] = useState('');
  const [newPalletDescription, setNewPalletDescription] = useState('');
  const [newPalletMaxWeight, setNewPalletMaxWeight] = useState(0);
  const [newPalletDimensions, setNewPalletDimensions] = useState('');
  const [newPalletMomentMultiplier, setNewPalletMomentMultiplier] = useState(1.0);
  const [newPalletCategory, setNewPalletCategory] = useState('Container');
  const [isCreatingPallet, setIsCreatingPallet] = useState(false);

  // Custom pallet position management
  const [customPalletPositions, setCustomPalletPositions] = useState<{
    [key: string]: {
      name: string;
      momentArm: number;
      palletType: string;
    }
  }>({});
  const [newPositionCode, setNewPositionCode] = useState('');
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionMomentArm, setNewPositionMomentArm] = useState(0);
  const [newPositionPalletType, setNewPositionPalletType] = useState('LD3');
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);


  const handleCompute = (weights: WeightData[]) => {
    // Reset fuel state when weights change
    setFuelLoaded(false);
    setFuelGallons(0);
    setFuelLoadingPoints([]);

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

  const handleFuelLoad = (gallons: number) => {
    if (gallons <= 0) return;

    const previousGallons = fuelGallons;
    const newTotalGallons = fuelGallons + gallons;

    // Always use the cargo-only baseline (last non-FUEL entry)
    const cargoBaseline = fuelLoaded
      ? tableData[tableData.length - 2]
      : tableData[tableData.length - 1];

    const { result, loadingPoints: fuelPoints } = addFuelToCalculation(
      cargoBaseline, newTotalGallons, previousGallons
    );

    // Append new intermediate fuel points to the separate fuel line
    setFuelLoadingPoints([...fuelLoadingPoints, ...fuelPoints]);

    // Replace existing FUEL row or add new one
    if (fuelLoaded) {
      setTableData([...tableData.slice(0, -1), result]);
    } else {
      setTableData([...tableData, result]);
    }

    setFuelGallons(newTotalGallons);
    setFuelLoaded(true);
  };

  const handleTestFill = () => {
    const allPatterns = getAllPatterns() as Record<string, readonly string[]>;
    const pattern = allPatterns[selectedPattern] || LOADING_PATTERNS.default;
    const generatedWeights = pattern.map((position) => {
      const maxLbs = LOWER_DECK_POSITIONS.has(position)
        ? PALLET_WEIGHT_LIMITS.LOWER_DECK
        : PALLET_WEIGHT_LIMITS.MAIN_DECK;
      const minLbs = Math.min(2000, maxLbs);
      return {
        position,
        weight: Math.floor(Math.random() * (maxLbs - minLbs)) + minLbs
      };
    });

    setTestWeights(generatedWeights);
    setFillKey(k => k + 1);
    handleCompute(generatedWeights);
  };

  const handleReferenceFill = () => {
    const allPatterns = getAllPatterns() as Record<string, readonly string[]>;
    const pattern = allPatterns[selectedPattern] || LOADING_PATTERNS.default;
    const referenceWeights = pattern.map((position) => ({
      position,
      weight: REFERENCE_TEST_FILL[position] || 0
    }));

    setTestWeights(referenceWeights);
    setFillKey(k => k + 1);
    handleCompute(referenceWeights);
  };


  const handleOptimize = async () => {
    if (tableData.length === 0) return;

    const currentWeights = testWeights.length > 0 ? testWeights : [];
    if (currentWeights.length === 0) return;

    const startTime = Date.now();
    const deepCopy = (arr: WeightData[]) => arr.map(w => ({ ...w }));
    const initialWeights = deepCopy(currentWeights);

    const targets = CG_OPTIMIZATION_TARGETS[variant];

    // Partition indices by deck type — only shuffle within same deck
    const mainDeckIndices: number[] = [];
    const lowerDeckIndices: number[] = [];
    currentWeights.forEach((w, i) => {
      if (LOWER_DECK_POSITIONS.has(w.position)) {
        lowerDeckIndices.push(i);
      } else {
        mainDeckIndices.push(i);
      }
    });

    // Score an arrangement: lower is better
    const scoreArrangement = (weights: WeightData[]): number => {
      let score = 0;

      // Hard penalty for lower deck position weight limit violations
      for (const w of weights) {
        if (LOWER_DECK_POSITIONS.has(w.position) && w.weight > PALLET_WEIGHT_LIMITS.LOWER_DECK) {
          score += 500000;
        }
      }

      const { loadingPoints: points } = calculateCumulativeWeights(weights, variant);
      if (points.length < 2) return Infinity;

      const finalPoint = points[points.length - 1];

      // Heavy penalty if final CG is out of envelope
      if (!isPointInEnvelope(finalPoint.cg, finalPoint.weight, variant)) {
        score += 1000000;
      }

      // CG deviation from target
      score += Math.abs(finalPoint.cg - targets.target) * 100;

      // Extra penalty if outside target range
      if (finalPoint.cg < targets.min || finalPoint.cg > targets.max) {
        const distanceOutside = finalPoint.cg < targets.min
          ? targets.min - finalPoint.cg
          : finalPoint.cg - targets.max;
        score += distanceOutside * 5000;
      }

      // Penalty for intermediate envelope violations
      for (let i = 1; i < points.length - 1; i++) {
        if (!isPointInEnvelope(points[i].cg, points[i].weight, variant)) {
          score += 1000;
        }
      }

      return score;
    };

    let bestWeights = deepCopy(currentWeights);
    let bestScore = scoreArrangement(bestWeights);
    let totalAttempts = 0;

    // Helper to try an arrangement and update best
    const tryArrangement = (candidate: WeightData[]) => {
      totalAttempts++;
      const score = scoreArrangement(candidate);
      if (score < bestScore) {
        bestScore = score;
        bestWeights = deepCopy(candidate);
      }
    };

    // Deck-aware shuffle: only shuffle weights within main deck and within lower deck
    const deckAwareShuffle = (weights: WeightData[]): WeightData[] => {
      const result = deepCopy(weights);
      // Shuffle main deck weights among main deck positions
      const mainWeights = mainDeckIndices.map(i => result[i].weight);
      for (let i = mainWeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mainWeights[i], mainWeights[j]] = [mainWeights[j], mainWeights[i]];
      }
      mainDeckIndices.forEach((idx, i) => { result[idx].weight = mainWeights[i]; });
      // Shuffle lower deck weights among lower deck positions
      const lowerWeights = lowerDeckIndices.map(i => result[i].weight);
      for (let i = lowerWeights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lowerWeights[i], lowerWeights[j]] = [lowerWeights[j], lowerWeights[i]];
      }
      lowerDeckIndices.forEach((idx, i) => { result[idx].weight = lowerWeights[i]; });
      return result;
    };

    // --- Deterministic phase: sort-based heuristics (deck-aware) ---
    const mainWeightValues = mainDeckIndices.map(i => currentWeights[i].weight);
    const mainSortedAsc = [...mainWeightValues].sort((a, b) => a - b);
    const mainSortedDesc = [...mainWeightValues].sort((a, b) => b - a);

    // Sort main deck positions by moment arm
    const mainPosByArm = mainDeckIndices.map(i => ({
      idx: i,
      arm: POSITION_MAP[currentWeights[i].position as keyof typeof POSITION_MAP] || 0
    })).sort((a, b) => a.arm - b.arm);

    // Heavy-forward: heaviest main deck weights in forward main deck positions
    const forwardCandidate = deepCopy(currentWeights);
    mainPosByArm.forEach((pos, i) => {
      forwardCandidate[pos.idx].weight = mainSortedDesc[i];
    });
    tryArrangement(forwardCandidate);

    // Heavy-aft: heaviest main deck weights in aft main deck positions
    const aftCandidate = deepCopy(currentWeights);
    mainPosByArm.forEach((pos, i) => {
      aftCandidate[pos.idx].weight = mainSortedAsc[i];
    });
    tryArrangement(aftCandidate);

    // Balanced: heaviest weights in middle main deck positions
    const balancedCandidate = deepCopy(currentWeights);
    const mainArms = mainPosByArm.map(p => p.arm);
    const midArm = (Math.min(...mainArms) + Math.max(...mainArms)) / 2;
    const mainPosByMidDist = [...mainPosByArm].sort((a, b) =>
      Math.abs(a.arm - midArm) - Math.abs(b.arm - midArm)
    );
    mainPosByMidDist.forEach((pos, i) => {
      balancedCandidate[pos.idx].weight = mainSortedDesc[i];
    });
    tryArrangement(balancedCandidate);

    // --- Random shuffle phase: 200 attempts (deck-aware) ---
    for (let attempt = 0; attempt < 200; attempt++) {
      tryArrangement(deckAwareShuffle(currentWeights));
    }

    // Compute initial CG for results display
    const { loadingPoints: initPoints } = calculateCumulativeWeights(initialWeights, variant);
    const initialCG = initPoints.length >= 2 ? initPoints[initPoints.length - 1].cg : 0;

    // Compute final result details
    const { loadingPoints: finalPoints } = calculateCumulativeWeights(bestWeights, variant);
    const finalPoint = finalPoints[finalPoints.length - 1];
    const finalCG = finalPoint?.cg ?? 0;
    const finalWeight = finalPoint?.weight ?? 0;

    // Count violations for results
    let weightLimitViolations = 0;
    for (const w of bestWeights) {
      if (LOWER_DECK_POSITIONS.has(w.position) && w.weight > PALLET_WEIGHT_LIMITS.LOWER_DECK) {
        weightLimitViolations++;
      }
    }
    let intermediateViolations = 0;
    for (let i = 1; i < finalPoints.length - 1; i++) {
      if (!isPointInEnvelope(finalPoints[i].cg, finalPoints[i].weight, variant)) {
        intermediateViolations++;
      }
    }

    // Track what changed
    const swaps: { position: string; from: number; to: number }[] = [];
    initialWeights.forEach((w, i) => {
      if (w.weight !== bestWeights[i].weight) {
        swaps.push({ position: w.position, from: w.weight, to: bestWeights[i].weight });
      }
    });

    setOptimizationResult({
      method: 'Basic (Deck-Aware)',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      attempts: totalAttempts,
      bestScore,
      initialCG,
      finalCG,
      targetCG: targets.target,
      targetRange: { min: targets.min, max: targets.max },
      inEnvelope: isPointInEnvelope(finalCG, finalWeight, variant),
      inTargetRange: finalCG >= targets.min && finalCG <= targets.max,
      weightLimitViolations,
      intermediateViolations,
      swaps,
    });

    // Apply the best arrangement found
    setTestWeights(bestWeights);
    handleCompute(bestWeights);

    // Track optimization performance
    const success = bestScore < 1000000;
    await trackOptimization('basic', initialWeights, bestWeights, startTime, success, `${selectedPattern}-basic`);
  };

  const handleOptimizePSO = async () => {
    if (tableData.length === 0) return;

    const currentWeights = testWeights.length > 0 ? testWeights : [];
    if (currentWeights.length === 0) return;

    const startTime = Date.now();
    const initialWeights = [...currentWeights];

    const config: PSO_Config = {
      numParticles: 20,
      maxIterations: 50,
      inertiaWeight: 0.7,
      cognitiveWeight: 1.4,
      socialWeight: 1.4,
      variant
    };

    const fitnessFunction = createCGFitnessFunction(
      variant,
      CG_OPTIMIZATION_TARGETS[variant].target,
      calculateCumulativeWeights,
      isPointInEnvelope
    );

    const result = optimizeCargoWithPSO(currentWeights, config, fitnessFunction);

    // Build optimization result for display
    const targets = CG_OPTIMIZATION_TARGETS[variant];
    const { loadingPoints: initPts } = calculateCumulativeWeights(initialWeights, variant);
    const { loadingPoints: finalPts } = calculateCumulativeWeights(result.bestArrangement, variant);
    const fp = finalPts[finalPts.length - 1];
    const psoSwaps: { position: string; from: number; to: number }[] = [];
    initialWeights.forEach((w, i) => {
      if (w.weight !== result.bestArrangement[i].weight) {
        psoSwaps.push({ position: w.position, from: w.weight, to: result.bestArrangement[i].weight });
      }
    });
    let psoWtViolations = 0;
    for (const w of result.bestArrangement) {
      if (LOWER_DECK_POSITIONS.has(w.position) && w.weight > PALLET_WEIGHT_LIMITS.LOWER_DECK) psoWtViolations++;
    }
    let psoIntViolations = 0;
    for (let i = 1; i < finalPts.length - 1; i++) {
      if (!isPointInEnvelope(finalPts[i].cg, finalPts[i].weight, variant)) psoIntViolations++;
    }
    setOptimizationResult({
      method: 'PSO (Particle Swarm)',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      attempts: result.iterations * config.numParticles,
      bestScore: result.bestFitness,
      initialCG: initPts.length >= 2 ? initPts[initPts.length - 1].cg : 0,
      finalCG: fp?.cg ?? 0,
      targetCG: targets.target,
      targetRange: { min: targets.min, max: targets.max },
      inEnvelope: fp ? isPointInEnvelope(fp.cg, fp.weight, variant) : false,
      inTargetRange: fp ? fp.cg >= targets.min && fp.cg <= targets.max : false,
      weightLimitViolations: psoWtViolations,
      intermediateViolations: psoIntViolations,
      swaps: psoSwaps,
    });

    setTestWeights(result.bestArrangement);
    handleCompute(result.bestArrangement);

    // Track optimization performance
    const success = result.bestFitness < 1000;
    await trackOptimization('PSO', initialWeights, result.bestArrangement, startTime, success, `${selectedPattern}-PSO`);
  };

  const handleOptimizeILP = async () => {
    if (tableData.length === 0) return;

    const currentWeights = testWeights.length > 0 ? testWeights : [];
    if (currentWeights.length === 0) return;

    const startTime = Date.now();
    const initialWeights = [...currentWeights];

    const config: ILP_Config = {
      variant,
      maxIterations: 100,
      tolerance: 0.001
    };

    const objectiveFunction = createObjectiveFunction(
      variant,
      CG_OPTIMIZATION_TARGETS[variant].target,
      calculateCumulativeWeights
    );

    const constraintFunction = createConstraintFunction(
      variant,
      calculateCumulativeWeights,
      isPointInEnvelope
    );

    const result = optimizeCargoWithILP(currentWeights, config, objectiveFunction, constraintFunction);

    // Build optimization result for display
    const targets = CG_OPTIMIZATION_TARGETS[variant];
    const { loadingPoints: initPts } = calculateCumulativeWeights(initialWeights, variant);
    const { loadingPoints: finalPts } = calculateCumulativeWeights(result.optimalArrangement, variant);
    const fp = finalPts[finalPts.length - 1];
    const ilpSwaps: { position: string; from: number; to: number }[] = [];
    initialWeights.forEach((w, i) => {
      if (w.weight !== result.optimalArrangement[i].weight) {
        ilpSwaps.push({ position: w.position, from: w.weight, to: result.optimalArrangement[i].weight });
      }
    });
    let ilpWtViolations = 0;
    for (const w of result.optimalArrangement) {
      if (LOWER_DECK_POSITIONS.has(w.position) && w.weight > PALLET_WEIGHT_LIMITS.LOWER_DECK) ilpWtViolations++;
    }
    let ilpIntViolations = 0;
    for (let i = 1; i < finalPts.length - 1; i++) {
      if (!isPointInEnvelope(finalPts[i].cg, finalPts[i].weight, variant)) ilpIntViolations++;
    }
    setOptimizationResult({
      method: 'ILP (Integer Linear)',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      attempts: result.iterations,
      bestScore: result.optimalValue,
      initialCG: initPts.length >= 2 ? initPts[initPts.length - 1].cg : 0,
      finalCG: fp?.cg ?? 0,
      targetCG: targets.target,
      targetRange: { min: targets.min, max: targets.max },
      inEnvelope: fp ? isPointInEnvelope(fp.cg, fp.weight, variant) : false,
      inTargetRange: fp ? fp.cg >= targets.min && fp.cg <= targets.max : false,
      weightLimitViolations: ilpWtViolations,
      intermediateViolations: ilpIntViolations,
      swaps: ilpSwaps,
    });

    setTestWeights(result.optimalArrangement);
    handleCompute(result.optimalArrangement);

    // Track optimization performance
    const success = result.feasible && result.optimalValue < 1000;
    await trackOptimization('ILP', initialWeights, result.optimalArrangement, startTime, success, `${selectedPattern}-ILP`);
  };

  const handleStartPatternCreation = () => {
    setIsCreatingPattern(true);
    setNewPatternName('');
    setNewPatternOrder([]);
  };

  const handleAddPositionToPattern = (position: string) => {
    if (!newPatternOrder.includes(position)) {
      setNewPatternOrder([...newPatternOrder, position]);
    }
  };

  const handleRemovePositionFromPattern = (position: string) => {
    setNewPatternOrder(newPatternOrder.filter(p => p !== position));
  };

  const handleTogglePosition = (position: string) => {
    if (newPatternOrder.includes(position)) {
      handleRemovePositionFromPattern(position);
    } else {
      handleAddPositionToPattern(position);
    }
  };

  const handleDragStart = (e: React.DragEvent, position: string, index: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ position, index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { position, index: sourceIndex } = dragData;

    if (sourceIndex !== targetIndex) {
      const newOrder = [...newPatternOrder];
      // Remove from source position
      newOrder.splice(sourceIndex, 1);
      // Insert at target position (adjust if dragging forward)
      const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newOrder.splice(insertIndex, 0, position);
      setNewPatternOrder(newOrder);
    }
  };

  const handleDropBetween = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { position, index: sourceIndex } = dragData;

    if (sourceIndex !== targetIndex) {
      const newOrder = [...newPatternOrder];
      // Remove from source position
      newOrder.splice(sourceIndex, 1);
      // Insert at target position
      const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newOrder.splice(insertIndex, 0, position);
      setNewPatternOrder(newOrder);
    }
  };


  const handleSavePattern = async () => {
    if (newPatternName.trim() && newPatternOrder.length > 0) {
      // Save to local state
      const updatedPatterns = {
        ...customPatterns,
        [newPatternName.trim()]: [...newPatternOrder]
      };
      setCustomPatterns(updatedPatterns);

      // Save to database
      try {
        await savePattern({
          name: newPatternName.trim(),
          sequence: [...newPatternOrder],
          created_at: new Date(),
          used_count: 0,
          success_rate: 0,
          avg_final_cg: 0,
          avg_optimization_time: 0,
          rating: 3, // Default rating
          tags: ['custom', 'user-created'],
          notes: 'User-created custom pattern'
        });
      } catch (error) {
        console.error('Failed to save pattern to database:', error);
      }

      setIsCreatingPattern(false);
      setNewPatternName('');
      setNewPatternOrder([]);
    }
  };

  const handleCancelPatternCreation = () => {
    setIsCreatingPattern(false);
    setNewPatternName('');
    setNewPatternOrder([]);
  };

  const getAllPatterns = () => {
    // Combine built-in patterns, local custom patterns, and database patterns
    const dbPatternMap = dbPatterns.reduce((acc, pattern) => {
      acc[pattern.name] = pattern.sequence;
      return acc;
    }, {} as { [key: string]: string[] });

    return { ...LOADING_PATTERNS, ...customPatterns, ...dbPatternMap };
  };

  // Pallet style management functions
  const handleStartPalletCreation = () => {
    setIsCreatingPallet(true);
    setNewPalletName('');
    setNewPalletDescription('');
    setNewPalletMaxWeight(0);
    setNewPalletDimensions('');
    setNewPalletMomentMultiplier(1.0);
    setNewPalletCategory('Container');
  };

  const handleSavePallet = async () => {
    if (newPalletName.trim() && newPalletDescription.trim()) {
      // Save to local state
      const updatedPallets = {
        ...customPalletStyles,
        [newPalletName.trim()]: {
          description: newPalletDescription.trim(),
          maxWeight: newPalletMaxWeight,
          dimensions: newPalletDimensions.trim(),
          momentMultiplier: newPalletMomentMultiplier,
          category: newPalletCategory
        }
      };
      setCustomPalletStyles(updatedPallets);

      // Save to database
      try {
        await saveCustomPalletStyle({
          name: newPalletName.trim(),
          description: newPalletDescription.trim(),
          max_weight: newPalletMaxWeight,
          dimensions: newPalletDimensions.trim(),
          moment_multiplier: newPalletMomentMultiplier,
          category: newPalletCategory,
          created_at: new Date(),
          used_count: 0,
          notes: 'User-created custom pallet style'
        });
      } catch (error) {
        console.error('Failed to save pallet style to database:', error);
      }

      setIsCreatingPallet(false);
      handleCancelPalletCreation();
    }
  };

  const handleCancelPalletCreation = () => {
    setIsCreatingPallet(false);
    setNewPalletName('');
    setNewPalletDescription('');
    setNewPalletMaxWeight(0);
    setNewPalletDimensions('');
    setNewPalletMomentMultiplier(1.0);
    setNewPalletCategory('Container');
  };

  const handleCopyFromBoeing = (boeingType: string) => {
    const spec = BOEING_PALLET_SPECS[boeingType as keyof typeof BOEING_PALLET_SPECS];
    if (spec) {
      setNewPalletName(boeingType);
      setNewPalletDescription(spec.description);
      setNewPalletMaxWeight(spec.maxWeight);
      setNewPalletDimensions(spec.dimensions);
      setNewPalletMomentMultiplier(spec.momentMultiplier);
      setNewPalletCategory(spec.category);
    }
  };

  // Custom pallet position management functions
  const handleStartPositionCreation = () => {
    setIsCreatingPosition(true);
    setNewPositionCode('');
    setNewPositionName('');
    setNewPositionMomentArm(0);
    setNewPositionPalletType('LD3');
  };

  const handleSavePosition = async () => {
    if (newPositionCode.trim() && newPositionName.trim() && newPositionMomentArm > 0) {
      // Save to local state
      const updatedPositions = {
        ...customPalletPositions,
        [newPositionCode.trim()]: {
          name: newPositionName.trim(),
          momentArm: newPositionMomentArm,
          palletType: newPositionPalletType
        }
      };
      setCustomPalletPositions(updatedPositions);

      // Save to database
      try {
        await saveCustomPosition({
          code: newPositionCode.trim(),
          name: newPositionName.trim(),
          moment_arm: newPositionMomentArm,
          pallet_type: newPositionPalletType,
          created_at: new Date(),
          used_count: 0,
          notes: 'User-created custom position'
        });
      } catch (error) {
        console.error('Failed to save custom position to database:', error);
      }

      setIsCreatingPosition(false);
      handleCancelPositionCreation();
    }
  };

  const handleCancelPositionCreation = () => {
    setIsCreatingPosition(false);
    setNewPositionCode('');
    setNewPositionName('');
    setNewPositionMomentArm(0);
    setNewPositionPalletType('LD3');
  };

  // Reserved for future use - getAllCustomPositions
  // const getAllCustomPositions = () => {
  //   const dbPositionMap = dbCustomPositions.reduce((acc, position) => {
  //     acc[position.code] = {
  //       name: position.name,
  //       momentArm: position.moment_arm,
  //       palletType: position.pallet_type
  //     };
  //     return acc;
  //   }, {} as {[key: string]: {name: string; momentArm: number; palletType: string}});
  //   return { ...CUSTOM_PALLET_POSITIONS, ...customPalletPositions, ...dbPositionMap };
  // };

  // Database helper functions
  const trackOptimization = async (
    method: 'manual' | 'basic' | 'PSO' | 'ILP',
    initialWeights: WeightData[],
    finalWeights: WeightData[],
    startTime: number,
    success: boolean,
    patternName: string
  ) => {
    const endTime = Date.now();
    const optimizationTime = endTime - startTime;

    // Find or create pattern in database
    let patternId = dbPatterns.find(p => p.name === patternName)?.id;
    if (!patternId) {
      patternId = await savePattern({
        name: patternName,
        sequence: [...(getAllPatterns() as Record<string, readonly string[]>)[selectedPattern]],
        created_at: new Date(),
        used_count: 0,
        success_rate: 0,
        avg_final_cg: 0,
        avg_optimization_time: 0,
        rating: 3,
        tags: [method, variant],
        notes: `Auto-created pattern from ${method} optimization`
      });
    }

    // Calculate initial and final CG
    const initialResults = calculateCumulativeWeights(initialWeights, variant);
    const finalResults = calculateCumulativeWeights(finalWeights, variant);

    const initialCG = initialResults.loadingPoints[initialResults.loadingPoints.length - 1]?.cg || 0;
    const finalCG = finalResults.loadingPoints[finalResults.loadingPoints.length - 1]?.cg || 0;

    // Count envelope violations
    const envelopeViolations = finalResults.loadingPoints.filter(
      point => !isPointInEnvelope(point.cg, point.weight, variant)
    ).length;

    // Save optimization history
    await saveOptimization({
      pattern_id: patternId,
      aircraft_variant: variant,
      method,
      initial_weights: initialWeights,
      final_weights: finalWeights,
      initial_cg: initialCG,
      final_cg: finalCG,
      optimization_time: optimizationTime,
      envelope_violations: envelopeViolations,
      success,
      created_at: new Date(),
      fuel_weight: fuelGallons * 6.7,
      total_weight: finalResults.loadingPoints[finalResults.loadingPoints.length - 1]?.weight || 0,
      cg_improvement: Math.abs(finalCG - initialCG),
      notes: `${method} optimization ${success ? 'successful' : 'failed'}`
    });

    // Update pattern ranking
    await updateRanking(patternId);
  };

  // const getAllPalletStyles = () => {
  //   return { ...BOEING_PALLET_SPECS, ...customPalletStyles };
  // };

  const calculateOpportunityWindow = (weights: WeightData[]): LoadingPoint[] => {
    if (weights.length === 0) return [];

    const allPatterns = getAllPatterns() as Record<string, readonly string[]>;
    const pattern = allPatterns[selectedPattern] || LOADING_PATTERNS.default;
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) return [];

    // Generate multiple arrangements to find min/max CG for the FINAL weight only
    const arrangements: WeightData[][] = [];

    // Deep-copy helper to avoid mutating the original weight objects
    const deepCopy = (arr: WeightData[]) => arr.map(w => ({ ...w }));

    // Add current arrangement
    arrangements.push(deepCopy(weights));

    // Generate systematic arrangements to explore CG range
    const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);
    const numArrangements = Math.min(100, factorial(Math.min(weights.length, 7))); // Limit to prevent too many calculations

    for (let i = 0; i < numArrangements; i++) {
      const shuffled = deepCopy(weights);
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

    const allPatterns = getAllPatterns() as Record<string, readonly string[]>;
    const pattern = allPatterns[selectedPattern] || LOADING_PATTERNS.default;
    const deepCopy = (arr: WeightData[]) => arr.map(w => ({ ...w }));
    let bestWeights = deepCopy(currentWeights);
    let bestCG = direction === 'forward' ? -Infinity : Infinity;

    // Generate multiple arrangements to find the one with max forward or aft CG
    const numArrangements = Math.min(200, 5040); // Limit to prevent excessive calculations

    for (let attempt = 0; attempt < numArrangements; attempt++) {
      const shuffled = deepCopy(currentWeights);

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
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-full max-w-80 lg:w-80 md:w-72 sm:w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative min-w-16`}>
        {/* Header */}
        <div className="p-2 sm:p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex-1 mr-2 min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 truncate">777 Weight & Balance</h1>

              {/* Aircraft Variant Selection */}
              <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3">
                <Button
                  onClick={() => {
                    setVariant('200LR');
                    setLoadingPoints([{ cg: OEW_DATA['200LR'].cg, weight: OEW_DATA['200LR'].weight }]);
                    setTableData([]);
                    setFuelLoaded(false);
                    setFuelGallons(0);
                    setFuelLoadingPoints([]);
                    setTestWeights([]);
                    setOpportunityWindow([]);
                  }}
                  variant={variant === '200LR' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-1"
                >
                  <span className="hidden sm:inline">777-</span>200LR
                </Button>
                <Button
                  onClick={() => {
                    setVariant('300ER');
                    setLoadingPoints([{ cg: OEW_DATA['300ER'].cg, weight: OEW_DATA['300ER'].weight }]);
                    setTableData([]);
                    setFuelLoaded(false);
                    setFuelGallons(0);
                    setFuelLoadingPoints([]);
                    setTestWeights([]);
                    setOpportunityWindow([]);
                  }}
                  variant={variant === '300ER' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-1"
                >
                  <span className="hidden sm:inline">777-</span>300ER
                </Button>
              </div>
            </div>
          )}

          {/* Collapse Button */}
          <Button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="ghost"
            size="sm"
            className="p-1 sm:p-2 flex-shrink-0"
          >
            {sidebarCollapsed ? '→' : '←'}
          </Button>
        </div>

        {/* Controls */}
        {!sidebarCollapsed && (
          <div className="p-2 sm:p-4 border-b border-gray-200 space-y-2 sm:space-y-3">
            <div>
              <label className="text-sm font-medium text-black mb-2 block">Loading Pattern</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-black text-sm"
                value={selectedPattern}
                onChange={(e) => {
                  setSelectedPattern(e.target.value);
                  setTableData([]);
                  setLoadingPoints([{
                    cg: OEW_DATA[variant].cg,
                    weight: OEW_DATA[variant].weight
                  }]);
                  setFuelLoaded(false);
                  setFuelGallons(0);
                  setFuelLoadingPoints([]);
                  setTestWeights([]);
                  setOpportunityWindow([]);
                }}
              >
                <option value="default">Default Loading Pattern</option>
                <option value="forward">Forward Loading</option>
                <option value="aft">Aft Loading</option>
                <option value="balanced">Balanced Loading</option>
                {Object.keys(customPatterns).map(patternName => (
                  <option key={patternName} value={patternName}>
                    {patternName} (Custom)
                  </option>
                ))}
                {dbPatterns.map(pattern => (
                  <option key={pattern.name} value={pattern.name}>
                    {pattern.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-black mb-2 block">Display Units</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-black text-sm"
                value={units}
                onChange={(e) => setUnits(e.target.value as 'LB' | 'KG')}
              >
                <option value="LB">Pounds (LB)</option>
                <option value="KG">Kilograms (KG)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleTestFill}
                variant="outline"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 text-black text-xs sm:text-sm"
              >
                Random
              </Button>
              <Button
                onClick={handleReferenceFill}
                variant="outline"
                size="sm"
                className="bg-teal-50 hover:bg-teal-100 text-black text-xs sm:text-sm"
              >
                Reference
              </Button>
              <Button
                onClick={handleOptimize}
                variant="outline"
                size="sm"
                className="bg-green-50 hover:bg-green-100 text-black text-xs sm:text-sm"
                disabled={tableData.length === 0}
              >
                Optimize
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleOptimizePSO}
                variant="outline"
                size="sm"
                className="bg-red-50 hover:bg-red-100 text-black text-xs sm:text-sm"
                disabled={tableData.length === 0}
              >
                PSO
              </Button>
              <Button
                onClick={handleOptimizeILP}
                variant="outline"
                size="sm"
                className="bg-indigo-50 hover:bg-indigo-100 text-black text-xs sm:text-sm"
                disabled={tableData.length === 0}
              >
                ILP
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleOpportunitySelect('forward')}
                variant="outline"
                size="sm"
                className="bg-purple-50 hover:bg-purple-100 text-black text-xs sm:text-sm"
                disabled={opportunityWindow.length === 0}
              >
                Max Aft CG
              </Button>
              <Button
                onClick={() => handleOpportunitySelect('aft')}
                variant="outline"
                size="sm"
                className="bg-orange-50 hover:bg-orange-100 text-black text-xs sm:text-sm"
                disabled={opportunityWindow.length === 0}
              >
                Max Fwd CG
              </Button>
            </div>
          </div>
        )}

        {/* Scrollable Loading Grid */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-hidden bg-white">
            <div className="h-full overflow-y-auto p-2 sm:p-4">
              <LoadingGrid
                key={`${selectedPattern}-${fillKey}`}
                onWeightChange={handleCompute}
                units={units}
                onFuelLoad={handleFuelLoad}
                loadingSequence={[...getAllPatterns()[selectedPattern as keyof ReturnType<typeof getAllPatterns>]]}
                initialWeights={testWeights}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Chart and Data Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="chart" className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-gray-200 bg-white px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger value="chart">CG Envelope Chart</TabsTrigger>
                <TabsTrigger value="data">Loading Data</TabsTrigger>
                <TabsTrigger value="patterns">Pattern Creator</TabsTrigger>
                <TabsTrigger value="pallets">Pallet Styles</TabsTrigger>
                <TabsTrigger value="positions">Custom Positions</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="optimization">Optimization</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-4 min-h-0">
              <TabsContent value="chart" className="h-full mt-0">
                <Card className="h-full">
                  <CardContent className="h-full p-4">
                    <div className="h-full">
                      {variant === '300ER' ? (
                        <WeightChart
                          variant="300ER"
                          loadingPoints={loadingPoints}
                          fuelLoadingPoints={fuelLoadingPoints}
                          opportunityWindow={opportunityWindow}
                          units={units}
                          palletLabels={tableData.map(r => r.position)}
                        />
                      ) : (
                        <WeightChart
                          variant="200LR"
                          loadingPoints={loadingPoints}
                          fuelLoadingPoints={fuelLoadingPoints}
                          opportunityWindow={opportunityWindow}
                          units={units}
                          palletLabels={tableData.map(r => r.position)}
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
                      <LoadingTable data={tableData} units={units} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <p className="text-lg text-black">No loading data available</p>
                          <p className="text-sm text-black">Use the Test Fill button or manually add weights to see loading progression data</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patterns" className="h-full mt-0">
                <Card className="h-full">
                  <CardContent className="h-full p-4 overflow-auto">
                    {isCreatingPattern ? (
                      <div className="space-y-4">
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Create Custom Loading Pattern</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Pattern Name</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="Enter pattern name..."
                                value={newPatternName}
                                onChange={(e) => setNewPatternName(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-md font-medium text-gray-900">Current Loading Order</h4>
                              {newPatternOrder.length > 0 && (
                                <button
                                  onClick={() => setNewPatternOrder([])}
                                  className="text-xs text-red-600 hover:text-red-800 underline"
                                  title="Clear all positions"
                                >
                                  Clear All
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-3">
                              Click positions below to add/remove • Drag positions to reorder • Hover over drop zones to insert
                            </p>
                            {newPatternOrder.length === 0 ? (
                              <p className="text-gray-500 text-sm">No positions selected. Click positions below to add them.</p>
                            ) : (
                              <div className="border rounded-md p-3 bg-gray-50">
                                <div className="flex flex-wrap gap-1">
                                  {/* Drop zone at the beginning */}
                                  <div
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDropBetween(e, 0)}
                                    className="w-2 h-8 rounded border-2 border-dashed border-transparent hover:border-blue-400 transition-colors"
                                    title="Drop here to insert at beginning"
                                  />

                                  {newPatternOrder.map((position, index) => (
                                    <React.Fragment key={`${position}-${index}`}>
                                      <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, position, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                        className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs cursor-move hover:bg-blue-200 transition-colors shadow-sm"
                                        title="Drag to reorder"
                                      >
                                        <span className="mr-1 text-blue-600">#{index + 1}</span>
                                        <span className="font-mono font-bold">{position}</span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePositionFromPattern(position);
                                          }}
                                          className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                          title="Remove position"
                                        >
                                          ×
                                        </button>
                                      </div>

                                      {/* Drop zone after each position */}
                                      <div
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDropBetween(e, index + 1)}
                                        className="w-2 h-8 rounded border-2 border-dashed border-transparent hover:border-blue-400 transition-colors"
                                        title="Drop here to insert after this position"
                                      />
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-2">Available Positions</h4>
                            <p className="text-xs text-gray-600 mb-3">
                              Click to add/remove from loading order • Blue = selected, White = available
                            </p>
                            <div className="border rounded-md p-3">
                              <div className="grid grid-cols-6 gap-2">
                                {Object.keys(POSITION_MAP).map((position) => (
                                  <button
                                    key={position}
                                    onClick={() => handleTogglePosition(position)}
                                    className={`px-2 py-1 text-xs rounded font-mono border transition-all duration-200 transform hover:scale-105 ${newPatternOrder.includes(position)
                                        ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 cursor-pointer shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 cursor-pointer shadow-sm hover:shadow-md'
                                      }`}
                                    title={newPatternOrder.includes(position) ? 'Click to remove from pattern' : 'Click to add to pattern'}
                                  >
                                    {position}
                                    {newPatternOrder.includes(position) && (
                                      <span className="ml-1 text-blue-600 font-bold">
                                        #{newPatternOrder.indexOf(position) + 1}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-gray-500">
                              <p>💡 <strong>Tips:</strong></p>
                              <ul className="mt-1 space-y-1 list-disc list-inside">
                                <li>Click any position to add/remove it from the pattern</li>
                                <li>Drag positions in the loading order to rearrange them</li>
                                <li>Numbers show the loading sequence order</li>
                                <li>Use &quot;Clear All&quot; to start over</li>
                              </ul>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 border-t">
                            <Button
                              onClick={handleSavePattern}
                              variant="default"
                              size="sm"
                              disabled={!newPatternName.trim() || newPatternOrder.length === 0}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save Pattern
                            </Button>
                            <Button
                              onClick={handleCancelPatternCreation}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center py-8">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Pattern Creator</h3>
                          <p className="text-gray-600 mb-4">Create custom loading patterns for your cargo operations</p>
                          <Button
                            onClick={handleStartPatternCreation}
                            variant="default"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Start Creating Pattern
                          </Button>
                        </div>

                        {Object.keys(customPatterns).length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Existing Custom Patterns</h4>
                            <div className="space-y-2">
                              {Object.entries(customPatterns).map(([name, pattern]) => (
                                <div key={name} className="border rounded-md p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-medium text-gray-900">{name}</h5>
                                    <span className="text-xs text-gray-500">{pattern.length} positions</span>
                                  </div>
                                  <div className="text-xs text-gray-600 font-mono">
                                    {pattern.slice(0, 10).join(' → ')}
                                    {pattern.length > 10 && ' ...'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pallets" className="h-full mt-0">
                <Card className="h-full">
                  <CardContent className="h-full p-4 overflow-auto">
                    {isCreatingPallet ? (
                      <div className="space-y-4">
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Create Custom Pallet Style</h3>
                          <p className="text-sm text-gray-600 mb-4">Define a new pallet type with Boeing specifications</p>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Pallet Code</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="e.g., LD3, PMC, Custom1"
                                value={newPalletName}
                                onChange={(e) => setNewPalletName(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                              <select
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                value={newPalletCategory}
                                onChange={(e) => setNewPalletCategory(e.target.value)}
                              >
                                <option value="Container">Container</option>
                                <option value="Lower Deck">Lower Deck</option>
                                <option value="Main Deck">Main Deck</option>
                                <option value="Bulk">Bulk</option>
                                <option value="Special">Special</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded-md text-sm"
                              placeholder="e.g., LD3 Container, Custom Pallet Type"
                              value={newPalletDescription}
                              onChange={(e) => setNewPalletDescription(e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Max Weight ({getWeightUnit(units)})</label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="3500"
                                value={newPalletMaxWeight || ''}
                                onChange={(e) => setNewPalletMaxWeight(Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Moment Multiplier</label>
                              <input
                                type="number"
                                step="0.1"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="1.0"
                                value={newPalletMomentMultiplier || ''}
                                onChange={(e) => setNewPalletMomentMultiplier(Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Dimensions</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder='88" x 125" x 64"'
                                value={newPalletDimensions}
                                onChange={(e) => setNewPalletDimensions(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Copy from Boeing Standards</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {Object.keys(BOEING_PALLET_SPECS).map((boeingType) => (
                                <button
                                  key={boeingType}
                                  onClick={() => handleCopyFromBoeing(boeingType)}
                                  className="px-2 py-1 text-xs rounded border bg-blue-50 text-blue-700 hover:bg-blue-100"
                                >
                                  {boeingType}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 border-t">
                            <Button
                              onClick={handleSavePallet}
                              variant="default"
                              size="sm"
                              disabled={!newPalletName.trim() || !newPalletDescription.trim()}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save Pallet Style
                            </Button>
                            <Button
                              onClick={handleCancelPalletCreation}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center py-8">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Pallet Style Manager</h3>
                          <p className="text-gray-600 mb-4">Manage Boeing standard and custom pallet specifications</p>
                          <Button
                            onClick={handleStartPalletCreation}
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Create Custom Pallet Style
                          </Button>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Boeing Standard Pallet Specifications</h4>
                          <div className="space-y-2">
                            {(Object.entries(BOEING_PALLET_SPECS) as [string, { description: string; maxWeight: number; dimensions: string; momentMultiplier: number; category: string }][]).map(([code, spec]) => (
                              <div key={code} className="border rounded-md p-3 bg-blue-50">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-3">
                                    <h5 className="font-bold text-blue-900">{code}</h5>
                                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{spec.category}</span>
                                  </div>
                                  <span className="text-xs text-blue-600">Max: {convertWeight(spec.maxWeight, units).toLocaleString()} {getWeightUnit(units)}</span>
                                </div>
                                <p className="text-sm text-blue-800 mb-1">{spec.description}</p>
                                <div className="text-xs text-blue-600 flex gap-4">
                                  <span>Dimensions: {spec.dimensions}</span>
                                  <span>Moment Multiplier: {spec.momentMultiplier}x</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(Object.keys(customPalletStyles).length > 0 || dbCustomPalletStyles.length > 0) && (
                          <div className="border-t pt-4">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Custom Pallet Styles</h4>
                            <div className="space-y-2">
                              {Object.entries(customPalletStyles).map(([code, spec]) => (
                                <div key={code} className="border rounded-md p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                      <h5 className="font-bold text-gray-900">{code}</h5>
                                      <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">{spec.category}</span>
                                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Local</span>
                                    </div>
                                    <span className="text-xs text-gray-600">Max: {spec.maxWeight.toLocaleString()} lbs</span>
                                  </div>
                                  <p className="text-sm text-gray-800 mb-1">{spec.description}</p>
                                  <div className="text-xs text-gray-600 flex gap-4">
                                    <span>Dimensions: {spec.dimensions}</span>
                                    <span>Moment Multiplier: {spec.momentMultiplier}x</span>
                                  </div>
                                </div>
                              ))}
                              {dbCustomPalletStyles.map((style) => (
                                <div key={style.id} className="border rounded-md p-3 bg-blue-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                      <h5 className="font-bold text-blue-900">{style.name}</h5>
                                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{style.category}</span>
                                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">Database</span>
                                    </div>
                                    <span className="text-xs text-blue-600">Max: {style.max_weight.toLocaleString()} lbs</span>
                                  </div>
                                  <p className="text-sm text-blue-800 mb-1">{style.description}</p>
                                  <div className="text-xs text-blue-600 flex gap-4">
                                    <span>Dimensions: {style.dimensions}</span>
                                    <span>Moment Multiplier: {style.moment_multiplier}x</span>
                                    <span>Used: {style.used_count} times</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="positions" className="h-full mt-0">
                <Card className="h-full">
                  <CardContent className="h-full p-4 overflow-auto">
                    {isCreatingPosition ? (
                      <div className="space-y-4">
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Create Custom Pallet Position</h3>
                          <p className="text-sm text-gray-600 mb-4">Define a new pallet position with custom name and moment arm</p>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Position Code</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="e.g., CP4, CUSTOM1"
                                value={newPositionCode}
                                onChange={(e) => setNewPositionCode(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Pallet Type</label>
                              <select
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                value={newPositionPalletType}
                                onChange={(e) => setNewPositionPalletType(e.target.value)}
                              >
                                {Object.keys(BOEING_PALLET_SPECS).map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Position Name</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded-md text-sm"
                              placeholder="e.g., Forward Cargo Bay 1, Aft Lower Deck"
                              value={newPositionName}
                              onChange={(e) => setNewPositionName(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Moment Arm (inches)</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 border rounded-md text-sm"
                              placeholder="e.g., 1250"
                              value={newPositionMomentArm || ''}
                              onChange={(e) => setNewPositionMomentArm(Number(e.target.value))}
                            />
                          </div>

                          <div className="flex gap-2 pt-4 border-t">
                            <Button
                              onClick={handleSavePosition}
                              variant="default"
                              size="sm"
                              disabled={!newPositionCode.trim() || !newPositionName.trim() || newPositionMomentArm <= 0}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save Position
                            </Button>
                            <Button
                              onClick={handleCancelPositionCreation}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center py-8">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Custom Pallet Position Manager</h3>
                          <p className="text-gray-600 mb-4">Create custom pallet positions with specific names and moment arms</p>
                          <Button
                            onClick={handleStartPositionCreation}
                            variant="default"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Create Custom Position
                          </Button>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Default Custom Positions</h4>
                          <div className="space-y-2">
                            {(Object.entries(CUSTOM_PALLET_POSITIONS) as [string, { name: string; momentArm: number; palletType: string }][]).map(([code, pos]) => (
                              <div key={code} className="border rounded-md p-3 bg-blue-50">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-3">
                                    <h5 className="font-bold text-blue-900">{code}</h5>
                                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{pos.palletType}</span>
                                  </div>
                                  <span className="text-xs text-blue-600">Arm: {pos.momentArm}&quot;</span>
                                </div>
                                <p className="text-sm text-blue-800">{pos.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(Object.keys(customPalletPositions).length > 0 || dbCustomPositions.length > 0) && (
                          <div className="border-t pt-4">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Your Custom Positions</h4>
                            <div className="space-y-2">
                              {Object.entries(customPalletPositions).map(([code, pos]) => (
                                <div key={code} className="border rounded-md p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                      <h5 className="font-bold text-gray-900">{code}</h5>
                                      <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">{pos.palletType}</span>
                                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Local</span>
                                    </div>
                                    <span className="text-xs text-gray-600">Arm: {pos.momentArm}&quot;</span>
                                  </div>
                                  <p className="text-sm text-gray-800">{pos.name}</p>
                                </div>
                              ))}
                              {dbCustomPositions.map((position) => (
                                <div key={position.id} className="border rounded-md p-3 bg-blue-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                      <h5 className="font-bold text-blue-900">{position.code}</h5>
                                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{position.pallet_type}</span>
                                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">Database</span>
                                    </div>
                                    <span className="text-xs text-blue-600">Arm: {position.moment_arm}&quot;</span>
                                  </div>
                                  <p className="text-sm text-blue-800">{position.name}</p>
                                  <p className="text-xs text-blue-600 mt-1">Used: {position.used_count} times</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="h-full mt-0">
                <Card className="h-full">
                  <CardContent className="h-full p-4 overflow-auto">
                    <AnalyticsDashboard
                      onSelectPattern={(patternId) => {
                        // Find pattern by ID and switch to it
                        const pattern = dbPatterns.find(p => p.id === patternId);
                        if (pattern) {
                          console.log('Selected pattern:', pattern.name);
                          // Could implement pattern switching here
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="optimization" className="h-full mt-0">
                <Card className="h-full">
                  <CardContent className="h-full p-4 overflow-auto">
                    {optimizationResult ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-black">Last Optimization Result</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(optimizationResult.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Status Banner */}
                        <div className={`p-3 rounded-lg border ${
                          optimizationResult.inEnvelope && optimizationResult.inTargetRange && optimizationResult.weightLimitViolations === 0
                            ? 'bg-green-50 border-green-200'
                            : optimizationResult.inEnvelope
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-red-50 border-red-200'
                        }`}>
                          <p className={`font-semibold ${
                            optimizationResult.inEnvelope && optimizationResult.inTargetRange && optimizationResult.weightLimitViolations === 0
                              ? 'text-green-800'
                              : optimizationResult.inEnvelope
                                ? 'text-yellow-800'
                                : 'text-red-800'
                          }`}>
                            {optimizationResult.inEnvelope && optimizationResult.inTargetRange && optimizationResult.weightLimitViolations === 0
                              ? 'Optimization Successful'
                              : optimizationResult.inEnvelope
                                ? 'In Envelope (outside target range)'
                                : 'Optimization Failed — Out of Envelope'}
                          </p>
                        </div>

                        {/* Method & Performance */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Method</p>
                            <p className="text-sm font-semibold text-black">{optimizationResult.method}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                            <p className="text-sm font-semibold text-black">{optimizationResult.duration}ms ({optimizationResult.attempts} attempts)</p>
                          </div>
                        </div>

                        {/* CG Results */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-100 px-3 py-2">
                            <p className="text-sm font-semibold text-black">CG Analysis (% MAC)</p>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Initial CG:</span>
                              <span className="font-mono text-black">{optimizationResult.initialCG.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Final CG:</span>
                              <span className={`font-mono font-bold ${
                                optimizationResult.inTargetRange ? 'text-green-700' : 'text-orange-600'
                              }`}>{optimizationResult.finalCG.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Target CG:</span>
                              <span className="font-mono text-black">{optimizationResult.targetCG.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Target Range:</span>
                              <span className="font-mono text-black">{optimizationResult.targetRange.min}% – {optimizationResult.targetRange.max}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Deviation from Target:</span>
                              <span className="font-mono text-black">{Math.abs(optimizationResult.finalCG - optimizationResult.targetCG).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">CG Shift:</span>
                              <span className="font-mono text-black">{(optimizationResult.finalCG - optimizationResult.initialCG) > 0 ? '+' : ''}{(optimizationResult.finalCG - optimizationResult.initialCG).toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Constraint Checks */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-100 px-3 py-2">
                            <p className="text-sm font-semibold text-black">Constraint Checks</p>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">In CG Envelope:</span>
                              <span className={optimizationResult.inEnvelope ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                                {optimizationResult.inEnvelope ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">In Target Range ({optimizationResult.targetRange.min}–{optimizationResult.targetRange.max}%):</span>
                              <span className={optimizationResult.inTargetRange ? 'text-green-700 font-semibold' : 'text-orange-600 font-semibold'}>
                                {optimizationResult.inTargetRange ? 'PASS' : 'OUTSIDE'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Lower Hold Weight Violations:</span>
                              <span className={optimizationResult.weightLimitViolations === 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                                {optimizationResult.weightLimitViolations === 0 ? 'NONE' : optimizationResult.weightLimitViolations}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Intermediate Envelope Violations:</span>
                              <span className={optimizationResult.intermediateViolations === 0 ? 'text-green-700 font-semibold' : 'text-orange-600 font-semibold'}>
                                {optimizationResult.intermediateViolations === 0 ? 'NONE' : optimizationResult.intermediateViolations}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Fitness Score:</span>
                              <span className="font-mono text-black">{optimizationResult.bestScore.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Weight Swaps */}
                        {optimizationResult.swaps.length > 0 && (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-3 py-2">
                              <p className="text-sm font-semibold text-black">Position Weight Changes ({optimizationResult.swaps.length} positions)</p>
                            </div>
                            <div className="max-h-64 overflow-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                  <tr>
                                    <th className="text-left px-3 py-1 text-gray-600">Position</th>
                                    <th className="text-right px-3 py-1 text-gray-600">Before (lb)</th>
                                    <th className="text-right px-3 py-1 text-gray-600">After (lb)</th>
                                    <th className="text-right px-3 py-1 text-gray-600">Change</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {optimizationResult.swaps.map((swap, i) => (
                                    <tr key={i} className={`border-t ${LOWER_DECK_POSITIONS.has(swap.position) ? 'bg-blue-50' : ''}`}>
                                      <td className="px-3 py-1 font-mono text-black">
                                        {swap.position}
                                        {LOWER_DECK_POSITIONS.has(swap.position) && <span className="text-xs text-blue-500 ml-1">LD</span>}
                                      </td>
                                      <td className="text-right px-3 py-1 font-mono text-black">{swap.from.toLocaleString()}</td>
                                      <td className="text-right px-3 py-1 font-mono text-black">{swap.to.toLocaleString()}</td>
                                      <td className={`text-right px-3 py-1 font-mono ${swap.to - swap.from > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {swap.to - swap.from > 0 ? '+' : ''}{(swap.to - swap.from).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {optimizationResult.swaps.length === 0 && (
                          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                            No position changes were made — the current arrangement was already optimal.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <p className="text-lg font-medium">No optimization results yet</p>
                          <p className="text-sm mt-1">Click Optimize, PSO, or ILP to see results here</p>
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
        <div className="hidden sm:flex w-72 xl:w-80 lg:w-72 md:w-64 sm:w-56 bg-white border-l border-gray-200 flex-col min-h-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-black">Summary</h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {tableData.length > 1 ? (
              <div className="space-y-4">
                {/* Weight Summary */}
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg bg-purple-50">
                    <div className="font-bold text-sm text-black">Payload</div>
                    <div className="text-xl font-mono text-black">
                      {new Intl.NumberFormat().format(convertWeight(
                        tableData.filter(r => r.position !== 'OEW' && r.position !== 'FUEL').reduce((sum, r) => sum + r.weight, 0), units
                      ))} {getWeightUnit(units)}
                    </div>
                    <div className="text-xs text-black">
                      {tableData.filter(r => r.position !== 'OEW' && r.position !== 'FUEL' && r.weight > 0).length} pallet{tableData.filter(r => r.position !== 'OEW' && r.position !== 'FUEL' && r.weight > 0).length !== 1 ? 's' : ''} loaded
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg bg-blue-50">
                    <div className="font-bold text-sm text-black">ZFW</div>
                    <div className="text-xl font-mono text-black">
                      {new Intl.NumberFormat().format(fuelLoaded ?
                        convertWeight(tableData[tableData.length - 2].sumWeight, units) :
                        convertWeight(tableData[tableData.length - 1].sumWeight, units))} {getWeightUnit(units)}
                    </div>
                    <div className="text-xs text-black">
                      {fuelLoaded ?
                        tableData[tableData.length - 2].mac.toFixed(2) :
                        tableData[tableData.length - 1].mac.toFixed(2)}% MAC
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg bg-yellow-50">
                    <div className="font-bold text-sm text-black">Fuel</div>
                    <div className="text-xl font-mono text-black">
                      {new Intl.NumberFormat().format(fuelGallons)} gal
                    </div>
                    <div className="text-xs text-black">
                      {new Intl.NumberFormat().format(Math.round(fuelGallons * 6.7))} lbs
                    </div>
                    {fuelLoaded && (
                      <div className="text-xs text-black">
                        Arm: {getFuelArm(fuelGallons).toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className={`p-3 border rounded-lg ${fuelLoaded ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <div className="font-bold text-sm text-black">TOW</div>
                    <div className="text-xl font-mono text-black">
                      {new Intl.NumberFormat().format(convertWeight(loadingPoints[loadingPoints.length - 1].weight, units))} {getWeightUnit(units)}
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
                    <p className="text-xs text-black mb-2">
                      Range of possible CG positions with current cargo weights
                    </p>
                    <div className="text-xs text-black space-y-1">
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
                  <div className="text-xs text-black space-y-1">
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

                {/* Weight Limit Checks */}
                {tableData.length > 1 && (() => {
                  const limits = WEIGHT_LIMITS[variant];
                  const zfw = fuelLoaded
                    ? tableData[tableData.length - 2].sumWeight
                    : tableData[tableData.length - 1].sumWeight;
                  const tow = tableData[tableData.length - 1].sumWeight;

                  const checks = [
                    {
                      label: 'Max Zero Fuel Weight',
                      short: 'MZFW',
                      limit: limits.maxZeroFuelWeight,
                      actual: zfw,
                    },
                    ...(fuelLoaded ? [
                      {
                        label: 'Max Landing Weight',
                        short: 'MLW',
                        limit: limits.maxLandingWeight,
                        actual: tow, // simplified — no burn-off calc
                      },
                      {
                        label: 'Max Takeoff Weight',
                        short: 'MTOW',
                        limit: limits.maxTakeoffWeight,
                        actual: tow,
                      },
                      {
                        label: 'Max Taxi Weight',
                        short: 'MTW',
                        limit: limits.maxTaxiWeight,
                        actual: tow,
                      },
                    ] : []),
                  ];

                  const violations = checks.filter(c => c.actual > c.limit);

                  return (
                    <div className={`p-3 border rounded-lg ${violations.length > 0 ? 'bg-red-50 border-red-300' : 'bg-green-50'}`}>
                      <h3 className="font-bold text-sm mb-2">Weight Limits</h3>
                      <div className="text-xs space-y-1">
                        {checks.map(c => {
                          const exceeded = c.actual > c.limit;
                          return (
                            <div key={c.short} className={`flex justify-between ${exceeded ? 'text-red-700 font-medium' : 'text-black'}`}>
                              <span>{c.short}</span>
                              <span className="font-mono">
                                {new Intl.NumberFormat().format(Math.round(convertWeight(c.actual, units)))} / {new Intl.NumberFormat().format(Math.round(convertWeight(c.limit, units)))} {getWeightUnit(units)}
                                {exceeded ? ' EXCEEDED' : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {violations.length > 0 && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-xs font-medium">
                          {violations.map(v => (
                            <div key={v.short}>
                              {v.label} exceeded by {new Intl.NumberFormat().format(Math.round(convertWeight(v.actual - v.limit, units)))} {getWeightUnit(units)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Envelope Status */}
                {loadingPoints.length > 1 && (() => {
                  const outsidePoints = tableData
                    .filter(r => r.position !== 'OEW' && r.position !== 'FUEL')
                    .map((r, i) => ({
                      position: r.position,
                      cg: r.mac,
                      weight: r.sumWeight,
                      index: i
                    }))
                    .filter(p => !isPointInEnvelope(p.cg, p.weight, variant));

                  return (
                    <div className="p-3 border rounded-lg">
                      <h3 className="font-bold text-sm mb-2">Envelope Status</h3>
                      <div className="text-xs text-black">
                        {outsidePoints.length === 0 ? (
                          <div className="text-green-600 font-medium">All points within envelope</div>
                        ) : (
                          <>
                            <div className="text-red-600 font-medium mb-2">
                              {outsidePoints.length} point{outsidePoints.length !== 1 ? 's' : ''} outside envelope
                            </div>
                            <div className="space-y-1">
                              {outsidePoints.map(p => (
                                <div key={p.position} className="flex justify-between text-red-700">
                                  <span className="font-mono">{p.position}</span>
                                  <span>{p.cg.toFixed(1)}% MAC @ {new Intl.NumberFormat().format(Math.round(convertWeight(p.weight, units)))} {getWeightUnit(units)}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-700">
                <div className="text-center">
                  <p className="text-sm text-black">No data available</p>
                  <p className="text-xs mt-1 text-black">Use Test Fill to see summary</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 