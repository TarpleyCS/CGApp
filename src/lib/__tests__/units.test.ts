import {
  convertWeight,
  formatWeight,
  getWeightUnit,
  getWeightUnitShort,
  type Units
} from '../units';

describe('units', () => {
  describe('convertWeight', () => {
    it('should return weight unchanged for LB units', () => {
      const weight = 1000;
      expect(convertWeight(weight, 'LB')).toBe(weight);
    });

    it('should convert pounds to kilograms for KG units', () => {
      const weight = 1000; // pounds
      const expectedKg = Math.round(weight * 0.453592);
      expect(convertWeight(weight, 'KG')).toBe(expectedKg);
    });

    it('should handle zero weight', () => {
      expect(convertWeight(0, 'LB')).toBe(0);
      expect(convertWeight(0, 'KG')).toBe(0);
    });

    it('should handle decimal weights and round for KG', () => {
      const weight = 2204.62; // Should convert to exactly 1000 kg
      const result = convertWeight(weight, 'KG');
      expect(result).toBe(1000);
    });

    it('should handle large weights', () => {
      const weight = 500000; // 500k lbs
      const expectedKg = Math.round(weight * 0.453592);
      expect(convertWeight(weight, 'KG')).toBe(expectedKg);
    });
  });

  describe('formatWeight', () => {
    it('should format weight in pounds with commas', () => {
      const weight = 123456;
      const result = formatWeight(weight, 'LB');
      expect(result).toBe('123,456 LB');
    });

    it('should format weight in kilograms with commas', () => {
      const weight = 1000; // pounds
      const expectedKg = Math.round(weight * 0.453592);
      const result = formatWeight(weight, 'KG');
      expect(result).toBe(`${expectedKg.toLocaleString()} KG`);
    });

    it('should handle small weights', () => {
      expect(formatWeight(100, 'LB')).toBe('100 LB');
      expect(formatWeight(100, 'KG')).toBe('45 KG');
    });

    it('should handle zero weight', () => {
      expect(formatWeight(0, 'LB')).toBe('0 LB');
      expect(formatWeight(0, 'KG')).toBe('0 KG');
    });

    it('should format large weights with thousands separator', () => {
      const weight = 1234567;
      expect(formatWeight(weight, 'LB')).toBe('1,234,567 LB');
    });
  });

  describe('getWeightUnit', () => {
    it('should return "lbs" for LB units', () => {
      expect(getWeightUnit('LB')).toBe('lbs');
    });

    it('should return "kg" for KG units', () => {
      expect(getWeightUnit('KG')).toBe('kg');
    });
  });

  describe('getWeightUnitShort', () => {
    it('should return "LB" for LB units', () => {
      expect(getWeightUnitShort('LB')).toBe('LB');
    });

    it('should return "KG" for KG units', () => {
      expect(getWeightUnitShort('KG')).toBe('KG');
    });
  });

  describe('type safety', () => {
    it('should only accept valid Units type', () => {
      // This test ensures TypeScript compilation catches invalid units
      const validUnits: Units[] = ['LB', 'KG'];
      
      validUnits.forEach(unit => {
        expect(() => convertWeight(1000, unit)).not.toThrow();
        expect(() => formatWeight(1000, unit)).not.toThrow();
        expect(() => getWeightUnit(unit)).not.toThrow();
        expect(() => getWeightUnitShort(unit)).not.toThrow();
      });
    });
  });

  describe('conversion accuracy', () => {
    it('should maintain reasonable precision in conversion', () => {
      // Test known conversion: 1 lb = 0.453592 kg
      const pounds = 2204.62; // This should convert to approximately 1000 kg
      const result = convertWeight(pounds, 'KG');
      expect(result).toBe(1000);
    });

    it('should be consistent between convert and format functions', () => {
      const weight = 5000;
      const convertedWeight = convertWeight(weight, 'KG');
      const formattedWeight = formatWeight(weight, 'KG');
      
      expect(formattedWeight).toBe(`${convertedWeight.toLocaleString()} KG`);
    });
  });
});