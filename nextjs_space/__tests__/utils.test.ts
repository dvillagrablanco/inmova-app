/**
 * Example Unit Tests for Utility Functions
 */

import { formatCurrency } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      const result1 = formatCurrency(1000);
      const result2 = formatCurrency(1500.50);
      
      // Check that it includes euro symbol and correct decimal format
      expect(result1).toMatch(/1[.\s]?000,00\s?€/);
      expect(result2).toMatch(/1[.\s]?500,50\s?€/);
    });
    
    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/0,00\s?€/);
    });
    
    it('should format negative numbers correctly', () => {
      const result = formatCurrency(-500);
      expect(result).toMatch(/-500,00\s?€/);
    });
    
    it('should handle very large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toMatch(/1[.\s]?000[.\s]?000,00\s?€/);
    });
    
    it('should round to 2 decimal places', () => {
      const result1 = formatCurrency(123.456);
      const result2 = formatCurrency(123.454);
      
      expect(result1).toMatch(/123,46\s?€/);
      expect(result2).toMatch(/123,45\s?€/);
    });
    
    it('should return a string', () => {
      expect(typeof formatCurrency(100)).toBe('string');
    });
  });
});
