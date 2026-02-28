import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/mdff-export
 * API segura para que el Multi-Family Office (MDFF) acceda a datos consolidados.
 * Requiere API key específica o sesión autenticada.
 * Formato estandarizado para reporting MFO.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    // Auth: sesión o API key
    const apiKey = request.headers.get('x-mdff-api-key');
    const expectedKey = process.env.MDFF_API_KEY;

    let companyId: string | null = null;

    if (apiKey && expectedKey && apiKey === expectedKey) {
      // API key válida — usar companyId del header
      companyId = request.headers.get('x-company-id') || null;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?.companyId) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }
      companyId = session.user.companyId;
    }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    // Recopilar datos para MDFF
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nombre: true, cif: true },
    });

    const groupIds = [companyId];
    const children = await prisma.company.findMany({
      where: { parentCompanyId: companyId },
      select: { id: true, nombre: true, cif: true },
    });
    children.forEach((c) => groupIds.push(c.id));

    // Inmobiliario
    const units = await prisma.unit.findMany({
      where: { building: { companyId: { in: groupIds }, isDemo: false } },
      select: { estado: true, rentaMensual: true, valorMercado: true, precioCompra: true, tipo: true },
    });

    // Financiero
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId, activa: true },
      include: { positions: { select: { nombre: true, isin: true, tipo: true, valorActual: true, pnlNoRealizado: true, divisa: true } } },
    });

    // PE
    const participations = await prisma.participation.findMany({
      where: { companyId, activa: true },
      select: { targetCompanyName: true, targetCompanyCIF: true, porcentaje: true, valorContable: true, valorEstimado: true, tipo: true },
    });

    const valorInmob = units.reduce((s, u) => s + (u.valorMercado || u.precioCompra || 0), 0);
    const rentaAnual = units.filter((u) => u.estado === 'ocupada').reduce((s, u) => s + u.rentaMensual, 0) * 12;
    const valorFin = accounts.reduce((s, a) => s + a.positions.reduce((ps, p) => ps + p.valorActual, 0), 0);
    const saldos = accounts.reduce((s, a) => s + a.saldoActual, 0);
    const valorPE = participations.reduce((s, p) => s + (p.valorEstimado || p.valorContable), 0);
    const patrimonioTotal = valorInmob + valorFin + valorPE + saldos;

    // Formato MDFF estándar
    const mdffReport = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      provider: 'INMOVA',
      client: {
        name: company?.nombre || 'N/A',
        cif: company?.cif || 'N/A',
        subsidiaries: children.map((c) => ({ name: c.nombre, cif: c.cif })),
      },
      summary: {
        totalWealth: Math.round(patrimonioTotal),
        currency: 'EUR',
        assetAllocation: {
          realEstate: { value: Math.round(valorInmob), pct: patrimonioTotal > 0 ? Math.round((valorInmob / patrimonioTotal) * 1000) / 10 : 0 },
          financialAssets: { value: Math.round(valorFin), pct: patrimonioTotal > 0 ? Math.round((valorFin / patrimonioTotal) * 1000) / 10 : 0 },
          privateEquity: { value: Math.round(valorPE), pct: patrimonioTotal > 0 ? Math.round((valorPE / patrimonioTotal) * 1000) / 10 : 0 },
          cash: { value: Math.round(saldos), pct: patrimonioTotal > 0 ? Math.round((saldos / patrimonioTotal) * 1000) / 10 : 0 },
        },
      },
      realEstate: {
        totalUnits: units.length,
        occupied: units.filter((u) => u.estado === 'ocupada').length,
        annualRent: Math.round(rentaAnual),
        estimatedValue: Math.round(valorInmob),
      },
      financialAssets: {
        accounts: accounts.map((a) => ({
          entity: a.entidad,
          type: a.tipoEntidad,
          currency: a.divisa,
          cashBalance: Math.round(a.saldoActual),
          positions: a.positions.map((p) => ({
            name: p.nombre,
            isin: p.isin,
            type: p.tipo,
            value: Math.round(p.valorActual),
            pnl: Math.round(p.pnlNoRealizado),
            currency: p.divisa,
          })),
        })),
      },
      privateEquity: {
        holdings: participations.map((p) => ({
          name: p.targetCompanyName,
          cif: p.targetCompanyCIF,
          ownership: p.porcentaje,
          bookValue: Math.round(p.valorContable),
          estimatedValue: Math.round(p.valorEstimado || p.valorContable),
          type: p.tipo,
        })),
      },
    };

    return NextResponse.json(mdffReport);
  } catch (error: any) {
    logger.error('[MDFF Export]:', error);
    return NextResponse.json({ error: 'Error en export MDFF' }, { status: 500 });
  }
}
