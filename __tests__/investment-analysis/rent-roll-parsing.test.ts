/**
 * Tests para Parseo de Rent Rolls
 * Verifica el procesamiento OCR y validación de rent rolls
 */

import { describe, it, expect } from '@jest/globals';

interface RentRollUnit {
  unitNumber: string;
  tenant?: string;
  occupied: boolean;
  currentRent: number;
  marketRent?: number;
  leaseStart?: Date;
  leaseEnd?: Date;
  deposit?: number;
  squareMeters?: number;
}

interface ParsedRentRoll {
  buildingName?: string;
  address?: string;
  totalUnits: number;
  occupiedUnits: number;
  totalMonthlyRent: number;
  averageRentPerUnit: number;
  occupancyRate: number;
  units: RentRollUnit[];
}

// Función para validar rent roll
function validateRentRoll(data: ParsedRentRoll) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validaciones críticas
  if (!data.totalUnits || data.totalUnits <= 0) {
    errors.push('Número de unidades inválido');
  }

  if (!data.units || data.units.length === 0) {
    errors.push('No se encontraron unidades en el documento');
  }

  if (data.units.length !== data.totalUnits) {
    warnings.push(
      `Discrepancia: ${data.totalUnits} unidades declaradas vs ${data.units.length} detectadas`
    );
  }

  // Validar ocupación
  const occupiedCount = data.units.filter((u) => u.occupied).length;
  if (occupiedCount !== data.occupiedUnits) {
    warnings.push(
      `Discrepancia en ocupación: ${data.occupiedUnits} declaradas vs ${occupiedCount} detectadas`
    );
  }

  // Validar tasa de ocupación
  if (data.occupancyRate < 0 || data.occupancyRate > 100) {
    errors.push('Tasa de ocupación fuera de rango (0-100%)');
  }

  if (data.occupancyRate < 50) {
    warnings.push('Tasa de ocupación muy baja (< 50%)');
  }

  // Validar rentas
  let calculatedTotalRent = 0;
  data.units.forEach((unit, index) => {
    if (unit.occupied && unit.currentRent <= 0) {
      warnings.push(`Unidad ${unit.unitNumber}: ocupada pero sin renta`);
    }

    if (unit.occupied) {
      calculatedTotalRent += unit.currentRent;
    }

    if (unit.currentRent < 0) {
      errors.push(`Unidad ${unit.unitNumber}: renta negativa`);
    }

    // Detectar rentas atípicas
    if (unit.currentRent > data.averageRentPerUnit * 3) {
      warnings.push(`Unidad ${unit.unitNumber}: renta muy alta vs promedio`);
    }

    if (unit.occupied && unit.currentRent < data.averageRentPerUnit * 0.3) {
      warnings.push(`Unidad ${unit.unitNumber}: renta muy baja vs promedio`);
    }
  });

  // Validar total de rentas
  const rentDifference = Math.abs(calculatedTotalRent - data.totalMonthlyRent);
  if (rentDifference > 10) {
    // Tolerancia de €10
    warnings.push(
      `Discrepancia en renta total: €${data.totalMonthlyRent} declarado vs €${calculatedTotalRent} calculado`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Función para generar resumen
function generateSummary(data: ParsedRentRoll) {
  const vacantUnits = data.units.filter((u) => !u.occupied);
  const occupiedUnits = data.units.filter((u) => u.occupied);

  const rents = occupiedUnits.map((u) => u.currentRent).sort((a, b) => a - b);
  const minRent = rents[0] || 0;
  const maxRent = rents[rents.length - 1] || 0;
  const medianRent =
    rents.length > 0
      ? rents.length % 2 === 0
        ? (rents[rents.length / 2 - 1] + rents[rents.length / 2]) / 2
        : rents[Math.floor(rents.length / 2)]
      : 0;

  const potentialMonthlyIncome = data.averageRentPerUnit * data.totalUnits;
  const lostIncomeFromVacancy = potentialMonthlyIncome - data.totalMonthlyRent;

  return {
    overview: {
      totalUnits: data.totalUnits,
      occupiedUnits: data.occupiedUnits,
      vacantUnits: vacantUnits.length,
      occupancyRate: data.occupancyRate,
    },
    income: {
      totalMonthlyRent: data.totalMonthlyRent,
      averageRentPerUnit: data.averageRentPerUnit,
      potentialMonthlyIncome,
      lostIncomeFromVacancy,
    },
    rentDistribution: {
      min: minRent,
      max: maxRent,
      median: medianRent,
      average: data.averageRentPerUnit,
    },
    vacantUnitsDetails: vacantUnits.map((unit) => ({
      unitNumber: unit.unitNumber,
      potentialMonthlyIncome: data.averageRentPerUnit,
    })),
  };
}

describe('Parseo de Rent Roll', () => {
  describe('Validación de Datos', () => {
    it('debe validar rent roll correcto', () => {
      const data: ParsedRentRoll = {
        buildingName: 'Edificio Central',
        address: 'Calle Mayor 123, Madrid',
        totalUnits: 10,
        occupiedUnits: 9,
        totalMonthlyRent: 9000,
        averageRentPerUnit: 1000,
        occupancyRate: 90,
        units: [
          { unitNumber: '1A', occupied: true, currentRent: 1000 },
          { unitNumber: '1B', occupied: true, currentRent: 1000 },
          { unitNumber: '2A', occupied: true, currentRent: 1000 },
          { unitNumber: '2B', occupied: true, currentRent: 1000 },
          { unitNumber: '3A', occupied: true, currentRent: 1000 },
          { unitNumber: '3B', occupied: true, currentRent: 1000 },
          { unitNumber: '4A', occupied: true, currentRent: 1000 },
          { unitNumber: '4B', occupied: true, currentRent: 1000 },
          { unitNumber: '5A', occupied: true, currentRent: 1000 },
          { unitNumber: '5B', occupied: false, currentRent: 0 },
        ],
      };

      const validation = validateRentRoll(data);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('debe detectar error cuando no hay unidades', () => {
      const data: ParsedRentRoll = {
        totalUnits: 0,
        occupiedUnits: 0,
        totalMonthlyRent: 0,
        averageRentPerUnit: 0,
        occupancyRate: 0,
        units: [],
      };

      const validation = validateRentRoll(data);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Número de unidades inválido');
      expect(validation.errors).toContain('No se encontraron unidades en el documento');
    });

    it('debe detectar discrepancia en número de unidades', () => {
      const data: ParsedRentRoll = {
        totalUnits: 10,
        occupiedUnits: 8,
        totalMonthlyRent: 8000,
        averageRentPerUnit: 1000,
        occupancyRate: 80,
        units: [
          { unitNumber: '1A', occupied: true, currentRent: 1000 },
          { unitNumber: '1B', occupied: true, currentRent: 1000 },
          // Solo 2 unidades en lugar de 10
        ],
      };

      const validation = validateRentRoll(data);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some((w) => w.includes('Discrepancia'))).toBe(true);
    });

    it('debe advertir sobre ocupación muy baja', () => {
      const data: ParsedRentRoll = {
        totalUnits: 10,
        occupiedUnits: 3,
        totalMonthlyRent: 3000,
        averageRentPerUnit: 1000,
        occupancyRate: 30,
        units: Array(10)
          .fill(null)
          .map((_, i) => ({
            unitNumber: `${i + 1}`,
            occupied: i < 3,
            currentRent: i < 3 ? 1000 : 0,
          })),
      };

      const validation = validateRentRoll(data);

      expect(validation.warnings).toContain('Tasa de ocupación muy baja (< 50%)');
    });

    it('debe detectar unidad ocupada sin renta', () => {
      const data: ParsedRentRoll = {
        totalUnits: 2,
        occupiedUnits: 2,
        totalMonthlyRent: 1000,
        averageRentPerUnit: 500,
        occupancyRate: 100,
        units: [
          { unitNumber: '1A', occupied: true, currentRent: 1000 },
          { unitNumber: '1B', occupied: true, currentRent: 0 }, // Error: ocupada sin renta
        ],
      };

      const validation = validateRentRoll(data);

      expect(validation.warnings.some((w) => w.includes('ocupada pero sin renta'))).toBe(true);
    });

    it('debe detectar renta atípicamente alta', () => {
      const data: ParsedRentRoll = {
        totalUnits: 3,
        occupiedUnits: 3,
        totalMonthlyRent: 6000,
        averageRentPerUnit: 2000,
        occupancyRate: 100,
        units: [
          { unitNumber: '1A', occupied: true, currentRent: 1000 },
          { unitNumber: '1B', occupied: true, currentRent: 1000 },
          { unitNumber: '1C', occupied: true, currentRent: 8000 }, // 4x promedio
        ],
      };

      const validation = validateRentRoll(data);

      expect(validation.warnings.some((w) => w.includes('renta muy alta'))).toBe(true);
    });

    it('debe detectar renta atípicamente baja', () => {
      const data: ParsedRentRoll = {
        totalUnits: 3,
        occupiedUnits: 3,
        totalMonthlyRent: 2200,
        averageRentPerUnit: 733,
        occupancyRate: 100,
        units: [
          { unitNumber: '1A', occupied: true, currentRent: 1000 },
          { unitNumber: '1B', occupied: true, currentRent: 1000 },
          { unitNumber: '1C', occupied: true, currentRent: 200 }, // 27% del promedio
        ],
      };

      const validation = validateRentRoll(data);

      expect(validation.warnings.some((w) => w.includes('renta muy baja'))).toBe(true);
    });
  });

  describe('Generación de Resumen', () => {
    it('debe generar resumen completo', () => {
      const data: ParsedRentRoll = {
        buildingName: 'Edificio Test',
        totalUnits: 5,
        occupiedUnits: 4,
        totalMonthlyRent: 4000,
        averageRentPerUnit: 1000,
        occupancyRate: 80,
        units: [
          { unitNumber: '1A', occupied: true, currentRent: 1000 },
          { unitNumber: '1B', occupied: true, currentRent: 1000 },
          { unitNumber: '2A', occupied: true, currentRent: 1000 },
          { unitNumber: '2B', occupied: true, currentRent: 1000 },
          { unitNumber: '3A', occupied: false, currentRent: 0 },
        ],
      };

      const summary = generateSummary(data);

      expect(summary.overview.totalUnits).toBe(5);
      expect(summary.overview.occupiedUnits).toBe(4);
      expect(summary.overview.vacantUnits).toBe(1);
      expect(summary.overview.occupancyRate).toBe(80);

      expect(summary.income.totalMonthlyRent).toBe(4000);
      expect(summary.income.potentialMonthlyIncome).toBe(5000);
      expect(summary.income.lostIncomeFromVacancy).toBe(1000);

      expect(summary.rentDistribution.min).toBe(1000);
      expect(summary.rentDistribution.max).toBe(1000);
      expect(summary.rentDistribution.average).toBe(1000);

      expect(summary.vacantUnitsDetails).toHaveLength(1);
      expect(summary.vacantUnitsDetails[0].unitNumber).toBe('3A');
    });

    it('debe calcular distribución de rentas correctamente', () => {
      const data: ParsedRentRoll = {
        totalUnits: 5,
        occupiedUnits: 5,
        totalMonthlyRent: 5500,
        averageRentPerUnit: 1100,
        occupancyRate: 100,
        units: [
          { unitNumber: '1A', occupied: true, currentRent: 800 },
          { unitNumber: '1B', occupied: true, currentRent: 1000 },
          { unitNumber: '2A', occupied: true, currentRent: 1100 },
          { unitNumber: '2B', occupied: true, currentRent: 1200 },
          { unitNumber: '3A', occupied: true, currentRent: 1400 },
        ],
      };

      const summary = generateSummary(data);

      expect(summary.rentDistribution.min).toBe(800);
      expect(summary.rentDistribution.max).toBe(1400);
      expect(summary.rentDistribution.median).toBe(1100);
    });

    it('debe identificar pérdida de ingresos por vacancia', () => {
      const data: ParsedRentRoll = {
        totalUnits: 10,
        occupiedUnits: 7,
        totalMonthlyRent: 7000,
        averageRentPerUnit: 1000,
        occupancyRate: 70,
        units: Array(10)
          .fill(null)
          .map((_, i) => ({
            unitNumber: `${i + 1}`,
            occupied: i < 7,
            currentRent: i < 7 ? 1000 : 0,
          })),
      };

      const summary = generateSummary(data);

      expect(summary.income.potentialMonthlyIncome).toBe(10000);
      expect(summary.income.lostIncomeFromVacancy).toBe(3000);
      expect(summary.vacantUnitsDetails).toHaveLength(3);
    });
  });

  describe('Casos de Estudio Reales', () => {
    it('debe procesar rent roll de edificio pequeño (8 unidades)', () => {
      const data: ParsedRentRoll = {
        buildingName: 'Edificio Residencial A',
        address: 'Av. Diagonal 456, Barcelona',
        totalUnits: 8,
        occupiedUnits: 7,
        totalMonthlyRent: 7200,
        averageRentPerUnit: 1000,
        occupancyRate: 87.5,
        units: [
          { unitNumber: '1º-1ª', occupied: true, currentRent: 900, tenant: 'Juan Pérez' },
          { unitNumber: '1º-2ª', occupied: true, currentRent: 900, tenant: 'María López' },
          { unitNumber: '2º-1ª', occupied: true, currentRent: 1000, tenant: 'Carlos Ruiz' },
          { unitNumber: '2º-2ª', occupied: true, currentRent: 1000, tenant: 'Ana García' },
          { unitNumber: '3º-1ª', occupied: true, currentRent: 1100, tenant: 'Luis Martín' },
          { unitNumber: '3º-2ª', occupied: true, currentRent: 1100, tenant: 'Elena Torres' },
          { unitNumber: '4º-1ª', occupied: true, currentRent: 1200, tenant: 'Pedro Sánchez' },
          { unitNumber: '4º-2ª', occupied: false, currentRent: 0 },
        ],
      };

      const validation = validateRentRoll(data);
      const summary = generateSummary(data);

      expect(validation.valid).toBe(true);
      expect(summary.overview.occupancyRate).toBe(87.5);
      expect(summary.income.lostIncomeFromVacancy).toBeCloseTo(800, 0);
      expect(summary.vacantUnitsDetails[0].unitNumber).toBe('4º-2ª');
    });

    it('debe detectar problemas en rent roll con datos inconsistentes', () => {
      const data: ParsedRentRoll = {
        buildingName: 'Edificio Problemático',
        totalUnits: 12,
        occupiedUnits: 10,
        totalMonthlyRent: 8500,
        averageRentPerUnit: 850,
        occupancyRate: 83,
        units: [
          { unitNumber: '1A', occupied: true, currentRent: 800 },
          { unitNumber: '1B', occupied: true, currentRent: 0 }, // Ocupada sin renta
          { unitNumber: '2A', occupied: true, currentRent: 5000 }, // Renta atípica
          { unitNumber: '2B', occupied: true, currentRent: 800 },
          { unitNumber: '3A', occupied: true, currentRent: 200 }, // Renta muy baja
          { unitNumber: '3B', occupied: true, currentRent: 800 },
          { unitNumber: '4A', occupied: true, currentRent: 900 },
          // Solo 7 unidades en lugar de 12
        ],
      };

      const validation = validateRentRoll(data);

      expect(validation.valid).toBe(true); // No hay errores críticos
      expect(validation.warnings.length).toBeGreaterThan(3);
      expect(validation.warnings.some((w) => w.includes('Discrepancia'))).toBe(true);
      expect(validation.warnings.some((w) => w.includes('ocupada pero sin renta'))).toBe(true);
      expect(validation.warnings.some((w) => w.includes('renta muy alta'))).toBe(true);
      expect(validation.warnings.some((w) => w.includes('renta muy baja'))).toBe(true);
    });
  });
});
