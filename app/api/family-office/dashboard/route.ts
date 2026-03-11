import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/dashboard?view=holding|consolidated
 *
 * Vista Holding (default): Solo activos directos del holding. Filiales aparecen como PE.
 * Vista Consolidado: Suma activos de todo el grupo, elimina participaciones intragrupo.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryCompanyId = searchParams.get('companyId');
    const view = (searchParams.get('view') || 'holding') as 'holding' | 'consolidated';
    const companyId = (session.user.role === 'super_admin' && queryCompanyId)
      ? queryCompanyId
      : session.user.companyId;
    const prisma = await getPrisma();

    // Obtener empresa + filiales
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { childCompanies: { select: { id: true, nombre: true, cif: true } } },
    });

    const childIds = company?.childCompanies?.map((c: any) => c.id) || [];
    const childCIFs = company?.childCompanies?.map((c: any) => c.cif).filter(Boolean) || [];
    const allCompanyIds = company ? [company.id, ...childIds] : [companyId];

    // Scope: holding = solo empresa raíz, consolidated = empresa + filiales
    const scopeIds = view === 'holding' ? [companyId] : allCompanyIds;

    // Inmobiliario siempre incluye filiales — los edificios en SPVs (Rovida, Viroda)
    // son activos del holding gestionados a través de sociedades vehículo
    const inmobScopeIds = allCompanyIds;

    const round2 = (n: number) => Math.round(n * 100) / 100;

    // --- 1. INMOBILIARIO ---
    const buildings = await prisma.building.findMany({
      where: { companyId: { in: inmobScopeIds } },
      include: {
        units: {
          select: {
            id: true,
            estado: true,
            valorMercado: true,
            precioCompra: true,
            rentaMensual: true,
            contracts: {
              where: { estado: 'activo' },
              select: { rentaMensual: true },
              take: 1,
            },
          },
        },
        company: { select: { nombre: true } },
      },
    });

    let valorInmobLibros = 0; // Valor en libros (precio escritura)
    let valorInmobMercado = 0; // Valor de mercado estimado
    let rentaMensualTotal = 0;
    const edificios = buildings.map((b: any) => {
      let valorLibrosEdificio = 0;
      let valorMercadoEdificio = 0;
      const rentaEdificio = b.units.reduce((sum: number, u: any) => {
        const contractRenta = u.contracts?.[0]?.rentaMensual;
        return sum + (contractRenta || u.rentaMensual || 0);
      }, 0);

      for (const u of b.units) {
        valorLibrosEdificio += u.precioCompra || 0;
        // Solo usar valorMercado real — no estimar con renta para evitar inflar
        valorMercadoEdificio += u.valorMercado || 0;
      }

      valorInmobLibros += valorLibrosEdificio;
      valorInmobMercado += valorMercadoEdificio;
      rentaMensualTotal += rentaEdificio;

      return {
        id: b.id,
        nombre: b.nombre,
        direccion: b.direccion,
        sociedad: b.company?.nombre || '',
        unidades: b.units.length,
        ocupadas: b.units.filter((u: any) => u.estado === 'ocupada').length,
        valorLibros: round2(valorLibrosEdificio),
        valorMercado: round2(valorMercadoEdificio),
        renta: round2(rentaEdificio),
      };
    });

    // Use market value for patrimonio (or book value if no market data)
    const valorInmobiliario = valorInmobMercado > 0 ? valorInmobMercado : valorInmobLibros;

    // --- 2. FINANCIERO ---
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: scopeIds }, activa: true },
      include: {
        positions: {
          select: {
            nombre: true,
            isin: true,
            valorActual: true,
            costeTotal: true,
            pnlNoRealizado: true,
            pnlRealizado: true,
            tipo: true,
          },
        },
      },
    });

    // --- 3 (pre-load). PE for cross-check ---
    const allParticipationsPreload = await prisma.participation.findMany({
      where: { companyId: { in: scopeIds }, activa: true },
    });
    const peNamesForDedup = new Set(
      allParticipationsPreload
        .filter((pp: any) => (pp.valorEstimado || pp.valorContable || pp.costeAdquisicion || 0) > 0)
        .flatMap((pp: any) => {
          const name = (pp.targetCompanyName || '').toUpperCase();
          // Extract meaningful keywords for matching
          return name.split(/[\s,]+/).filter((w: string) => w.length >= 5);
        })
    );

    // --- DEDUPLICATION: Count each ISIN only once (max value across all accounts) ---
    // Also: extract ISIN from position name when isin field is null
    // Also: exclude positions that match PE participations (already counted in PE)
    const isinMaxValue: Record<string, { valor: number; nombre: string }> = {};
    let noIsinTotal = 0;
    let peDuplicadoExcluido = 0;
    let isinFromNameExcluido = 0;

    // Collect all ISINs from positions with isin field for cross-ref
    const knownIsins = new Set<string>();
    for (const acc of accounts) {
      for (const pos of acc.positions) {
        if (pos.isin) knownIsins.add(pos.isin);
      }
    }

    for (const acc of accounts) {
      for (const pos of acc.positions) {
        const val = pos.valorActual || 0;
        const posName = (pos.nombre || '').toUpperCase();

        if (pos.isin) {
          // Has ISIN field: standard dedup
          const current = isinMaxValue[pos.isin];
          if (!current || val > current.valor) {
            isinMaxValue[pos.isin] = { valor: val, nombre: pos.nombre || '' };
          }
        } else {
          // No ISIN field — check if ISIN is embedded in the name
          const isinMatch = (pos.nombre || '').match(/\b([A-Z]{2}[A-Z0-9]{9,10})\b/);
          const embeddedIsin = isinMatch ? isinMatch[1] : null;

          if (embeddedIsin && knownIsins.has(embeddedIsin)) {
            // This position's ISIN exists in another account → already deduped, skip
            isinFromNameExcluido += val;
          } else if (embeddedIsin) {
            // New ISIN found in name
            const current = isinMaxValue[embeddedIsin];
            if (!current || val > current.valor) {
              isinMaxValue[embeddedIsin] = { valor: val, nombre: pos.nombre || '' };
            }
          } else {
            // No ISIN at all — check if it's a PE duplicate
            const isPE = Array.from(peNamesForDedup).some((keyword: string) =>
              posName.includes(keyword)
            );
            if (isPE) {
              peDuplicadoExcluido += val;
            } else {
              noIsinTotal += val;
            }
          }
        }
      }
    }

    const isinDedupTotal = Object.values(isinMaxValue).reduce((s, p) => s + p.valor, 0);
    const valorFinancieroBruto = accounts.reduce((s: number, a: any) =>
      s + a.positions.reduce((s2: number, p: any) => s2 + (p.valorActual || 0), 0), 0);
    const valorFinanciero = isinDedupTotal + noIsinTotal;
    const valorFinancieroEliminado = valorFinancieroBruto - valorFinanciero - peDuplicadoExcluido - isinFromNameExcluido;

    let pnlFinanciero = 0;
    let tesoreriaTotal = 0;
    const tesoreriaPorEntidad: Record<string, number> = {};

    const cuentas = accounts.map((acc: any) => {
      const valorCuenta = acc.positions.reduce(
        (sum: number, p: any) => sum + (p.valorActual || 0), 0
      );
      const pnlCuenta = acc.positions.reduce(
        (sum: number, p: any) => sum + (p.pnlNoRealizado || 0) + (p.pnlRealizado || 0), 0
      );
      pnlFinanciero += pnlCuenta;

      // Anti-duplicidad tesorería: Si saldoActual ≈ sum(posiciones) (±10%),
      // el saldo ES el NAV de las posiciones, no liquidez adicional.
      const saldo = acc.saldoActual || 0;
      const isNavDuplicate = valorCuenta > 1000 && saldo > 1000 &&
        Math.abs(saldo - valorCuenta) / valorCuenta < 0.10;

      const tesoreriaContable = isNavDuplicate ? 0 : saldo;
      tesoreriaTotal += tesoreriaContable;
      if (tesoreriaContable > 0) {
        tesoreriaPorEntidad[acc.entidad] =
          (tesoreriaPorEntidad[acc.entidad] || 0) + tesoreriaContable;
      }

      return {
        id: acc.id,
        entidad: acc.entidad,
        alias: acc.alias,
        divisa: acc.divisa,
        valor: round2(valorCuenta),
        pnl: round2(pnlCuenta),
        saldo: round2(saldo),
        tesoreriaContable: round2(tesoreriaContable),
        isNavDuplicate,
        posiciones: acc.positions.length,
      };
    });

    // --- 3. PRIVATE EQUITY / PARTICIPACIONES (pre-loaded above) ---
    const allParticipations = allParticipationsPreload;

    // En vista consolidada: excluir participaciones intragrupo (donde el CIF del target = CIF de filial)
    const participations = view === 'consolidated'
      ? allParticipations.filter((p: any) => {
          const targetCIF = p.targetCompanyCIF?.toUpperCase()?.replace(/[-\s]/g, '');
          if (!targetCIF) return true; // Sin CIF → mantener
          return !childCIFs.some((cif: string) =>
            cif?.toUpperCase()?.replace(/[-\s]/g, '') === targetCIF
          );
        })
      : allParticipations;

    const participacionesExcluidas = allParticipations.length - participations.length;

    let valorPE = 0;
    const participacionesData = participations.map((p: any) => {
      const valor = p.valorEstimado ?? p.valorContable ?? p.costeAdquisicion ?? 0;
      valorPE += valor;
      return {
        id: p.id,
        nombre: p.targetCompanyName,
        cif: p.targetCompanyCIF,
        tipo: p.tipo,
        porcentaje: p.porcentaje,
        valor: round2(valor),
        coste: p.costeAdquisicion,
        esIntragrupo: false,
      };
    });

    // --- CONSOLIDATION ---
    const patrimonioTotal = valorInmobiliario + valorFinanciero + valorPE + tesoreriaTotal;
    const totalForAllocation = patrimonioTotal || 1;

    return NextResponse.json({
      success: true,
      view,
      viewLabel: view === 'holding'
        ? `Vista Holding — ${company?.nombre || 'Empresa'}`
        : `Vista Grupo Consolidado — ${company?.nombre || 'Grupo'}`,
      viewDescription: view === 'holding'
        ? 'Solo activos directos del holding. Las filiales se reflejan como participaciones en Private Equity.'
        : `Activos consolidados del grupo (${allCompanyIds.length} sociedades). Se eliminan ${participacionesExcluidas} participaciones intragrupo para evitar doble conteo.`,
      data: {
        inmobiliario: {
          valor: round2(valorInmobiliario),
          valorLibros: round2(valorInmobLibros),
          valorMercado: round2(valorInmobMercado),
          revalorizacion: round2(valorInmobMercado - valorInmobLibros),
          revalorizacionPct: valorInmobLibros > 0 ? round2(((valorInmobMercado - valorInmobLibros) / valorInmobLibros) * 100) : 0,
          renta: round2(rentaMensualTotal),
          rentaAnual: round2(rentaMensualTotal * 12),
          yieldBrutoLibros: valorInmobLibros > 0 ? round2((rentaMensualTotal * 12 / valorInmobLibros) * 100) : 0,
          yieldBrutoMercado: valorInmobMercado > 0 ? round2((rentaMensualTotal * 12 / valorInmobMercado) * 100) : 0,
          edificios,
        },
        financiero: {
          valor: round2(valorFinanciero),
          pnl: round2(pnlFinanciero),
          cuentas,
        },
        privateEquity: {
          valor: round2(valorPE),
          participaciones: participacionesData,
          participacionesIntragrupoExcluidas: view === 'consolidated' ? participacionesExcluidas : 0,
          posicionesFinancierasDuplicadas: round2(valorFinancieroEliminado),
        },
        tesoreria: {
          saldo: round2(tesoreriaTotal),
          porEntidad: Object.entries(tesoreriaPorEntidad).map(([entidad, saldo]) => ({
            entidad,
            saldo: round2(saldo as number),
          })),
        },
        assetAllocation: {
          inmobiliario: round2((valorInmobiliario / totalForAllocation) * 100),
          financiero: round2((valorFinanciero / totalForAllocation) * 100),
          privateEquity: round2((valorPE / totalForAllocation) * 100),
          liquidez: round2((tesoreriaTotal / totalForAllocation) * 100),
        },
        patrimonio: {
          total: round2(patrimonioTotal),
        },
        sociedades: view === 'consolidated' ? allCompanyIds.length : 1,

        // --- G1-G9: Monthly snapshot data (if available) ---
        ...(await getSnapshotData(prisma, companyId)),
      },
    });
  } catch (error: any) {
    logger.error('[Family Office Dashboard]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error generando dashboard' }, { status: 500 });
  }
}

/**
 * Fetch monthly snapshot data for the dashboard enrichment (G1-G9).
 */
async function getSnapshotData(prisma: any, companyId: string) {
  try {
    const snapshots = await prisma.monthlySnapshot.findMany({
      where: { companyId },
      orderBy: { reportDate: 'asc' },
    });

    if (!snapshots || snapshots.length === 0) {
      return {};
    }

    // G1: Evolución patrimonial (agrupado por fecha)
    const byDate: Record<string, any> = {};
    for (const s of snapshots) {
      const dateKey = s.reportDate.toISOString().slice(0, 7); // YYYY-MM
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, total: 0, af: 0, pe: 0, ar: 0, amper: 0 };
      }
      byDate[dateKey].total += s.totalValue;
      if (s.portfolioCode === '1149.01') byDate[dateKey].af = s.totalValue;
      if (s.portfolioCode === '1149.02') byDate[dateKey].pe = s.totalValue;
      if (s.portfolioCode === '1149.03') byDate[dateKey].ar = s.totalValue;
      if (s.portfolioCode === '1142.09') byDate[dateKey].amper = s.totalValue;
    }
    const patrimonioEvolution = Object.values(byDate).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    // G2: Performance — latest AF snapshot
    const latestAF = snapshots
      .filter((s: any) => s.portfolioCode === '1149.01')
      .sort((a: any, b: any) => b.reportDate.getTime() - a.reportDate.getTime())[0];

    const performanceByYear = latestAF ? {
      return2023: latestAF.return2023,
      return2024: latestAF.return2024,
      return2025: latestAF.return2025,
      returnYtd: latestAF.returnYtd,
      sinceInception: latestAF.returnSinceInception,
      annualized: latestAF.annualizedReturn,
      volatility12m: latestAF.volatility12m,
      sharpeRatio: latestAF.sharpeRatio,
    } : null;

    // G3: Custodian breakdown
    const custodianBreakdown = latestAF?.custodianBreakdown || null;

    // G4: Asset allocation with targets
    const allocationVsTarget = latestAF ? (() => {
      const total = latestAF.totalValue || 1;
      return [
        {
          name: 'Mercado monetario', value: latestAF.monetario,
          weight: Math.round((latestAF.monetario / total) * 10000) / 100,
          target: latestAF.targetMonetario, deviation: null as number | null,
        },
        {
          name: 'Renta fija', value: latestAF.rentaFija,
          weight: Math.round((latestAF.rentaFija / total) * 10000) / 100,
          target: latestAF.targetRentaFija, deviation: null as number | null,
        },
        {
          name: 'Renta variable', value: latestAF.rentaVariable,
          weight: Math.round((latestAF.rentaVariable / total) * 10000) / 100,
          target: latestAF.targetRentaVariable, deviation: null as number | null,
        },
        {
          name: 'Commodities', value: latestAF.commodities,
          weight: Math.round((latestAF.commodities / total) * 10000) / 100,
          target: null, deviation: null as number | null,
        },
        {
          name: 'Alternativos', value: latestAF.alternativos,
          weight: Math.round((latestAF.alternativos / total) * 10000) / 100,
          target: null, deviation: null as number | null,
        },
      ].map(a => ({
        ...a,
        deviation: a.target != null ? Math.round((a.weight - a.target) * 100) / 100 : null,
      }));
    })() : null;

    // G7: Fees
    const feesSummary = latestAF ? {
      totalFees: latestAF.fees,
      breakdown: latestAF.feeBreakdown,
      reportDate: latestAF.reportDate,
    } : null;

    return {
      patrimonioEvolution,
      performanceByYear,
      custodianBreakdown,
      allocationVsTarget,
      feesSummary,
      snapshotCount: snapshots.length,
    };
  } catch (e) {
    logger.warn('[Dashboard Snapshots] Error loading snapshot data:', e);
    return {};
  }
}
