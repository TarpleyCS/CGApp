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

    it('should return exact moment arm for gallons in the table', () => {
      // FUEL_CG_DATA format: [gallons, weight_lbs, moment_arm]
      const [gallons, , expectedArm] = FUEL_CG_DATA[0];
      expect(getFuelArm(gallons)).toBe(expectedArm);
    });

    it('should interpolate between fuel data points', () => {
      // Test interpolation between 100 and 200 gallons
      const result = getFuelArm(150);
      const [g1, , arm1] = FUEL_CG_DATA[0];
      const [g2, , arm2] = FUEL_CG_DATA[1];

      const expectedArm = arm1 + ((150 - g1) / (g2 - g1)) * (arm2 - arm1);
      expect(result).toBeCloseTo(expectedArm, 2);
    });

    it('should handle gallons beyond maximum table value', () => {
      const maxGallons = FUEL_CG_DATA[FUEL_CG_DATA.length - 1][0];
      const maxArm = FUEL_CG_DATA[FUEL_CG_DATA.length - 1][2];

      expect(getFuelArm(maxGallons + 1000)).toBe(maxArm);
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

    it('should add fuel to existing calculation (gallons input)', () => {
      const fuelGallons = 15000;
      const expectedWeight = fuelGallons * 6.7;
      const result = addFuelToCalculation(mockLastResult, fuelGallons);

      expect(result.result.position).toBe('FUEL');
      expect(result.result.weight).toBe(expectedWeight);
      expect(result.result.sumWeight).toBe(mockLastResult.sumWeight + expectedWeight);
    });

    it('should calculate fuel arm correctly from gallons', () => {
      const fuelGallons = 15000;
      const expectedWeight = fuelGallons * 6.7;
      const result = addFuelToCalculation(mockLastResult, fuelGallons);
      const expectedFuelArm = getFuelArm(fuelGallons);

      expect(result.result.momentArm).toBe(expectedFuelArm);
      expect(result.result.moment).toBe(expectedWeight * expectedFuelArm);
    });

    it('should update CG calculation with fuel', () => {
      const fuelGallons = 15000;
      const expectedWeight = fuelGallons * 6.7;
      const result = addFuelToCalculation(mockLastResult, fuelGallons);

      const expectedFuelArm = getFuelArm(fuelGallons);
      const expectedTotalMoment = mockLastResult.sumMoment + (expectedWeight * expectedFuelArm);
      const expectedTotalWeight = mockLastResult.sumWeight + expectedWeight;
      const expectedBA = expectedTotalMoment / expectedTotalWeight;
      const expectedCG = convertMomentArmToCG(expectedBA);

      expect(result.result.sumMoment).toBeCloseTo(expectedTotalMoment, 0);
      expect(result.result.sumBA).toBeCloseTo(expectedBA, 2);
      expect(result.result.mac).toBeCloseTo(expectedCG, 2);
    });

    it('should return intermediate loading points for fuel curve', () => {
      const fuelGallons = 15000;
      const result = addFuelToCalculation(mockLastResult, fuelGallons);

      // Should have many intermediate points (one per FUEL_CG_DATA entry up to 15000 gal)
      expect(result.loadingPoints.length).toBeGreaterThan(1);

      // Last loading point should match the final result
      const lastPoint = result.loadingPoints[result.loadingPoints.length - 1];
      expect(lastPoint.weight).toBe(result.result.sumWeight);
      expect(lastPoint.cg).toBe(result.result.mac);
    });

    it('should handle zero fuel gallons', () => {
      const result = addFuelToCalculation(mockLastResult, 0);

      expect(result.result.weight).toBe(0);
      expect(result.result.moment).toBe(0);
      expect(result.result.sumWeight).toBe(mockLastResult.sumWeight);
      expect(result.loadingPoints.length).toBe(1);
    });
  });
});