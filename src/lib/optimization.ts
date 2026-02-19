import { WeightData, LoadingPoint } from './calculations';
import { CG_OPTIMIZATION_TARGETS, LOWER_DECK_POSITIONS, PALLET_WEIGHT_LIMITS, COMPARTMENT_WEIGHT_LIMITS } from './constants';

// Particle Swarm Optimization for cargo arrangement
export interface PSO_Config {
  numParticles: number;
  maxIterations: number;
  inertiaWeight: number;
  cognitiveWeight: number;
  socialWeight: number;
  targetCG?: number;
  variant: '300ER' | '200LR';
}

export interface Particle {
  position: number[]; // Arrangement of cargo weights
  velocity: number[];
  bestPosition: number[];
  bestFitness: number;
  fitness: number;
}

export interface PSO_Result {
  bestArrangement: WeightData[];
  bestFitness: number;
  iterations: number;
  convergenceHistory: number[];
}

export function optimizeCargoWithPSO(
  weights: WeightData[],
  config: PSO_Config,
  fitnessFunction: (arrangement: WeightData[]) => number
): PSO_Result {
  const { numParticles, maxIterations, inertiaWeight, cognitiveWeight, socialWeight } = config;
  const numCargo = weights.length;
  const weightValues = weights.map(w => w.weight);
  
  // Initialize particles
  const particles: Particle[] = [];
  let globalBestPosition: number[] = [];
  let globalBestFitness = Infinity;
  const convergenceHistory: number[] = [];
  
  // Initialize swarm - position represents permutation indices
  for (let i = 0; i < numParticles; i++) {
    // Create random permutation indices
    const position = Array.from({length: numCargo}, (_, idx) => idx);
    for (let j = position.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [position[j], position[k]] = [position[k], position[j]];
    }
    
    const velocity = new Array(numCargo).fill(0).map(() => (Math.random() - 0.5) * 2);
    
    // Create arrangement by reordering weights according to position indices
    const arrangement = weights.map((w, idx) => ({
      ...w,
      weight: weightValues[position[idx]]
    }));
    
    const fitness = fitnessFunction(arrangement);
    
    const particle: Particle = {
      position: [...position],
      velocity: [...velocity],
      bestPosition: [...position],
      bestFitness: fitness,
      fitness
    };
    
    particles.push(particle);
    
    if (fitness < globalBestFitness) {
      globalBestFitness = fitness;
      globalBestPosition = [...position];
    }
  }
  
  // PSO main loop
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    for (const particle of particles) {
      // Update velocity
      for (let d = 0; d < numCargo; d++) {
        const r1 = Math.random();
        const r2 = Math.random();
        
        particle.velocity[d] = 
          inertiaWeight * particle.velocity[d] +
          cognitiveWeight * r1 * (particle.bestPosition[d] - particle.position[d]) +
          socialWeight * r2 * (globalBestPosition[d] - particle.position[d]);
        
        // Velocity clamping for discrete space
        particle.velocity[d] = Math.max(-1, Math.min(1, particle.velocity[d]));
      }
      
      // Update position with probability-based swapping
      for (let d = 0; d < numCargo; d++) {
        if (Math.random() < Math.abs(particle.velocity[d])) {
          // Swap with a random position
          const swapIdx = Math.floor(Math.random() * numCargo);
          [particle.position[d], particle.position[swapIdx]] = 
            [particle.position[swapIdx], particle.position[d]];
        }
      }
      
      // Ensure position array contains valid permutation indices
      const positionCopy = [...particle.position];
      const sortedIndices = Array.from({length: numCargo}, (_, idx) => idx);
      const missingIndices = sortedIndices.filter(idx => !positionCopy.includes(idx));
      const duplicateIndices = positionCopy.filter((idx, pos) => positionCopy.indexOf(idx) !== pos);
      
      // Fix duplicates by replacing with missing indices
      for (let i = 0; i < duplicateIndices.length && i < missingIndices.length; i++) {
        const duplicatePos = positionCopy.lastIndexOf(duplicateIndices[i]);
        positionCopy[duplicatePos] = missingIndices[i];
      }
      particle.position = positionCopy;
      
      // Create arrangement by reordering weights according to position indices
      const arrangement = weights.map((w, idx) => ({
        ...w,
        weight: weightValues[particle.position[idx]]
      }));
      
      particle.fitness = fitnessFunction(arrangement);
      
      // Update personal best
      if (particle.fitness < particle.bestFitness) {
        particle.bestFitness = particle.fitness;
        particle.bestPosition = [...particle.position];
      }
      
      // Update global best
      if (particle.fitness < globalBestFitness) {
        globalBestFitness = particle.fitness;
        globalBestPosition = [...particle.position];
      }
    }
    
    convergenceHistory.push(globalBestFitness);
    
    // Early stopping if converged
    if (iteration > 10 && 
        Math.abs(convergenceHistory[iteration] - convergenceHistory[iteration - 10]) < 0.001) {
      break;
    }
  }
  
  // Create final arrangement by reordering weights according to best position indices
  const bestArrangement = weights.map((w, idx) => ({
    ...w,
    weight: weightValues[globalBestPosition[idx]]
  }));
  
  return {
    bestArrangement,
    bestFitness: globalBestFitness,
    iterations: convergenceHistory.length,
    convergenceHistory
  };
}

// Integer Linear Programming solver (simplified)
export interface ILP_Config {
  variant: '300ER' | '200LR';
  targetCG?: number;
  maxIterations: number;
  tolerance: number;
}

export interface ILP_Result {
  optimalArrangement: WeightData[];
  optimalValue: number;
  feasible: boolean;
  iterations: number;
}

export function optimizeCargoWithILP(
  weights: WeightData[],
  config: ILP_Config,
  objectiveFunction: (arrangement: WeightData[]) => number,
  constraintFunction: (arrangement: WeightData[]) => boolean
): ILP_Result {
  const { maxIterations } = config;
  
  // Simplified ILP using branch-and-bound with relaxation
  let bestArrangement = [...weights];
  let bestValue = objectiveFunction(weights);
  let bestFeasible = constraintFunction(weights);
  
  // Generate candidate solutions using systematic enumeration
  const weightValues = weights.map(w => w.weight);
  
  // Use a simplified branch-and-bound approach
  const candidates: number[][] = [];
  
  // Generate permutations systematically
  function generatePermutations(arr: number[], start: number = 0) {
    if (start >= arr.length - 1 || candidates.length >= maxIterations) {
      candidates.push([...arr]);
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      generatePermutations(arr, start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]]; // backtrack
    }
  }
  
  generatePermutations([...weightValues]);
  
  // Evaluate all candidates
  let iterations = 0;
  for (const candidate of candidates) {
    if (iterations >= maxIterations) break;
    
    const arrangement = weights.map((w, idx) => ({
      ...w,
      weight: candidate[idx]
    }));
    
    const value = objectiveFunction(arrangement);
    const feasible = constraintFunction(arrangement);
    
    // Update best solution
    if (feasible && (!bestFeasible || value < bestValue)) {
      bestValue = value;
      bestArrangement = [...arrangement];
      bestFeasible = feasible;
    } else if (!bestFeasible && feasible) {
      // Prefer feasible solutions even if objective is worse
      bestValue = value;
      bestArrangement = [...arrangement];
      bestFeasible = feasible;
    }
    
    iterations++;
  }
  
  return {
    optimalArrangement: bestArrangement,
    optimalValue: bestValue,
    feasible: bestFeasible,
    iterations
  };
}

// Check if an arrangement violates per-position or compartment weight limits
// Returns the number of violations (0 = valid)
function countWeightLimitViolations(arrangement: WeightData[]): number {
  let violations = 0;

  // Per-position lower deck weight limits
  for (const w of arrangement) {
    if (LOWER_DECK_POSITIONS.has(w.position) && w.weight > PALLET_WEIGHT_LIMITS.LOWER_DECK) {
      violations++;
    }
  }

  // Compartment section total limits
  const allSections = [
    ...COMPARTMENT_WEIGHT_LIMITS.forwardHold.sections,
    ...COMPARTMENT_WEIGHT_LIMITS.aftHold.sections,
  ];
  for (const section of allSections) {
    const sectionTotal = arrangement
      .filter(w => (section.positions as readonly string[]).includes(w.position))
      .reduce((sum, w) => sum + w.weight, 0);
    if (sectionTotal > section.maxWeight) {
      violations++;
    }
  }

  return violations;
}

// Fitness function for PSO - minimizes CG deviation and envelope violations
export function createCGFitnessFunction(
  variant: '300ER' | '200LR',
  targetCG?: number,
  calculateFunction?: (arrangement: WeightData[], variant: '300ER' | '200LR') => { loadingPoints: LoadingPoint[] },
  envelopeFunction?: (cg: number, weight: number, variant: '300ER' | '200LR') => boolean
) {
  return (arrangement: WeightData[]): number => {
    if (!calculateFunction || !envelopeFunction) {
      return Infinity;
    }
    
    const { loadingPoints } = calculateFunction(arrangement, variant);
    if (loadingPoints.length < 2) return Infinity;
    
    const finalPoint = loadingPoints[loadingPoints.length - 1];
    let score = 0;

    // Penalty for position/compartment weight limit violations
    const weightViolations = countWeightLimitViolations(arrangement);
    score += weightViolations * 500000;

    // Penalty for envelope violations
    if (!envelopeFunction(finalPoint.cg, finalPoint.weight, variant)) {
      score += 1000000;
    }
    
    // Penalty for intermediate violations
    for (let i = 1; i < loadingPoints.length - 1; i++) {
      const point = loadingPoints[i];
      if (!envelopeFunction(point.cg, point.weight, variant)) {
        score += 10000;
      }
    }
    
    // Deviation from target CG with range-aware scoring
    const targets = CG_OPTIMIZATION_TARGETS[variant];
    const effectiveTarget = targetCG !== undefined ? targetCG : targets.target;
    const cgDeviation = Math.abs(finalPoint.cg - effectiveTarget);

    // If within the acceptable range, only penalize deviation from target
    if (finalPoint.cg >= targets.min && finalPoint.cg <= targets.max) {
      score += cgDeviation * 100;
    } else {
      // Outside range: penalize proportionally to distance from nearest bound
      const distanceOutside = finalPoint.cg < targets.min
        ? targets.min - finalPoint.cg
        : finalPoint.cg - targets.max;
      score += cgDeviation * 100 + distanceOutside * 5000;
    }

    return score;
  };
}

// Constraint function for ILP - checks if arrangement satisfies all constraints
export function createConstraintFunction(
  variant: '300ER' | '200LR',
  calculateFunction?: (arrangement: WeightData[], variant: '300ER' | '200LR') => { loadingPoints: LoadingPoint[] },
  envelopeFunction?: (cg: number, weight: number, variant: '300ER' | '200LR') => boolean
) {
  return (arrangement: WeightData[]): boolean => {
    if (!calculateFunction || !envelopeFunction) {
      return false;
    }

    // Check position/compartment weight limits
    if (countWeightLimitViolations(arrangement) > 0) {
      return false;
    }

    const { loadingPoints } = calculateFunction(arrangement, variant);
    if (loadingPoints.length < 2) return false;

    // Check all points are within envelope
    for (let i = 1; i < loadingPoints.length; i++) {
      const point = loadingPoints[i];
      if (!envelopeFunction(point.cg, point.weight, variant)) {
        return false;
      }
    }

    return true;
  };
}

// Objective function for ILP - what we want to optimize
export function createObjectiveFunction(
  variant: '300ER' | '200LR',
  targetCG?: number,
  calculateFunction?: (arrangement: WeightData[], variant: '300ER' | '200LR') => { loadingPoints: LoadingPoint[] }
) {
  return (arrangement: WeightData[]): number => {
    if (!calculateFunction) {
      return Infinity;
    }
    
    const { loadingPoints } = calculateFunction(arrangement, variant);
    if (loadingPoints.length < 2) return Infinity;
    
    const finalPoint = loadingPoints[loadingPoints.length - 1];
    
    // Minimize deviation from target CG or optimize for center of target range
    const targets = CG_OPTIMIZATION_TARGETS[variant];
    const effectiveTarget = targetCG !== undefined ? targetCG : targets.target;
    return Math.abs(finalPoint.cg - effectiveTarget);
  };
}