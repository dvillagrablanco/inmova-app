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

    const round2 = (n: number) => Math.round(n * 100) / 100;

    // --- 1. INMOBILIARIO ---
    const buildings = await prisma.building.findMany({
      where: { companyId: { in: scopeIds } },
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
            valorActual: true,
            costeTotal: true,
            pnlNoRealizado: true,
            pnlRealizado: true,
            tipo: true,
          },
        },
      },
    });

    // --- DEDUPLICATION: Count each ISIN only once (max value across all accounts) ---
    // Same fund can appear in multiple custodians (CACEIS, Inversis, Pictet, etc.)
    // but represents the SAME holding. We take the highest value for each ISIN.
    const isinMaxValue: Record<string, { valor: number; nombre: string }> = {};
    let noIsinTotal = 0;

    for (const acc of accounts) {
      for (const pos of acc.positions) {
        const val = pos.valorActual || 0;
        if (pos.isin) {
          const current = isinMaxValue[pos.isin];
          if (!current || val > current.valor) {
            isinMaxValue[pos.isin] = { valor: val, nombre: pos.nombre || '' };
          }
        } else {
          // No ISIN = unique position (PE commitments, private positions)
          noIsinTotal += val;
        }
      }
    }

    const isinDedupTotal = Object.values(isinMaxValue).reduce((s, p) => s + p.valor, 0);
    const valorFinancieroBruto = accounts.reduce((s: number, a: any) =>
      s + a.positions.reduce((s2: number, p: any) => s2 + (p.valorActual || 0), 0), 0);
    const valorFinanciero = isinDedupTotal + noIsinTotal;
    const valorFinancieroEliminado = valorFinancieroBruto - valorFinanciero;

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

    // --- 3. PRIVATE EQUITY / PARTICIPACIONES ---
    const allParticipations = await prisma.participation.findMany({
      where: { companyId: { in: scopeIds }, activa: true },
    });

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
      },
    });
  } catch (error: any) {
    logger.error('[Family Office Dashboard]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error generando dashboard' }, { status: 500 });
  }
}
