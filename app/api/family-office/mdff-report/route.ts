import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { format, subMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getAccountLiquidBalance,
  normalizeInvestmentVehicleName,
  resolveFamilyOfficeScope,
} from '@/lib/family-office-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/mdff-report
 *
 * Genera informe en formato MdF Family Partners (MDFF):
 *
 * Estructura del informe (basado en reporting real MDFF):
 * 1. DATOS GENERALES — custodios, mandatos, benchmarks, tipos de cambio
 * 2. EVOLUCIÓN PATRIMONIAL — AF, PE, Renta, Personal, Estratégicos
 * 3. RESUMEN PATRIMONIAL — histórico con aportaciones/retiradas/beneficios
 * 4. POSICIÓN POR CUSTODIO — desglose por entidad con asset allocation
 * 5. CARTERA POR TIPO DE ACTIVO — % vs objetivo + evolución mensual
 * 6. INFORME DE RENTABILIDADES — YTD + desde inicio + por cartera + benchmarks
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      // Try API key auth for MDFF access
      const apiKey = request.headers.get('x-mdff-api-key');
      if (!apiKey || apiKey !== process.env.MDFF_API_KEY) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }
    }

    const scope = session?.user?.companyId
      ? await resolveFamilyOfficeScope(request, {
          id: session.user.id,
          role: session.user.role,
          companyId: session.user.companyId,
        })
      : null;
    const companyId = scope?.rootCompanyId || request.headers.get('x-company-id') || '';
    const groupIds = scope?.groupCompanyIds || [companyId];
    const today = new Date();
    const reportDate = format(today, 'dd MMMM yyyy', { locale: es });
    const reportMonth = format(today, 'MMMM yyyy', { locale: es });

    // ═══════════════════════════════════════════════════
    // 1. DATOS GENERALES
    // ═══════════════════════════════════════════════════

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nombre: true, cif: true, contactoPrincipal: true, emailContacto: true },
    });

    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: groupIds }, activa: true },
      include: {
        positions: { orderBy: { valorActual: 'desc' } },
        transactions: { orderBy: { fecha: 'desc' }, take: 50 },
      },
    });

    const participations = await prisma.participation.findMany({
      where: { companyId: { in: groupIds }, activa: true },
    });

    // Grupo inmobiliario
    const children = await prisma.company.findMany({
      where: { parentCompanyId: companyId },
      select: { id: true, nombre: true },
    });

    const units = await prisma.unit.findMany({
      where: { building: { companyId: { in: groupIds }, isDemo: false } },
      select: {
        estado: true,
        rentaMensual: true,
        valorMercado: true,
        precioCompra: true,
        tipo: true,
      },
    });

    const datosGenerales = {
      cliente: company?.nombre || 'N/A',
      cif: company?.cif || 'N/A',
      fechaInforme: reportDate,
      periodo: `31 ${reportMonth}`,
      depositarios: accounts.map((a) => `${a.entidad} (${a.divisa})`),
      tipoMandato: 'Consultoría externa',
      divisaReferencia: 'EUR',
      responsable: company?.contactoPrincipal || 'Gestor asignado',
      email: company?.emailContacto || '',
      tiposCambio: {
        'EUR-CHF': 0.9163,
        'EUR-GBP': 0.8662,
        'EUR-USD': 1.1851,
        'EUR-JPY': 183.43,
      },
      benchmarks: [
        { codigo: 'EACPI', nombre: 'Inflación Eurozona' },
        { codigo: 'DBDCONIA', nombre: 'Mercado Monetario EUR' },
        { codigo: 'BERPG2', nombre: 'Euro Govt 3-5Yr' },
        { codigo: 'M7EU', nombre: 'MSCI Europe Net TR EUR' },
        { codigo: 'MSDEEEMN', nombre: 'MSCI Emerging Markets Net TR EUR' },
        { codigo: 'MSDEWIN', nombre: 'MSCI World Net TR EUR' },
      ],
    };

    // ═══════════════════════════════════════════════════
    // 2. EVOLUCIÓN PATRIMONIAL
    // ═══════════════════════════════════════════════════

    const valorAF = accounts.reduce(
      (s, a) => s + a.positions.reduce((ps, p) => ps + p.valorActual, 0),
      0
    );
    const saldoCuentas = accounts.reduce((s, a) => s + getAccountLiquidBalance(a), 0);
    const valorPE = participations.reduce(
      (s, p) => s + (p.valoracionActual || p.valorEstimado || p.valorContable || 0),
      0
    );
    const desembolsosPendientesPE = participations.reduce(
      (s, p) => s + ((p.compromisoTotal || 0) - (p.capitalLlamado || p.costeAdquisicion)),
      0
    );
    const valorInmob = units.reduce((s, u) => s + (u.valorMercado || u.precioCompra || 0), 0);
    const rentaAnual =
      units.filter((u) => u.estado === 'ocupada').reduce((s, u) => s + u.rentaMensual, 0) * 12;

    const evolucionPatrimonial = {
      activosFinancieros: {
        patrimonio: Math.round(valorAF + saldoCuentas),
        desembolsosPendientes: 0,
      },
      activosEnCrecimiento: {
        patrimonio: Math.round(valorPE),
        desembolsosPendientes: Math.round(Math.max(0, desembolsosPendientesPE)),
      },
      activosEnRenta: { patrimonio: Math.round(valorInmob), desembolsosPendientes: 0 },
      activosPersonales: { patrimonio: 0, desembolsosPendientes: 0 },
      activosEstrategicos: { patrimonio: 0, desembolsosPendientes: 0 },
      totalEUR: Math.round(valorAF + saldoCuentas + valorPE + valorInmob),
    };

    // ═══════════════════════════════════════════════════
    // 3. POSICIÓN POR CUSTODIO (formato MDFF exacto)
    // ═══════════════════════════════════════════════════

    const posicionPorCustodio = accounts.map((account) => {
      const positions = account.positions;
      const valorTotal = positions.reduce((s, p) => s + p.valorActual, 0) + account.saldoActual;

      // Clasificar por tipo de activo (formato MDFF)
      const byCategory: Record<string, { valor: number; pct: number }> = {};
      const categories = [
        'Mercado monetario',
        'Renta fija',
        'Renta variable',
        'Commodities',
        'Alternativos',
      ];

      for (const pos of positions) {
        let cat = 'Alternativos';
        const tipo = (pos.tipo || '').toLowerCase();
        const categoria = (pos.categoria || '').toLowerCase();

        if (tipo.includes('deposito') || tipo.includes('cuenta') || categoria.includes('monetar')) {
          cat = 'Mercado monetario';
        } else if (
          tipo.includes('bono') ||
          categoria.includes('fija') ||
          categoria.includes('gobierno') ||
          categoria.includes('corporat')
        ) {
          cat = 'Renta fija';
        } else if (
          tipo.includes('accion') ||
          tipo.includes('etf') ||
          categoria.includes('variable') ||
          categoria.includes('equity')
        ) {
          cat = 'Renta variable';
        } else if (
          categoria.includes('commodity') ||
          categoria.includes('metal') ||
          categoria.includes('energ')
        ) {
          cat = 'Commodities';
        }

        if (!byCategory[cat]) byCategory[cat] = { valor: 0, pct: 0 };
        byCategory[cat].valor += pos.valorActual;
      }

      // Añadir saldo cuenta como monetario
      if (account.saldoActual > 0) {
        if (!byCategory['Mercado monetario'])
          byCategory['Mercado monetario'] = { valor: 0, pct: 0 };
        byCategory['Mercado monetario'].valor += account.saldoActual;
      }

      // Calcular porcentajes
      for (const cat of categories) {
        if (byCategory[cat]) {
          byCategory[cat].pct =
            valorTotal > 0 ? Math.round((byCategory[cat].valor / valorTotal) * 10000) / 100 : 0;
          byCategory[cat].valor = Math.round(byCategory[cat].valor);
        }
      }

      // P&L del periodo
      const pnl = positions.reduce((s, p) => s + p.pnlNoRealizado + p.pnlRealizado, 0);
      const coste = positions.reduce((s, p) => s + p.costeTotal, 0);
      const rentabilidad = coste > 0 ? Math.round((pnl / coste) * 10000) / 100 : 0;

      return {
        custodio: account.entidad,
        alias: account.alias || account.entidad,
        divisa: account.divisa,
        patrimonio: Math.round(valorTotal),
        distribucion: byCategory,
        beneficioNeto: Math.round(pnl),
        rentabilidad,
        posiciones: positions.length,
        ultimaSync: account.ultimaSync,
      };
    });

    // ═══════════════════════════════════════════════════
    // 4. CARTERA POR TIPO DE ACTIVO (consolidado + vs objetivo)
    // ═══════════════════════════════════════════════════

    const allPositions = accounts.flatMap((a) => a.positions);
    const valorTotalCartera = allPositions.reduce((s, p) => s + p.valorActual, 0) + saldoCuentas;

    // Objetivos de asset allocation (configurables)
    const objetivos: Record<string, number> = {
      'Mercado monetario': 12,
      'Renta fija': 43,
      'Renta variable': 45,
      Commodities: 0,
      Alternativos: 0,
    };

    const carteraPorTipo: Array<{
      activo: string;
      pctPatrimonio: number;
      valorActual: number;
      objetivo: number;
      diferencia: number;
    }> = [];

    const consolidado: Record<string, number> = {};
    for (const custodio of posicionPorCustodio) {
      for (const [cat, data] of Object.entries(custodio.distribucion)) {
        consolidado[cat] = (consolidado[cat] || 0) + data.valor;
      }
    }

    for (const [cat, valor] of Object.entries(consolidado)) {
      const pct = valorTotalCartera > 0 ? Math.round((valor / valorTotalCartera) * 10000) / 100 : 0;
      const obj = objetivos[cat] || 0;
      carteraPorTipo.push({
        activo: cat,
        pctPatrimonio: pct,
        valorActual: valor,
        objetivo: obj,
        diferencia: Math.round((pct - obj) * 100) / 100,
      });
    }

    // ═══════════════════════════════════════════════════
    // 5. INFORME DE RENTABILIDADES
    // ═══════════════════════════════════════════════════

    const rentabilidades = {
      ytd: posicionPorCustodio.map((c) => ({
        cartera: c.custodio,
        rentabilidad: c.rentabilidad,
      })),
      benchmarks: datosGenerales.benchmarks.map((b) => ({
        codigo: b.codigo,
        nombre: b.nombre,
        ytd: 0, // Requiere datos de mercado
      })),
    };

    // ═══════════════════════════════════════════════════
    // 6. ACTIVOS EN RENTA (inmobiliario - formato MDFF)
    // ═══════════════════════════════════════════════════

    const activosRenta = {
      patrimonio: Math.round(valorInmob),
      rentaAnual: Math.round(rentaAnual),
      sociedades: children.map((c) => c.nombre),
      unidadesTotales: units.length,
      ocupadas: units.filter((u) => u.estado === 'ocupada').length,
      ocupacion:
        units.length > 0
          ? Math.round((units.filter((u) => u.estado === 'ocupada').length / units.length) * 1000) /
            10
          : 0,
      desglosePorTipo: (() => {
        const byTipo: Record<string, { count: number; valor: number; renta: number }> = {};
        for (const u of units) {
          const tipo = u.tipo || 'otro';
          if (!byTipo[tipo]) byTipo[tipo] = { count: 0, valor: 0, renta: 0 };
          byTipo[tipo].count++;
          byTipo[tipo].valor += u.valorMercado || u.precioCompra || 0;
          if (u.estado === 'ocupada') byTipo[tipo].renta += u.rentaMensual * 12;
        }
        return Object.entries(byTipo).map(([tipo, data]) => ({
          tipo,
          unidades: data.count,
          valor: Math.round(data.valor),
          rentaAnual: Math.round(data.renta),
        }));
      })(),
    };

    // ═══════════════════════════════════════════════════
    // 7. ACTIVOS EN CRECIMIENTO (PE - formato MDFF)
    // ═══════════════════════════════════════════════════

    const activosCrecimiento = {
      patrimonio: Math.round(valorPE),
      desembolsosPendientes: Math.round(Math.max(0, desembolsosPendientesPE)),
      participaciones: participations.map((p) => ({
        sociedad: p.targetCompanyName,
        tipo: normalizeInvestmentVehicleName(p.vehiculoInversor || p.tipo),
        porcentaje: p.porcentaje,
        coste: Math.round(p.costeAdquisicion),
        valorActual: Math.round(p.valoracionActual || p.valorEstimado || p.valorContable || 0),
        pnl: Math.round(
          (p.valoracionActual || p.valorEstimado || p.valorContable || 0) - p.costeAdquisicion
        ),
      })),
    };

    // ═══════════════════════════════════════════════════
    // 8. RESUMEN PATRIMONIAL HISTÓRICO (año a año)
    // Como en el PDF: 2022→2026 con aportaciones/retiradas/beneficios
    // ═══════════════════════════════════════════════════

    const currentYear = today.getFullYear();
    const resumenHistorico = [];
    for (let year = currentYear - 3; year <= currentYear; year++) {
      // Transacciones del año
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);

      const yearTxs = await prisma.financialTransaction.findMany({
        where: {
          account: { companyId },
          fecha: { gte: yearStart, lte: yearEnd },
        },
        select: { tipo: true, importe: true },
      });

      const aportaciones = yearTxs
        .filter((t) => ['aportacion', 'transferencia_entrada', 'capital_call'].includes(t.tipo))
        .reduce((s, t) => s + Math.abs(t.importe), 0);
      const retiradas = yearTxs
        .filter((t) => ['reembolso', 'transferencia_salida', 'distribucion'].includes(t.tipo))
        .reduce((s, t) => s + Math.abs(t.importe), 0);
      const beneficios = yearTxs
        .filter((t) => ['dividendo', 'cupon', 'interes'].includes(t.tipo))
        .reduce((s, t) => s + t.importe, 0);

      resumenHistorico.push({
        ano: year,
        aportacionesRetiradas: Math.round(aportaciones - retiradas),
        beneficios: Math.round(beneficios),
        patrimonio: year === currentYear ? evolucionPatrimonial.totalEUR : null,
      });
    }

    // ═══════════════════════════════════════════════════
    // 9. EVOLUCIÓN MENSUAL ASSET ALLOCATION (13 meses)
    // Como en el PDF: ene-25, feb-25, ..., ene-26
    // ═══════════════════════════════════════════════════

    const evolucionMensual = [];
    for (let i = 12; i >= 0; i--) {
      const month = subMonths(today, i);
      evolucionMensual.push({
        mes: format(month, 'MMM yy', { locale: es }),
        mesISO: format(month, 'yyyy-MM'),
        // Estimación basada en distribución actual (en producción: datos históricos reales)
        mercadoMonetario:
          carteraPorTipo.find((c) => c.activo === 'Mercado monetario')?.pctPatrimonio || 0,
        rentaFija: carteraPorTipo.find((c) => c.activo === 'Renta fija')?.pctPatrimonio || 0,
        rentaVariable:
          carteraPorTipo.find((c) => c.activo === 'Renta variable')?.pctPatrimonio || 0,
        commodities: carteraPorTipo.find((c) => c.activo === 'Commodities')?.pctPatrimonio || 0,
        alternativos: carteraPorTipo.find((c) => c.activo === 'Alternativos')?.pctPatrimonio || 0,
      });
    }

    // ═══════════════════════════════════════════════════
    // 10. DESVIACIONES VS OBJETIVOS
    // ═══════════════════════════════════════════════════

    const desviaciones = carteraPorTipo
      .filter((c) => c.objetivo > 0 || c.pctPatrimonio > 2)
      .map((c) => ({
        activo: c.activo,
        actual: c.pctPatrimonio,
        objetivo: c.objetivo,
        desviacion: c.diferencia,
        estado:
          Math.abs(c.diferencia) <= 2
            ? 'en_rango'
            : c.diferencia > 0
              ? 'sobreponderar'
              : 'infraponderar',
        accion:
          Math.abs(c.diferencia) > 5
            ? `Rebalancear: ${c.diferencia > 0 ? 'reducir' : 'aumentar'} ${Math.abs(c.diferencia).toFixed(1)}pp`
            : 'Dentro de rango',
      }));

    // ═══════════════════════════════════════════════════
    // 11. INTEGRACIÓN INMOBILIARIA EN INFORME
    // Cruce patrimonio financiero ↔ inmobiliario
    // ═══════════════════════════════════════════════════

    const yieldInmobiliario =
      valorInmob > 0 ? Math.round((rentaAnual / valorInmob) * 1000) / 10 : 0;
    const pesoInmobEnTotal =
      evolucionPatrimonial.totalEUR > 0
        ? Math.round((valorInmob / evolucionPatrimonial.totalEUR) * 1000) / 10
        : 0;
    const pesoFinEnTotal =
      evolucionPatrimonial.totalEUR > 0
        ? Math.round(((valorAF + saldoCuentas) / evolucionPatrimonial.totalEUR) * 1000) / 10
        : 0;

    const visionConsolidada = {
      patrimonioTotal: evolucionPatrimonial.totalEUR,
      inmobiliario: {
        valor: Math.round(valorInmob),
        peso: pesoInmobEnTotal,
        rentaAnual: Math.round(rentaAnual),
        yield: yieldInmobiliario,
        sociedades: children.map((c) => c.nombre),
      },
      financiero: {
        valor: Math.round(valorAF + saldoCuentas),
        peso: pesoFinEnTotal,
        custodios: posicionPorCustodio.map((c) => c.custodio),
        pnl: Math.round(
          accounts.reduce(
            (s, a) => s + a.positions.reduce((ps, p) => ps + p.pnlNoRealizado + p.pnlRealizado, 0),
            0
          )
        ),
      },
      recomendacionDiversificacion:
        pesoInmobEnTotal > 60
          ? `⚠️ Concentración inmobiliaria ${pesoInmobEnTotal}%. Recomendable diversificar hacia activos financieros.`
          : pesoFinEnTotal > 70
            ? `⚠️ Concentración financiera ${pesoFinEnTotal}%. El inmobiliario aporta estabilidad.`
            : `✅ Diversificación adecuada: ${pesoInmobEnTotal}% inmobiliario / ${pesoFinEnTotal}% financiero.`,
    };

    // ═══════════════════════════════════════════════════
    // INFORME COMPLETO formato MDFF v3
    // ═══════════════════════════════════════════════════

    const informe = {
      formato: 'MDFF_v3',
      generado: today.toISOString(),
      generadoPor: 'INMOVA Family Office',

      portada: {
        titulo: 'Informe mensual',
        cliente: company?.nombre || 'N/A',
        fecha: `31 ${reportMonth}`,
      },

      datosGenerales,

      indice: [
        '1. Resumen patrimonial',
        '2. Activos financieros',
        '3. Activos en crecimiento',
        '4. Activos en renta',
        '5. Anexos',
      ],

      evolucionPatrimonial,

      activosFinancieros: {
        posicionPorCustodio,
        carteraPorTipo,
        patrimonioTotal: Math.round(valorAF + saldoCuentas),
      },

      rentabilidades,

      activosCrecimiento,
      activosRenta,

      // Nuevas secciones v3 (basadas en análisis PDF real MdF)
      resumenHistorico,
      evolucionMensualAllocation: evolucionMensual,
      desviacionesVsObjetivos: desviaciones,
      visionConsolidada,

      resumen: {
        patrimonioTotal: evolucionPatrimonial.totalEUR,
        af: evolucionPatrimonial.activosFinancieros.patrimonio,
        pe: evolucionPatrimonial.activosEnCrecimiento.patrimonio,
        renta: evolucionPatrimonial.activosEnRenta.patrimonio,
      },
    };

    return NextResponse.json(informe);
  } catch (error: any) {
    logger.error('[MDFF Report]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error generando informe MDFF' }, { status: 500 });
  }
}
