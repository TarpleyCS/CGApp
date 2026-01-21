import {
  optimizeCargoWithPSO,
  optimizeCargoWithILP,
  createCGFitnessFunction,
  createConstraintFunction,
  createObjectiveFunction,
  type PSO_Config,
  type ILP_Config,
  type WeightData,
  type LoadingPoint,
} from '../optimization';

describe('optimization', () => {
  const mockWeights: WeightData[] = [
    { position: 'AL', weight: 5000 },
    { position: 'BL', weight: 6000 },
    { position: 'CL', weight: 4000 },
    { position: 'DL', weight: 7000 }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockCalculateFunction = (arrangement: WeightData[]): { loadingPoints: LoadingPoint[] } => {
    // Simple mock calculation that returns fake loading points (arrangement param required by interface)
    return {
      loadingPoints: [
        { cg: 20, weight: 321000 }, // OEW
        { cg: 25, weight: 350000 }  // Final point
      ]
    };
  };

  const mockEnvelopeFunction = (cg: number, weight: number): boolean => {
    // Simple envelope check: CG between 15-35% and weight < 400000
    return cg >= 15 && cg <= 35 && weight < 400000;
  };

  describe('optimizeCargoWithPSO', () => {
    const psoConfig: PSO_Config = {
      numParticles: 5,
      maxIterations: 10,
      inertiaWeight: 0.5,
      cognitiveWeight: 1.5,
      socialWeight: 1.5,
      variant: '300ER'
    };

    const mockFitnessFunction = (arrangement: WeightData[]): number => {
      // Simple fitness: prefer arrangements where first item has higher weight
      return arrangement[0].weight > 5000 ? 100 : 200;
    };

    it('should return a valid PSO result', () => {
      const result = optimizeCargoWithPSO(mockWeights, psoConfig, mockFitnessFunction);
      
      expect(result.bestArrangement).toBeDefined();
      expect(result.bestArrangement).toHaveLength(mockWeights.length);
      expect(result.bestFitness).toBeGreaterThan(0);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.convergenceHistory).toHaveLength(result.iterations);
    });

    it('should respect maximum iterations', () => {
      const shortConfig = { ...psoConfig, maxIterations: 3 };
      const result = optimizeCargoWithPSO(mockWeights, shortConfig, mockFitnessFunction);
      
      expect(result.iterations).toBeLessThanOrEqual(3);
    });

    it('should preserve total weight in arrangement', () => {
      const result = optimizeCargoWithPSO(mockWeights, psoConfig, mockFitnessFunction);
      
      const originalTotal = mockWeights.reduce((sum, w) => sum + w.weight, 0);
      const resultTotal = result.bestArrangement.reduce((sum, w) => sum + w.weight, 0);
      
      expect(resultTotal).toBe(originalTotal);
    });

    it('should maintain position count', () => {
      const result = optimizeCargoWithPSO(mockWeights, psoConfig, mockFitnessFunction);
      
      expect(result.bestArrangement).toHaveLength(mockWeights.length);
      
      // Check that positions are preserved
      const originalPositions = mockWeights.map(w => w.position).sort();
      const resultPositions = result.bestArrangement.map(w => w.position).sort();
      
      expect(resultPositions).toEqual(originalPositions);
    });

    it('should handle single weight array', () => {
      const singleWeight = [{ position: 'AL', weight: 5000 }];
      const result = optimizeCargoWithPSO(singleWeight, psoConfig, mockFitnessFunction);
      
      expect(result.bestArrangement).toHaveLength(1);
      expect(result.bestArrangement[0]).toEqual(singleWeight[0]);
    });
  });

  describe('optimizeCargoWithILP', () => {
    const ilpConfig: ILP_Config = {
      variant: '300ER',
      maxIterations: 10,
      tolerance: 0.01
    };

    const mockObjectiveFunction = (arrangement: WeightData[]): number => {
      return Math.abs(arrangement[0].weight - 6000); // Minimize difference from 6000
    };

    const mockConstraintFunction = (arrangement: WeightData[]): boolean => {
      return arrangement.every(w => w.weight > 0); // Simple constraint
    };

    it('should return a valid ILP result', () => {
      const result = optimizeCargoWithILP(
        mockWeights, 
        ilpConfig, 
        mockObjectiveFunction, 
        mockConstraintFunction
      );
      
      expect(result.optimalArrangement).toBeDefined();
      expect(result.optimalArrangement).toHaveLength(mockWeights.length);
      expect(result.optimalValue).toBeGreaterThanOrEqual(0);
      expect(result.feasible).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should respect maximum iterations', () => {
      const shortConfig = { ...ilpConfig, maxIterations: 5 };
      const result = optimizeCargoWithILP(
        mockWeights,
        shortConfig,
        mockObjectiveFunction,
        mockConstraintFunction
      );
      
      expect(result.iterations).toBeLessThanOrEqual(5);
    });

    it('should handle infeasible problems', () => {
      const impossibleConstraint = (): boolean => false; // Always false
      
      const result = optimizeCargoWithILP(
        mockWeights,
        ilpConfig,
        mockObjectiveFunction,
        impossibleConstraint
      );
      
      expect(result.feasible).toBe(false);
    });

    it('should preserve weight totals', () => {
      const result = optimizeCargoWithILP(
        mockWeights,
        ilpConfig,
        mockObjectiveFunction,
        mockConstraintFunction
      );
      
      const originalTotal = mockWeights.reduce((sum, w) => sum + w.weight, 0);
      const resultTotal = result.optimalArrangement.reduce((sum, w) => sum + w.weight, 0);
      
      expect(resultTotal).toBe(originalTotal);
    });
  });

  describe('createCGFitnessFunction', () => {
    it('should create a fitness function that works', () => {
      const fitnessFunc = createCGFitnessFunction(
        '300ER',
        25, // target CG
        mockCalculateFunction,
        mockEnvelopeFunction
      );
      
      const score = fitnessFunc(mockWeights);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });

    it('should return Infinity for undefined functions', () => {
      const fitnessFunc = createCGFitnessFunction('300ER', 25);
      const score = fitnessFunc(mockWeights);
      expect(score).toBe(Infinity);
    });

    it('should penalize envelope violations', () => {
      const strictEnvelope = (): boolean => false; // Always violates
      
      const fitnessFunc = createCGFitnessFunction(
        '300ER',
        25,
        mockCalculateFunction,
        strictEnvelope
      );
      
      const score = fitnessFunc(mockWeights);
      expect(score).toBeGreaterThan(1000000); // High penalty
    });

    it('should handle missing target CG', () => {
      const fitnessFunc = createCGFitnessFunction(
        '300ER',
        undefined,
        mockCalculateFunction,
        mockEnvelopeFunction
      );
      
      const score = fitnessFunc(mockWeights);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createConstraintFunction', () => {
    it('should create a constraint function that works', () => {
      const constraintFunc = createConstraintFunction(
        '300ER',
        mockCalculateFunction,
        mockEnvelopeFunction
      );
      
      const isValid = constraintFunc(mockWeights);
      expect(typeof isValid).toBe('boolean');
    });

    it('should return false for undefined functions', () => {
      const constraintFunc = createConstraintFunction('300ER');
      const isValid = constraintFunc(mockWeights);
      expect(isValid).toBe(false);
    });

    it('should return false when envelope is violated', () => {
      const strictEnvelope = (): boolean => false;
      
      const constraintFunc = createConstraintFunction(
        '300ER',
        mockCalculateFunction,
        strictEnvelope
      );
      
      const isValid = constraintFunc(mockWeights);
      expect(isValid).toBe(false);
    });

    it('should return true for valid arrangements', () => {
      const constraintFunc = createConstraintFunction(
        '300ER',
        mockCalculateFunction,
        mockEnvelopeFunction
      );
      
      const isValid = constraintFunc(mockWeights);
      expect(isValid).toBe(true);
    });
  });

  describe('createObjectiveFunction', () => {
    it('should create an objective function that works', () => {
      const objectiveFunc = createObjectiveFunction(
        '300ER',
        25,
        mockCalculateFunction
      );
      
      const value = objectiveFunc(mockWeights);
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should return Infinity for undefined calculate function', () => {
      const objectiveFunc = createObjectiveFunction('300ER', 25);
      const value = objectiveFunc(mockWeights);
      expect(value).toBe(Infinity);
    });

    it('should optimize for center CG when no target specified', () => {
      const objectiveFunc300ER = createObjectiveFunction(
        '300ER',
        undefined,
        mockCalculateFunction
      );
      
      const objectiveFunc200LR = createObjectiveFunction(
        '200LR',
        undefined,
        mockCalculateFunction
      );
      
      // Both should return valid numbers
      expect(typeof objectiveFunc300ER(mockWeights)).toBe('number');
      expect(typeof objectiveFunc200LR(mockWeights)).toBe('number');
    });

    it('should minimize deviation from target CG', () => {
      const objectiveFunc = createObjectiveFunction(
        '300ER',
        25,
        mockCalculateFunction
      );
      
      // Mock calculation returns CG of 25, so deviation should be 0
      const value = objectiveFunc(mockWeights);
      expect(value).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty weight arrays', () => {
      const psoConfig: PSO_Config = {
        numParticles: 2,
        maxIterations: 2,
        inertiaWeight: 0.5,
        cognitiveWeight: 1.5,
        socialWeight: 1.5,
        variant: '300ER'
      };
      
      const mockFitness = (): number => 100;
      
      expect(() => {
        optimizeCargoWithPSO([], psoConfig, mockFitness);
      }).not.toThrow();
    });

    it('should handle very small particle counts', () => {
      const psoConfig: PSO_Config = {
        numParticles: 1,
        maxIterations: 1,
        inertiaWeight: 0.5,
        cognitiveWeight: 1.5,
        socialWeight: 1.5,
        variant: '300ER'
      };
      
      const mockFitness = (): number => 100;
      const result = optimizeCargoWithPSO(mockWeights, psoConfig, mockFitness);
      
      expect(result).toBeDefined();
      expect(result.bestArrangement).toHaveLength(mockWeights.length);
    });
  });
});