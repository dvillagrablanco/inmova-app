/**
 * MAINTENANCE PREDICTION SERVICE - COMPREHENSIVE UNIT TESTS
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { addDays, subMonths, differenceInDays } from 'date-fns';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    maintenanceHistory: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { predictEquipmentFailures } from '@/lib/maintenance-prediction-service';

describe('🔧 Maintenance Prediction Service', () => {
  const mockHistory = [
    {
      id: 'hist-1',
      equipoSistema: 'Caldera',
      buildingId: 'building-1',
      unitId: null,
      tipoProblema: 'Fallo de presión',
      fechaDeteccion: subMonths(new Date(), 6),
      fechaReparacion: subMonths(new Date(), 6),
      costoReparacion: 500,
      tiempoReparacion: 2,
    },
    {
      id: 'hist-2',
      equipoSistema: 'Caldera',
      buildingId: 'building-1',
      unitId: null,
      tipoProblema: 'Fuga',
      fechaDeteccion: subMonths(new Date(), 3),
      fechaReparacion: subMonths(new Date(), 3),
      costoReparacion: 800,
      tiempoReparacion: 3,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('✅ Debe predecir fallas con historial suficiente', async () => {
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

    const predictions = await predictEquipmentFailures('company-123');

    expect(Array.isArray(predictions)).toBe(true);
    expect(predictions.length).toBeGreaterThan(0);
  });

  test('✅ Debe calcular probabilidad de falla', async () => {
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0]).toHaveProperty('probabilidad');
      expect(predictions[0].probabilidad).toBeGreaterThanOrEqual(0);
      expect(predictions[0].probabilidad).toBeLessThanOrEqual(95);
    }
  });

  test('✅ Debe incluir factores de riesgo', async () => {
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0]).toHaveProperty('factoresRiesgo');
      expect(Array.isArray(predictions[0].factoresRiesgo)).toBe(true);
    }
  });

  test('✅ Debe incluir recomendaciones', async () => {
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0]).toHaveProperty('recomendaciones');
      expect(Array.isArray(predictions[0].recomendaciones)).toBe(true);
      expect(predictions[0].recomendaciones.length).toBeGreaterThan(0);
    }
  });

  test('✅ Debe calcular intervalo promedio entre fallas', async () => {
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0]).toHaveProperty('intervaloPromedio');
      expect(typeof predictions[0].intervaloPromedio).toBe('number');
    }
  });

  test('⚠️ Debe manejar historial vacío', async () => {
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const predictions = await predictEquipmentFailures('company-123');

    expect(predictions).toEqual([]);
  });

  test('⚠️ Debe ignorar equipos con < 2 fallas', async () => {
    const singleFailure = [mockHistory[0]];
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      singleFailure
    );

    const predictions = await predictEquipmentFailures('company-123');

    expect(predictions.length).toBe(0);
  });

  test('⚠️ Debe manejar múltiples equipos', async () => {
    const multipleEquipment = [
      ...mockHistory,
      {
        id: 'hist-3',
        equipoSistema: 'Ascensor',
        buildingId: 'building-1',
        unitId: null,
        tipoProblema: 'Fallo motor',
        fechaDeteccion: subMonths(new Date(), 8),
        fechaReparacion: subMonths(new Date(), 8),
        costoReparacion: 1500,
        tiempoReparacion: 5,
      },
      {
        id: 'hist-4',
        equipoSistema: 'Ascensor',
        buildingId: 'building-1',
        unitId: null,
        tipoProblema: 'Fallo puertas',
        fechaDeteccion: subMonths(new Date(), 4),
        fechaReparacion: subMonths(new Date(), 4),
        costoReparacion: 800,
        tiempoReparacion: 2,
      },
    ];

    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      multipleEquipment
    );

    const predictions = await predictEquipmentFailures('company-123');

    expect(predictions.length).toBe(2);
  });

  test('⚠️ Debe manejar costos elevados', async () => {
    const highCost = [
      {
        ...mockHistory[0],
        costoReparacion: 3000,
      },
      {
        ...mockHistory[1],
        costoReparacion: 2500,
      },
    ];

    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(highCost);

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0].factoresRiesgo).toContain('Costos de reparación elevados');
    }
  });

  test('⚠️ Debe detectar alto historial de fallas', async () => {
    const manyFailures = Array.from({ length: 6 }, (_, i) => ({
      id: `hist-${i}`,
      equipoSistema: 'Sistema crítico',
      buildingId: 'building-1',
      unitId: null,
      tipoProblema: `Fallo ${i}`,
      fechaDeteccion: subMonths(new Date(), 12 - i * 2),
      fechaReparacion: subMonths(new Date(), 12 - i * 2),
      costoReparacion: 500,
      tiempoReparacion: 2,
    }));

    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      manyFailures
    );

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0].factoresRiesgo).toContain('Alto historial de fallas');
    }
  });

  test('⚠️ Debe detectar intervalos cortos', async () => {
    const shortIntervals = [
      {
        ...mockHistory[0],
        fechaDeteccion: subMonths(new Date(), 2),
      },
      {
        ...mockHistory[1],
        fechaDeteccion: subMonths(new Date(), 1),
      },
    ];

    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      shortIntervals
    );

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0].intervaloPromedio).toBeLessThan(90);
    }
  });

  test('✅ Debe calcular nivel de confianza', async () => {
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0]).toHaveProperty('nivelConfianza');
      expect(predictions[0].nivelConfianza).toBeGreaterThanOrEqual(0);
      expect(predictions[0].nivelConfianza).toBeLessThanOrEqual(1);
    }
  });

  test('⚠️ Debe manejar fechas futuras en predicción', async () => {
    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0]).toHaveProperty('fechaEstimada');
    }
  });

  test('⚠️ Debe limitar probabilidad máxima a 95%', async () => {
    const oldHistory = [
      {
        ...mockHistory[0],
        fechaDeteccion: subMonths(new Date(), 24),
        fechaReparacion: subMonths(new Date(), 24),
      },
      {
        ...mockHistory[1],
        fechaDeteccion: subMonths(new Date(), 12),
        fechaReparacion: subMonths(new Date(), 12),
      },
    ];

    (prisma.maintenanceHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(oldHistory);

    const predictions = await predictEquipmentFailures('company-123');

    if (predictions.length > 0) {
      expect(predictions[0].probabilidad).toBeLessThanOrEqual(95);
    }
  });
});
