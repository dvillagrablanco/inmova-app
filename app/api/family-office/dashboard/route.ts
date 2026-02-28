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
 * GET /api/family-office/dashboard
 * Consolidated view of all patrimonio: inmobiliario + financiero + private equity.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const prisma = await getPrisma();

    // Obtener empresa + filiales para vista consolidada
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { childCompanies: { select: { id: true } } },
    });
    const allCompanyIds = company
      ? [company.id, ...company.childCompanies.map((c: any) => c.id)]
      : [companyId];

    // --- 1. INMOBILIARIO (holding + filiales) ---
    const buildings = await prisma.building.findMany({
      where: { companyId: { in: allCompanyIds }, isDemo: false },
      include: {
        units: {
          select: {
            id: true,
            estado: true,
            valorMercado: true,
            rentaMensual: true,
            contracts: {
              where: { estado: 'activo' },
              select: { rentaMensual: true },
              take: 1,
            },
          },
        },
      },
    });

    let valorInmobiliario = 0;
    let rentaMensualTotal = 0;
    const edificios = buildings.map((b: any) => {
      const valorEdificio = b.units.reduce((sum: number, u: any) => sum + (u.valorMercado || 0), 0);
      const rentaEdificio = b.units.reduce((sum: number, u: any) => {
        const contractRenta = u.contracts?.[0]?.rentaMensual;
        return sum + (contractRenta || u.rentaMensual || 0);
      }, 0);

      valorInmobiliario += valorEdificio;
      rentaMensualTotal += rentaEdificio;

      return {
        id: b.id,
        nombre: b.nombre,
        direccion: b.direccion,
        unidades: b.units.length,
        ocupadas: b.units.filter((u: any) => u.estado === 'ocupada').length,
        valor: Math.round(valorEdificio * 100) / 100,
        renta: Math.round(rentaEdificio * 100) / 100,
      };
    });

    // --- 2. FINANCIERO (holding + filiales) ---
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: allCompanyIds }, activa: true },
      include: {
        positions: {
          select: {
            valorActual: true,
            costeTotal: true,
            pnlNoRealizado: true,
            pnlRealizado: true,
            tipo: true,
          },
        },
      },
    });

    let valorFinanciero = 0;
    let pnlFinanciero = 0;
    let tesoreriaTotal = 0;

    const tesoreriaPorEntidad: Record<string, number> = {};
    const cuentas = accounts.map((acc: any) => {
      const valorCuenta = acc.positions.reduce(
        (sum: number, p: any) => sum + (p.valorActual || 0),
        0
      );
      const pnlCuenta = acc.positions.reduce(
        (sum: number, p: any) => sum + (p.pnlNoRealizado || 0) + (p.pnlRealizado || 0),
        0
      );

      valorFinanciero += valorCuenta;
      pnlFinanciero += pnlCuenta;

      // Cash: saldoActual represents available cash in the account
      tesoreriaTotal += acc.saldoActual || 0;
      tesoreriaPorEntidad[acc.entidad] =
        (tesoreriaPorEntidad[acc.entidad] || 0) + (acc.saldoActual || 0);

      return {
        id: acc.id,
        entidad: acc.entidad,
        alias: acc.alias,
        divisa: acc.divisa,
        valor: Math.round(valorCuenta * 100) / 100,
        pnl: Math.round(pnlCuenta * 100) / 100,
        saldo: acc.saldoActual || 0,
        posiciones: acc.positions.length,
      };
    });

    // --- 3. PRIVATE EQUITY / PARTICIPACIONES (holding + filiales) ---
    const participations = await prisma.participation.findMany({
      where: { companyId: { in: allCompanyIds }, activa: true },
    });

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
        valor: Math.round(valor * 100) / 100,
        coste: p.costeAdquisicion,
      };
    });

    // --- CONSOLIDATION ---
    const patrimonioTotal = valorInmobiliario + valorFinanciero + valorPE + tesoreriaTotal;
    const totalForAllocation = patrimonioTotal || 1; // avoid division by zero

    const round2 = (n: number) => Math.round(n * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        inmobiliario: {
          valor: round2(valorInmobiliario),
          renta: round2(rentaMensualTotal),
          rentaAnual: round2(rentaMensualTotal * 12),
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
      },
    });
  } catch (error: any) {
    logger.error('[Family Office Dashboard]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error generando dashboard' }, { status: 500 });
  }
}
