export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { normalizeInvestmentVehicleName } from '@/lib/family-office-scope';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/inversiones/grupo?pl=true
 * Estructura del grupo empresarial con KPIs por sociedad.
 * Con ?pl=true incluye P&L (ingresos, gastos, beneficio, ROE) por sociedad.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const companyId = session.user.companyId;

    // Get holding + children
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        childCompanies: { where: { activo: true } },
        parentCompany: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Determine the holding (if this company has a parent, go up)
    const holdingId = company.parentCompanyId || company.id;
    const holding = company.parentCompanyId
      ? await prisma.company.findUnique({
          where: { id: holdingId },
          include: { childCompanies: { where: { activo: true } } },
        })
      : company;

    if (!holding) {
      return NextResponse.json({ companies: [] });
    }

    const allIds = [holding.id, ...holding.childCompanies.map((c: { id: string }) => c.id)];
    const includePl = request.nextUrl.searchParams.get('pl') === 'true';

    const { getCompanyPortfolio } = await import('@/lib/investment-service');
    const holdingParticipations = await prisma.participation.findMany({
      where: { companyId: holding.id, activa: true },
      select: { vehiculoInversor: true },
    });

    const results = [];
    for (const cid of allIds) {
      const co = cid === holding.id ? holding : holding.childCompanies.find((c: { id: string }) => c.id === cid);
      if (!co) continue;

      const [edificios, unidades, inquilinos, participaciones, cuentas, posiciones] = await Promise.all([
        prisma.building.count({ where: { companyId: cid } }),
        prisma.unit.count({ where: { building: { companyId: cid } } }),
        prisma.tenant.count({ where: { companyId: cid } }),
        Promise.resolve(
          (co as { nombre: string }).nombre.toUpperCase().includes('VIBLA')
            ? holdingParticipations.filter(
                (participation) =>
                  normalizeInvestmentVehicleName(participation.vehiculoInversor) === 'VIBLA_SCR'
              ).length
            : 0
        ),
        prisma.financialAccount.count({ where: { companyId: cid, activa: true } }),
        prisma.financialPosition.count({
          where: { account: { companyId: cid } },
        }),
      ]);

      const base: Record<string, unknown> = {
        id: cid,
        nombre: (co as { nombre: string }).nombre,
        parent: cid === holding.id ? null : holding.id,
        stats: {
          edificios,
          unidades,
          inquilinos,
          participaciones,
          cuentasBancarias: cuentas,
          posicionesFinancieras: posiciones,
        },
      };

      if (includePl) {
        try {
          const portfolio = await getCompanyPortfolio(cid, false);
          const ingresos = (portfolio.totalMonthlyIncome || 0) * 12;
          const gastos = (portfolio.totalMonthlyExpenses || 0) * 12;
          const beneficio = ingresos - gastos;
          const roe = portfolio.totalEquity && portfolio.totalEquity > 0
            ? (beneficio / portfolio.totalEquity) * 100
            : null;
          (base as any).pl = {
            ingresos,
            gastos,
            beneficio,
            roe,
            totalEquity: portfolio.totalEquity,
          };
        } catch {
          (base as any).pl = { ingresos: 0, gastos: 0, beneficio: 0, roe: null, totalEquity: 0 };
        }
      }

      results.push(base);
    }

    return NextResponse.json({ companies: results });
  } catch (error: unknown) {
    console.error('[API /inversiones/grupo]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
