/**
 * REPORT SERVICE - UNIT TESTS
 * Tests comprehensivos para el servicio de reportes
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock de dependencias
const mockDoc = {
  internal: {
    pageSize: {
      width: 210,
      height: 297,
    },
  },
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  output: vi.fn(() => Buffer.from('mock-pdf')),
};

vi.mock('jspdf', () => ({
  default: vi.fn(function () {
    return mockDoc;
  }),
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    building: {
      findMany: vi.fn(),
    },
    unit: {
      count: vi.fn(),
    },
    scheduledReport: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  getPrismaClient: () => ({ prisma: {
    company: {
      findUnique: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    building: {
      findMany: vi.fn(),
    },
    unit: {
      count: vi.fn(),
    },
    scheduledReport: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } }),
}));

vi.mock('@/lib/email-config', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/s3', () => ({
  uploadFile: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  logError: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-config';
import { uploadFile } from '@/lib/s3';
import { generateReportPDF } from '@/lib/report-service';

describe.skip('📊 Report Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // GENERACIÓN DE PDF
  // ========================================

  describe.skip('generateReportPDF', () => {
    const validReportData = {
      tipo: 'morosidad',
      periodo: 'Enero 2026',
      fechaGeneracion: new Date('2026-01-03'),
      datos: {
        pagosPendientes: 5,
        totalMorosidad: 6000,
        inquilinos: [
          {
            nombreCompleto: 'Juan Pérez',
            unidad: '101',
            importe: 1200,
            diasAtraso: 15,
          },
        ],
      },
      companyInfo: {
        nombre: 'Inmova S.A.',
        cif: 'B12345678',
        direccion: 'Calle Mayor 123',
        telefono: '912345678',
        email: 'info@inmova.app',
      },
    };

    test('✅ Debe generar PDF con datos válidos', async () => {
      const pdf = await generateReportPDF(validReportData);

      expect(pdf).toBeDefined();
      expect(Buffer.isBuffer(pdf)).toBe(true);
    });

    test('✅ Debe generar reporte de morosidad', async () => {
      const reportData = {
        ...validReportData,
        tipo: 'morosidad',
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('✅ Debe generar reporte de ocupación', async () => {
      const reportData = {
        ...validReportData,
        tipo: 'ocupacion',
        datos: {
          totalUnidades: 100,
          unidadesOcupadas: 85,
          porcentajeOcupacion: 85,
          edificios: [
            {
              nombre: 'Edificio A',
              ocupacion: 90,
            },
          ],
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('✅ Debe generar reporte de ingresos', async () => {
      const reportData = {
        ...validReportData,
        tipo: 'ingresos',
        datos: {
          totalIngresos: 150000,
          ingresosMensuales: 12500,
          ingresosPorEdificio: [
            {
              nombre: 'Edificio A',
              ingresos: 50000,
            },
          ],
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('✅ Debe incluir información de la empresa', async () => {
      const reportData = {
        ...validReportData,
        companyInfo: {
          nombre: 'Test Company',
          cif: 'B99999999',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar empresa sin CIF', async () => {
      const reportData = {
        ...validReportData,
        companyInfo: {
          nombre: 'Test Company',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar lista vacía de inquilinos', async () => {
      const reportData = {
        ...validReportData,
        datos: {
          pagosPendientes: 0,
          totalMorosidad: 0,
          inquilinos: [],
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar datos null', async () => {
      const reportData = {
        ...validReportData,
        datos: {
          pagosPendientes: 0,
          totalMorosidad: 0,
          inquilinos: null,
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar periodo largo', async () => {
      const reportData = {
        ...validReportData,
        periodo: 'Enero 2026 - Diciembre 2026 (Informe Anual Completo)',
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar tipo de reporte personalizado', async () => {
      const reportData = {
        ...validReportData,
        tipo: 'personalizado',
        datos: {
          customField: 'value',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });
  });

  // ========================================
  // VALIDACIÓN DE ESTRUCTURA DE DATOS
  // ========================================

  describe('Validación de datos', () => {
    const minimalReportData = {
      tipo: 'morosidad',
      periodo: 'Test',
      fechaGeneracion: new Date(),
      datos: {},
      companyInfo: {
        nombre: 'Test',
      },
    };

    test('✅ Debe aceptar datos mínimos', async () => {
      const pdf = await generateReportPDF(minimalReportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar datos con valores 0', async () => {
      const reportData = {
        ...minimalReportData,
        datos: {
          pagosPendientes: 0,
          totalMorosidad: 0,
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar montos negativos', async () => {
      const reportData = {
        ...minimalReportData,
        datos: {
          totalMorosidad: -1000,
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar fechas en el futuro', async () => {
      const reportData = {
        ...minimalReportData,
        fechaGeneracion: new Date('2030-01-01'),
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar fechas muy antiguas', async () => {
      const reportData = {
        ...minimalReportData,
        fechaGeneracion: new Date('2000-01-01'),
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });
  });

  // ========================================
  // EDGE CASES ESPECÍFICOS
  // ========================================

  describe('Edge Cases', () => {
    test('⚠️ Debe manejar nombre de empresa muy largo', async () => {
      const reportData = {
        tipo: 'morosidad',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {},
        companyInfo: {
          nombre: 'a'.repeat(200),
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar caracteres especiales en nombre', async () => {
      const reportData = {
        tipo: 'morosidad',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {},
        companyInfo: {
          nombre: 'Empresa & Asociados © ™ ® "Inmova"',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar muchos inquilinos morosos', async () => {
      const manyTenants = Array.from({ length: 100 }, (_, i) => ({
        nombreCompleto: `Inquilino ${i}`,
        unidad: `${i}`,
        importe: 1000,
        diasAtraso: 10,
      }));

      const reportData = {
        tipo: 'morosidad',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {
          pagosPendientes: 100,
          totalMorosidad: 100000,
          inquilinos: manyTenants,
        },
        companyInfo: {
          nombre: 'Test',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar importe con muchos decimales', async () => {
      const reportData = {
        tipo: 'morosidad',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {
          totalMorosidad: 1234.5678901234,
        },
        companyInfo: {
          nombre: 'Test',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar días de atraso muy altos', async () => {
      const reportData = {
        tipo: 'morosidad',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {
          inquilinos: [
            {
              nombreCompleto: 'Test',
              unidad: '101',
              importe: 1000,
              diasAtraso: 999,
            },
          ],
        },
        companyInfo: {
          nombre: 'Test',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar tipo de reporte en mayúsculas', async () => {
      const reportData = {
        tipo: 'MOROSIDAD',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {},
        companyInfo: {
          nombre: 'Test',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('⚠️ Debe manejar periodo con caracteres especiales', async () => {
      const reportData = {
        tipo: 'morosidad',
        periodo: 'Enero-Diciembre / 2026 (Completo)',
        fechaGeneracion: new Date(),
        datos: {},
        companyInfo: {
          nombre: 'Test',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });
  });

  // ========================================
  // TIPOS DE REPORTES
  // ========================================

  describe('Tipos de reportes', () => {
    test('✅ Debe soportar reporte de mantenimiento', async () => {
      const reportData = {
        tipo: 'mantenimiento',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {
          solicitudesPendientes: 10,
          solicitudesCompletadas: 50,
          tiempoPromedioResolucion: 48,
        },
        companyInfo: {
          nombre: 'Test',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('✅ Debe soportar reporte de contratos', async () => {
      const reportData = {
        tipo: 'contratos',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {
          contratosActivos: 85,
          proximosVencimientos: 5,
          renovacionesPendientes: 3,
        },
        companyInfo: {
          nombre: 'Test',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });

    test('✅ Debe soportar reporte financiero', async () => {
      const reportData = {
        tipo: 'financiero',
        periodo: 'Test',
        fechaGeneracion: new Date(),
        datos: {
          ingresosTotales: 150000,
          gastosTotales: 50000,
          beneficioNeto: 100000,
          roi: 15.5,
        },
        companyInfo: {
          nombre: 'Test',
        },
      };

      const pdf = await generateReportPDF(reportData);

      expect(pdf).toBeDefined();
    });
  });
});
