import { describe, it, expect } from 'vitest';
import type { CarteraKpis, EjercicioComparativo } from '@/types/finanzas';

// ============================================================================
// TEST: Cálculos de KPIs de Cartera Inmobiliaria
// Verifica la lógica de cálculo de plusvalía, tasas, y comparativos
// ============================================================================

// Helper que replica la lógica de cálculo del servicio
function calculateKpis(units: {
  precioCompra: number;
  valorMercado: number;
  disponible: boolean;
  ocupada: boolean;
}[]): CarteraKpis {
  let valorInversion = 0;
  let valorMercado = 0;
  let totalUnidades = 0;
  let unidadesDisponibles = 0;
  let unidadesOcupadas = 0;

  for (const unit of units) {
    valorInversion += unit.precioCompra;
    valorMercado += unit.valorMercado;
    totalUnidades += 1;
    if (unit.disponible || unit.ocupada) unidadesDisponibles += 1;
    if (unit.ocupada) unidadesOcupadas += 1;
  }

  return {
    valorInversion,
    valorMercado,
    plusvaliaLatente: valorMercado - valorInversion,
    tasaDisponibilidad: totalUnidades > 0 ? unidadesDisponibles / totalUnidades : 0,
    tasaOcupacion: totalUnidades > 0 ? unidadesOcupadas / totalUnidades : 0,
  };
}

describe('KPI Calculations', () => {
  describe('Plusvalía Latente', () => {
    it('calcula plusvalía positiva cuando mercado > inversión', () => {
      const kpis = calculateKpis([
        { precioCompra: 100000, valorMercado: 150000, disponible: true, ocupada: true },
        { precioCompra: 200000, valorMercado: 280000, disponible: true, ocupada: false },
      ]);

      expect(kpis.plusvaliaLatente).toBe(130000); // (150000+280000) - (100000+200000)
      expect(kpis.plusvaliaLatente).toBeGreaterThan(0);
    });

    it('calcula plusvalía negativa cuando inversión > mercado', () => {
      const kpis = calculateKpis([
        { precioCompra: 300000, valorMercado: 200000, disponible: true, ocupada: true },
      ]);

      expect(kpis.plusvaliaLatente).toBe(-100000);
      expect(kpis.plusvaliaLatente).toBeLessThan(0);
    });

    it('plusvalía = 0 cuando mercado == inversión', () => {
      const kpis = calculateKpis([
        { precioCompra: 100000, valorMercado: 100000, disponible: true, ocupada: true },
      ]);

      expect(kpis.plusvaliaLatente).toBe(0);
    });
  });

  describe('Tasa de Disponibilidad', () => {
    it('calcula 100% cuando todas disponibles', () => {
      const kpis = calculateKpis([
        { precioCompra: 100000, valorMercado: 120000, disponible: true, ocupada: false },
        { precioCompra: 100000, valorMercado: 120000, disponible: true, ocupada: true },
      ]);

      expect(kpis.tasaDisponibilidad).toBe(1.0);
    });

    it('calcula 50% cuando mitad disponibles', () => {
      const kpis = calculateKpis([
        { precioCompra: 100000, valorMercado: 120000, disponible: true, ocupada: false },
        { precioCompra: 100000, valorMercado: 120000, disponible: false, ocupada: false },
      ]);

      expect(kpis.tasaDisponibilidad).toBe(0.5);
    });

    it('calcula 0% sin unidades disponibles', () => {
      const kpis = calculateKpis([
        { precioCompra: 100000, valorMercado: 120000, disponible: false, ocupada: false },
        { precioCompra: 100000, valorMercado: 120000, disponible: false, ocupada: false },
      ]);

      expect(kpis.tasaDisponibilidad).toBe(0);
    });

    it('retorna 0 sin unidades', () => {
      const kpis = calculateKpis([]);
      expect(kpis.tasaDisponibilidad).toBe(0);
    });
  });

  describe('Tasa de Ocupación', () => {
    it('calcula 100% cuando todas ocupadas', () => {
      const kpis = calculateKpis([
        { precioCompra: 100000, valorMercado: 120000, disponible: true, ocupada: true },
        { precioCompra: 100000, valorMercado: 120000, disponible: true, ocupada: true },
      ]);

      expect(kpis.tasaOcupacion).toBe(1.0);
    });

    it('calcula correctamente ocupación parcial', () => {
      const kpis = calculateKpis([
        { precioCompra: 100000, valorMercado: 120000, disponible: true, ocupada: true },
        { precioCompra: 100000, valorMercado: 120000, disponible: true, ocupada: false },
        { precioCompra: 100000, valorMercado: 120000, disponible: false, ocupada: false },
      ]);

      expect(kpis.tasaOcupacion).toBeCloseTo(1 / 3, 5);
    });

    it('retorna 0 sin unidades ocupadas', () => {
      const kpis = calculateKpis([
        { precioCompra: 100000, valorMercado: 120000, disponible: true, ocupada: false },
      ]);

      expect(kpis.tasaOcupacion).toBe(0);
    });

    it('retorna 0 sin unidades', () => {
      const kpis = calculateKpis([]);
      expect(kpis.tasaOcupacion).toBe(0);
    });
  });

  describe('Valores de inversión y mercado', () => {
    it('suma correctamente valores de múltiples unidades', () => {
      const kpis = calculateKpis([
        { precioCompra: 38977, valorMercado: 406538, disponible: true, ocupada: true },
        { precioCompra: 28896, valorMercado: 21500, disponible: true, ocupada: false },
        { precioCompra: 2104, valorMercado: 8500, disponible: true, ocupada: true },
      ]);

      expect(kpis.valorInversion).toBe(38977 + 28896 + 2104);
      expect(kpis.valorMercado).toBe(406538 + 21500 + 8500);
    });

    it('maneja valores 0', () => {
      const kpis = calculateKpis([
        { precioCompra: 0, valorMercado: 0, disponible: false, ocupada: false },
      ]);

      expect(kpis.valorInversion).toBe(0);
      expect(kpis.valorMercado).toBe(0);
      expect(kpis.plusvaliaLatente).toBe(0);
    });
  });

  describe('Comparativo Multi-Ejercicio', () => {
    it('detecta tendencia positiva en valor de mercado', () => {
      const ejercicios: EjercicioComparativo[] = [
        { ejercicio: 2022, valorInversion: 20000000, valorMercado: 31000000, plusvaliaLatente: 11000000, tasaDisponibilidad: 0.76, tasaOcupacion: 0.78 },
        { ejercicio: 2023, valorInversion: 26000000, valorMercado: 36000000, plusvaliaLatente: 10000000, tasaDisponibilidad: 0.86, tasaOcupacion: 0.83 },
        { ejercicio: 2024, valorInversion: 49000000, valorMercado: 56000000, plusvaliaLatente: 7000000, tasaDisponibilidad: 0.81, tasaOcupacion: 0.77 },
      ];

      // Valor de mercado debe ser creciente
      for (let i = 1; i < ejercicios.length; i++) {
        expect(ejercicios[i].valorMercado).toBeGreaterThan(ejercicios[i - 1].valorMercado);
      }
    });

    it('calcula cambio porcentual entre ejercicios', () => {
      const prev: EjercicioComparativo = {
        ejercicio: 2023,
        valorInversion: 26535581,
        valorMercado: 36417198,
        plusvaliaLatente: 9881617,
        tasaDisponibilidad: 0.8615,
        tasaOcupacion: 0.8288,
      };
      const current: EjercicioComparativo = {
        ejercicio: 2024,
        valorInversion: 49378200,
        valorMercado: 56504296,
        plusvaliaLatente: 7126096,
        tasaDisponibilidad: 0.8052,
        tasaOcupacion: 0.7655,
      };

      const pctChangeInversion =
        ((current.valorInversion - prev.valorInversion) / Math.abs(prev.valorInversion)) * 100;
      expect(pctChangeInversion).toBeGreaterThan(0); // La inversión creció

      const pctChangePlusvalia =
        ((current.plusvaliaLatente - prev.plusvaliaLatente) / Math.abs(prev.plusvaliaLatente)) * 100;
      expect(pctChangePlusvalia).toBeLessThan(0); // La plusvalía disminuyó
    });
  });
});
