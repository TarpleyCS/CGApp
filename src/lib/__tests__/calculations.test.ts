import {
  convertMomentArmToCG,
  getFuelArm,
  calculateCumulativeWeights,
  addFuelToCalculation,
  type WeightData,
} from '../calculations';
import { CG_CONSTANTS, FUEL_CG_DATA } from '../constants';

describe('calculations', () => {
  describe('convertMomentArmToCG', () => {
    it('should convert moment arm to CG percentage correctly', () => {
      // Test with known values
      const momentArm = 1230; // Example moment arm
      const expectedCG = ((momentArm - CG_CONSTANTS.MOMENT_ARM_REFERENCE) * 100) / CG_CONSTANTS.MAC_REFERENCE;
      
      expect(convertMomentArmToCG(momentArm)).toBeCloseTo(expectedCG, 2);
    });

    it('should handle reference moment arm', () => {
      const result = convertMomentArmToCG(CG_CONSTANTS.MOMENT_ARM_REFERENCE);
      expect(result).toBe(0);
    });

    it('should handle negative moment arms correctly', () => {
      const momentArm = 1000; // Less than reference
      const result = convertMomentArmToCG(momentArm);
      expect(result).toBeLessThan(0);
    });
  });

  describe('getFuelArm', () => {
    it('should return 0 for zero fuel weight', () => {
      expect(getFuelArm(0)).toBe(0);
    });

    it('should return 0 for negative fuel weight', () => {
      expect(getFuelArm(-100)).toBe(0);
    });

    it('should return exact value for fuel weights in the table', () => {
      // Test with first entry in FUEL_CG_DATA
      const [weight, expectedArm] = FUEL_CG_DATA[0];
      expect(getFuelArm(weight)).toBe(expectedArm);
    });

    it('should interpolate between fuel data points', () => {
      // Test interpolation between 100 and 200
      const result = getFuelArm(150);
      const [w1, arm1] = FUEL_CG_DATA[0]; // [100, 1153.4]
      const [w2, arm2] = FUEL_CG_DATA[1]; // [200, 1153.6]
      
      const expectedArm = arm1 + ((150 - w1) / (w2 - w1)) * (arm2 - arm1);
      expect(result).toBeCloseTo(expectedArm, 2);
    });

    it('should handle fuel weight beyond maximum table value', () => {
      const maxWeight = FUEL_CG_DATA[FUEL_CG_DATA.length - 1][0];
      const maxArm = FUEL_CG_DATA[FUEL_CG_DATA.length - 1][1];
      
      expect(getFuelArm(maxWeight + 1000)).toBe(maxArm);
    });
  });

  describe('calculateCumulativeWeights', () => {
    const mockWeights: WeightData[] = [
      { position: 'AL', weight: 5000 },
      { position: 'BL', weight: 6000 },
      { position: 'CL', weight: 4000 }
    ];

    it('should calculate cumulative weights for 300ER variant', () => {
      const result = calculateCumulativeWeights(mockWeights, '300ER');
      
      expect(result.results).toBeDefined();
      expect(result.loadingPoints).toBeDefined();
      
      // Should start with OEW
      expect(result.results[0].position).toBe('OEW');
      
      // Should have results for each weight plus OEW
      expect(result.results).toHaveLength(mockWeights.length + 1);
      expect(result.loadingPoints).toHaveLength(mockWeights.length + 1);
    });

    it('should calculate cumulative weights for 200LR variant', () => {
      const result = calculateCumulativeWeights(mockWeights, '200LR');
      
      expect(result.results).toBeDefined();
      expect(result.loadingPoints).toBeDefined();
      expect(result.results[0].position).toBe('OEW');
    });

    it('should skip zero weights', () => {
      const weightsWithZero: WeightData[] = [
        { position: 'AL', weight: 5000 },
        { position: 'BL', weight: 0 },
        { position: 'CL', weight: 4000 }
      ];
      
      const result = calculateCumulativeWeights(weightsWithZero, '300ER');
      
      // Should have OEW + 2 non-zero weights = 3 results
      expect(result.results).toHaveLength(3);
    });

    it('should accumulate weights correctly', () => {
      const result = calculateCumulativeWeights(mockWeights, '300ER');
      
      // Check that weights accumulate
      let expectedWeight = 321000; // OEW for 300ER
      
      for (let i = 1; i < result.results.length; i++) {
        expectedWeight += mockWeights[i - 1].weight;
        expect(result.results[i].sumWeight).toBe(expectedWeight);
      }
    });

    it('should calculate moments correctly', () => {
      const result = calculateCumulativeWeights(mockWeights, '300ER');
      
      // Check that individual moments are calculated
      for (let i = 1; i < result.results.length; i++) {
        const calcResult = result.results[i];
        const expectedMoment = calcResult.weight * calcResult.momentArm;
        expect(calcResult.moment).toBe(expectedMoment);
      }
    });

    it('should handle unknown position codes gracefully', () => {
      const weightsWithBadPosition: WeightData[] = [
        { position: 'AL', weight: 5000 },
        { position: 'INVALID', weight: 3000 },
        { position: 'BL', weight: 4000 }
      ];
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = calculateCumulativeWeights(weightsWithBadPosition, '300ER');
      
      // Should skip invalid position
      expect(result.results).toHaveLength(3); // OEW + AL + BL
      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown position code: INVALID');
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('addFuelToCalculation', () => {
    const mockLastResult = {
      position: 'CL',
      momentArm: 712,
      weight: 4000,
      moment: 2848000,
      sumWeight: 350000,
      sumMoment: 430000000,
      sumBA: 1228.57,
      mac: 19.4
    };

    it('should add fuel to existing calculation', () => {
      const fuelWeight = 15000;
      const result = addFuelToCalculation(mockLastResult, fuelWeight);
      
      expect(result.result.position).toBe('FUEL');
      expect(result.result.weight).toBe(fuelWeight);
      expect(result.result.sumWeight).toBe(mockLastResult.sumWeight + fuelWeight);
    });

    it('should calculate fuel arm correctly', () => {
      const fuelWeight = 15000;
      const result = addFuelToCalculation(mockLastResult, fuelWeight);
      const expectedFuelArm = getFuelArm(fuelWeight);
      
      expect(result.result.momentArm).toBe(expectedFuelArm);
      expect(result.result.moment).toBe(fuelWeight * expectedFuelArm);
    });

    it('should update CG calculation with fuel', () => {
      const fuelWeight = 15000;
      const result = addFuelToCalculation(mockLastResult, fuelWeight);
      
      const expectedFuelArm = getFuelArm(fuelWeight);
      const expectedTotalMoment = mockLastResult.sumMoment + (fuelWeight * expectedFuelArm);
      const expectedTotalWeight = mockLastResult.sumWeight + fuelWeight;
      const expectedBA = expectedTotalMoment / expectedTotalWeight;
      const expectedCG = convertMomentArmToCG(expectedBA);
      
      expect(result.result.sumMoment).toBeCloseTo(expectedTotalMoment, 0);
      expect(result.result.sumBA).toBeCloseTo(expectedBA, 2);
      expect(result.result.mac).toBeCloseTo(expectedCG, 2);
    });

    it('should create loading point with correct values', () => {
      const fuelWeight = 15000;
      const result = addFuelToCalculation(mockLastResult, fuelWeight);
      
      expect(result.loadingPoint.weight).toBe(result.result.sumWeight);
      expect(result.loadingPoint.cg).toBe(result.result.mac);
    });

    it('should handle zero fuel weight', () => {
      const result = addFuelToCalculation(mockLastResult, 0);
      
      expect(result.result.weight).toBe(0);
      expect(result.result.moment).toBe(0);
      expect(result.result.sumWeight).toBe(mockLastResult.sumWeight);
    });
  });
});