import { describe, it, expect } from 'vitest';
import {
  calculateMortgage,
  calculateSensitivity,
  calculateFiscalImpact,
  calculatePortfolioImpact,
  getDueDiligenceChecklist,
} from '@/lib/investment-calculators';

describe('investment-calculators', () => {
  describe('calculateMortgage', () => {
    it('calculates mortgage correctly', () => {
      const result = calculateMortgage({
        propertyPrice: 300000,
        downPaymentPercent: 20,
        interestRate: 3.5,
        termYears: 25,
        monthlyRent: 1200,
      });
      expect(result.downPayment).toBe(60000);
      expect(result.loanAmount).toBe(240000);
      expect(result.monthlyPayment).toBeGreaterThan(1000);
      expect(result.monthlyPayment).toBeLessThan(1500);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it('handles zero interest rate', () => {
      const result = calculateMortgage({
        propertyPrice: 120000,
        downPaymentPercent: 100,
        interestRate: 0,
        termYears: 25,
        monthlyRent: 500,
      });
      expect(result.loanAmount).toBe(0);
      expect(result.downPayment).toBe(120000);
    });
  });

  describe('calculateSensitivity', () => {
    it('returns multiple scenarios', () => {
      const result = calculateSensitivity({
        basePrice: 300000,
        baseRent: 1200,
        baseExpenses: 3000,
      });
      expect(result.scenarios.length).toBeGreaterThanOrEqual(5);
      expect(result.scenarios[0].name).toBe('Base');
    });

    it('worst case has lower yield than base', () => {
      const result = calculateSensitivity({
        basePrice: 300000,
        baseRent: 1200,
        baseExpenses: 3000,
      });
      const base = result.scenarios.find(s => s.name === 'Base');
      const worst = result.scenarios.find(s => s.name.includes('Peor'));
      expect(worst!.yieldNeto).toBeLessThan(base!.yieldNeto);
    });
  });

  describe('calculateFiscalImpact', () => {
    it('calculates purchase taxes for segunda mano', () => {
      const result = calculateFiscalImpact({
        price: 200000,
        isNewBuild: false,
        province: 'Madrid',
        annualRent: 12000,
        annualExpenses: 2000,
        ownerType: 'sociedad',
      });
      expect(result.totalCompra).toBeGreaterThan(10000);
      expect(result.irpfRenta).toBeGreaterThan(0);
      expect(result.rentaNetoFiscal).toBeLessThan(12000);
    });

    it('IVA for new builds', () => {
      const result = calculateFiscalImpact({
        price: 200000,
        isNewBuild: true,
        province: 'Madrid',
        annualRent: 12000,
        annualExpenses: 2000,
        ownerType: 'persona_fisica',
      });
      const iva = result.impuestoCompra.find(i => i.concepto.includes('IVA'));
      expect(iva).toBeDefined();
      expect(iva!.importe).toBe(20000); // 10% of 200K
    });
  });

  describe('calculatePortfolioImpact', () => {
    it('calculates yield change', () => {
      const result = calculatePortfolioImpact(
        { totalUnits: 10, avgYield: 5, monthlyRent: 10000 },
        { estimatedYield: 8, price: 200000, location: 'Madrid', propertyType: 'vivienda' }
      );
      expect(result.newYield).toBeGreaterThan(5);
      expect(result.yieldChange).toBeGreaterThan(0);
      expect(result.newUnits).toBe(11);
    });
  });

  describe('getDueDiligenceChecklist', () => {
    it('returns base checklist', () => {
      const list = getDueDiligenceChecklist('vivienda', 'banca');
      expect(list.length).toBeGreaterThan(5);
      expect(list.some(i => i.critical)).toBe(true);
    });

    it('adds auction-specific items', () => {
      const list = getDueDiligenceChecklist('vivienda', 'subasta');
      expect(list.some(i => i.id === 'deposito')).toBe(true);
      expect(list.some(i => i.id === 'ocupacion')).toBe(true);
    });

    it('adds bank-specific items', () => {
      const list = getDueDiligenceChecklist('vivienda', 'banca');
      expect(list.some(i => i.id === 'negociar')).toBe(true);
    });
  });
});
