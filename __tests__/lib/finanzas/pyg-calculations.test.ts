import { describe, it, expect } from 'vitest';
import {
  makePygLine,
  makePygGroup,
  buildPygFromExpenses,
} from '@/lib/finanzas/cuadro-mandos-service';
import {
  formatEuro,
  formatPct,
  formatCompact,
  formatNumber,
} from '@/lib/finanzas/pyg-config';

// ============================================================================
// TEST: makePygLine - Cálculo de línea individual del PyG
// ============================================================================

describe('makePygLine', () => {
  it('calcula correctamente porcentajes sobre rentas e inversión', () => {
    const line = makePygLine('E3', 'Ingresos', 5080620, 5080620, 20884222);

    expect(line.codigo).toBe('E3');
    expect(line.nombre).toBe('Ingresos');
    expect(line.importe).toBe(5080620);
    expect(line.pctSobreRentas).toBeCloseTo(1.0, 5); // 100% de sí mismo
    expect(line.pctSobreInversion).toBeCloseTo(5080620 / 20884222, 5);
  });

  it('maneja totalRentas = 0 sin dividir por cero', () => {
    const line = makePygLine('E3', 'Test', 1000, 0, 50000);

    expect(line.pctSobreRentas).toBe(0);
    expect(line.pctSobreInversion).toBeCloseTo(1000 / 50000, 5);
  });

  it('maneja valorInversion = 0 sin dividir por cero', () => {
    const line = makePygLine('E3', 'Test', 1000, 5000, 0);

    expect(line.pctSobreRentas).toBeCloseTo(1000 / 5000, 5);
    expect(line.pctSobreInversion).toBe(0);
  });

  it('maneja ambos denominadores = 0', () => {
    const line = makePygLine('E3', 'Test', 1000, 0, 0);

    expect(line.pctSobreRentas).toBe(0);
    expect(line.pctSobreInversion).toBe(0);
  });

  it('maneja importes negativos (gastos)', () => {
    const line = makePygLine('E20a02', 'Reparaciones', -60000, 5000000, 20000000);

    expect(line.importe).toBe(-60000);
    expect(line.pctSobreRentas).toBeCloseTo(-60000 / 5000000, 5);
    expect(line.pctSobreInversion).toBeCloseTo(-60000 / 20000000, 5);
  });

  it('maneja importe = 0', () => {
    const line = makePygLine('E20a05', 'Transportes', 0, 5000000, 20000000);

    expect(line.importe).toBe(0);
    expect(line.pctSobreRentas).toBe(0);
    expect(line.pctSobreInversion).toBe(0);
  });
});

// ============================================================================
// TEST: makePygGroup - Agrupación con subtotal
// ============================================================================

describe('makePygGroup', () => {
  it('suma correctamente los importes del detalle', () => {
    const detalle = [
      makePygLine('E21a', 'IBI', -253545, 5000000, 20000000),
      makePygLine('E21b', 'Basuras', -30069, 5000000, 20000000),
      makePygLine('E21c', 'Otros tributos', -5091, 5000000, 20000000),
    ];

    const group = makePygGroup('TRIBUTOS', 'Tributos', detalle, 5000000, 20000000);

    const expectedSum = -253545 + -30069 + -5091;
    expect(group.subtotal.importe).toBe(expectedSum);
    expect(group.subtotal.codigo).toBe('TRIBUTOS');
    expect(group.subtotal.nombre).toBe('Tributos');
    expect(group.detalle).toHaveLength(3);
  });

  it('calcula porcentajes del subtotal correctamente', () => {
    const detalle = [
      makePygLine('E16', 'Sueldos', -194397, 5000000, 20000000),
      makePygLine('E17', 'SS', -56688, 5000000, 20000000),
    ];

    const group = makePygGroup('COSTES_SOC', 'Costes Sociales', detalle, 5000000, 20000000);

    const expectedSum = -194397 + -56688;
    expect(group.subtotal.pctSobreRentas).toBeCloseTo(expectedSum / 5000000, 5);
    expect(group.subtotal.pctSobreInversion).toBeCloseTo(expectedSum / 20000000, 5);
  });

  it('maneja detalle vacío', () => {
    const group = makePygGroup('EMPTY', 'Vacío', [], 5000000, 20000000);

    expect(group.subtotal.importe).toBe(0);
    expect(group.detalle).toHaveLength(0);
  });
});

// ============================================================================
// TEST: buildPygFromExpenses - Construcción completa del PyG
// ============================================================================

describe('buildPygFromExpenses', () => {
  it('genera PyG completo con gastos reales', () => {
    // Simular expenses agrupados (formato del groupBy de Prisma)
    const expenses = [
      { categoria: 'reparaciones', costCenterId: null, _sum: { monto: 60000 } },
      { categoria: 'comunidad', costCenterId: null, _sum: { monto: 293000 } },
      { categoria: 'seguros', costCenterId: null, _sum: { monto: 55592 } },
      { categoria: 'ibi', costCenterId: null, _sum: { monto: 253545 } },
      { categoria: 'sueldos_salarios', costCenterId: null, _sum: { monto: 194397 } },
      { categoria: 'amortizaciones', costCenterId: null, _sum: { monto: 1176141 } },
    ];

    const pyg = buildPygFromExpenses(expenses, 5080620, 106, 20884222);

    // Ingresos
    expect(pyg.totalIngresos.importe).toBe(5080620 + 106);
    expect(pyg.ingresosArrendamientos.importe).toBe(5080620);
    expect(pyg.otrosIngresos.importe).toBe(106);

    // Gastos (negativos)
    expect(pyg.serviciosExteriores.subtotal.importe).toBeLessThan(0);
    expect(pyg.tributos.subtotal.importe).toBeLessThan(0);
    expect(pyg.costesSociales.subtotal.importe).toBeLessThan(0);

    // Reparaciones dentro de servicios exteriores
    const reparaciones = pyg.serviciosExteriores.detalle.find((d) => d.codigo === 'E20a02');
    expect(reparaciones).toBeDefined();
    expect(reparaciones!.importe).toBe(-60000);

    // IBI dentro de tributos
    const ibi = pyg.tributos.detalle.find((d) => d.codigo === 'E21a');
    expect(ibi).toBeDefined();
    expect(ibi!.importe).toBe(-253545);

    // EBITDA = ingresos + gastos operativos
    const totalGastos =
      pyg.serviciosExteriores.subtotal.importe +
      pyg.tributos.subtotal.importe +
      pyg.costesSociales.subtotal.importe;
    expect(pyg.ebitda.importe).toBe(pyg.totalIngresos.importe + totalGastos);

    // Resultado explotación = EBITDA + amortizaciones + enajenaciones
    expect(pyg.resultadoExplotacion.importe).toBe(
      pyg.ebitda.importe + pyg.amortizaciones.importe + pyg.resultadoEnajenaciones.importe
    );

    // Resultado periodo (sin financiero ni extraordinario en este caso)
    expect(pyg.resultadoPeriodo.importe).toBe(
      pyg.resultadoExplotacion.importe +
        pyg.resultadoFinanciero.importe +
        pyg.ingresosGtosExtraordinarios.importe +
        pyg.impuestoSociedades.importe
    );
  });

  it('genera PyG vacío sin expenses', () => {
    const pyg = buildPygFromExpenses([], 100000, 0, 500000);

    expect(pyg.totalIngresos.importe).toBe(100000);
    expect(pyg.totalGastos.importe).toBe(0);
    expect(pyg.ebitda.importe).toBe(100000);
    expect(pyg.resultadoExplotacion.importe).toBe(100000);
    expect(pyg.resultadoPeriodo.importe).toBe(100000);
  });

  it('filtra por centro de coste', () => {
    const expenses = [
      { categoria: 'reparaciones', costCenterId: 'cc1', _sum: { monto: 10000 } },
      { categoria: 'reparaciones', costCenterId: 'cc2', _sum: { monto: 50000 } },
      { categoria: 'seguros', costCenterId: 'cc1', _sum: { monto: 5000 } },
    ];

    const pygCC1 = buildPygFromExpenses(expenses, 100000, 0, 500000, 'cc1');

    // Solo debe incluir gastos del cc1
    const reparaciones = pygCC1.serviciosExteriores.detalle.find((d) => d.codigo === 'E20a02');
    expect(reparaciones!.importe).toBe(-10000); // Solo cc1

    const seguros = pygCC1.serviciosExteriores.detalle.find((d) => d.codigo === 'E20a06');
    expect(seguros!.importe).toBe(-5000);
  });

  it('mantiene coherencia: totalGastos = sum(grupos)', () => {
    const expenses = [
      { categoria: 'comunidad', costCenterId: null, _sum: { monto: 100000 } },
      { categoria: 'ibi', costCenterId: null, _sum: { monto: 50000 } },
      { categoria: 'sueldos_salarios', costCenterId: null, _sum: { monto: 80000 } },
    ];

    const pyg = buildPygFromExpenses(expenses, 500000, 0, 1000000);

    const sumGrupos =
      pyg.serviciosExteriores.subtotal.importe +
      pyg.tributos.subtotal.importe +
      pyg.costesSociales.subtotal.importe;

    expect(pyg.totalGastos.importe).toBe(sumGrupos);
  });
});

// ============================================================================
// TEST: Formatters
// ============================================================================

describe('formatEuro', () => {
  it('formatea cantidades positivas', () => {
    const formatted = formatEuro(5080620);
    // Formato español: 5.080.620 €
    expect(formatted).toContain('5');
    expect(formatted).toContain('€');
  });

  it('formatea cantidades negativas', () => {
    const formatted = formatEuro(-1131686);
    expect(formatted).toContain('1');
    expect(formatted).toContain('€');
  });

  it('formatea cero', () => {
    const formatted = formatEuro(0);
    expect(formatted).toContain('0');
    expect(formatted).toContain('€');
  });

  it('formatea con decimales cuando se solicita', () => {
    const formatted = formatEuro(1234.56, true);
    expect(formatted).toContain('€');
  });
});

describe('formatPct', () => {
  it('formatea porcentajes correctamente', () => {
    const formatted = formatPct(0.7772);
    // 77,72 %
    expect(formatted).toContain('77');
    expect(formatted).toContain('%');
  });

  it('formatea 100%', () => {
    const formatted = formatPct(1.0);
    expect(formatted).toContain('100');
    expect(formatted).toContain('%');
  });

  it('formatea 0%', () => {
    const formatted = formatPct(0);
    expect(formatted).toContain('0');
    expect(formatted).toContain('%');
  });

  it('formatea porcentajes negativos', () => {
    const formatted = formatPct(-0.2227);
    expect(formatted).toContain('22');
    expect(formatted).toContain('%');
  });
});

describe('formatCompact', () => {
  it('formatea millones', () => {
    expect(formatCompact(20884222)).toContain('20.9M');
  });

  it('formatea miles', () => {
    expect(formatCompact(150000)).toContain('150K');
  });

  it('formatea valores pequeños', () => {
    expect(formatCompact(500)).toContain('500');
    expect(formatCompact(500)).toContain('€');
  });

  it('formatea negativos en millones', () => {
    const result = formatCompact(-5000000);
    expect(result).toContain('-');
    expect(result).toContain('5.0M');
  });
});

describe('formatNumber', () => {
  it('formatea números grandes con separador de miles', () => {
    const formatted = formatNumber(1234567);
    // Formato español: 1.234.567
    expect(formatted).toContain('1');
  });

  it('formatea cero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
