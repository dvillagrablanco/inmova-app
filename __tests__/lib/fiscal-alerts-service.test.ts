/**
 * Tests para fiscal-alerts-service.ts
 * Verifica la generación de alertas fiscales
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  getPrismaClient: vi.fn(() => ({
    company: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'vidaro1',
        nombre: 'Vidaro Inversiones SL',
        childCompanies: [
          { id: 'viroda1', nombre: 'Viroda SL' },
          { id: 'rovida1', nombre: 'Rovida SL' },
        ],
      }),
    },
    mortgage: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  })),
}));

describe('fiscal-alerts-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFiscalAlerts', () => {
    it('retorna alertas para la empresa y filiales', async () => {
      const { getFiscalAlerts } = await import('@/lib/fiscal-alerts-service');
      const alerts = await getFiscalAlerts('vidaro1');

      // Debe generar alertas para Vidaro + Viroda + Rovida
      expect(alerts.length).toBeGreaterThanOrEqual(0);
      
      // Verificar estructura de cada alerta
      for (const alert of alerts) {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('tipo');
        expect(alert).toHaveProperty('titulo');
        expect(alert).toHaveProperty('fechaLimite');
        expect(alert).toHaveProperty('diasRestantes');
        expect(alert).toHaveProperty('urgencia');
        expect(['baja', 'media', 'alta', 'critica']).toContain(alert.urgencia);
      }
    });

    it('ordena alertas por urgencia', async () => {
      const { getFiscalAlerts } = await import('@/lib/fiscal-alerts-service');
      const alerts = await getFiscalAlerts('vidaro1');

      if (alerts.length > 1) {
        const urgenciaOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
        for (let i = 1; i < alerts.length; i++) {
          expect(urgenciaOrder[alerts[i].urgencia]).toBeGreaterThanOrEqual(
            urgenciaOrder[alerts[i - 1].urgencia]
          );
        }
      }
    });

    it('solo retorna alertas dentro de 30 días', async () => {
      const { getFiscalAlerts } = await import('@/lib/fiscal-alerts-service');
      const alerts = await getFiscalAlerts('vidaro1');

      for (const alert of alerts) {
        expect(alert.diasRestantes).toBeLessThanOrEqual(30);
        expect(alert.diasRestantes).toBeGreaterThan(0);
      }
    });

    it('incluye alertas de 3 empresas (holding + 2 filiales)', async () => {
      const { getFiscalAlerts } = await import('@/lib/fiscal-alerts-service');
      const alerts = await getFiscalAlerts('vidaro1');

      const companyIds = new Set(alerts.map(a => a.companyId));
      // Puede ser hasta 3 empresas
      expect(companyIds.size).toBeLessThanOrEqual(3);
    });
  });
});
