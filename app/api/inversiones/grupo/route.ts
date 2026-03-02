export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/inversiones/grupo
 * Estructura del grupo empresarial con KPIs por sociedad
 */
export async function GET() {
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

    // Get stats for each company
    const results = [];
    for (const cid of allIds) {
      const co = cid === holding.id ? holding : holding.childCompanies.find((c: { id: string }) => c.id === cid);
      if (!co) continue;

      const [edificios, unidades, inquilinos, participaciones, cuentas, posiciones] = await Promise.all([
        prisma.building.count({ where: { companyId: cid } }),
        prisma.unit.count({ where: { building: { companyId: cid } } }),
        prisma.tenant.count({ where: { companyId: cid } }),
        prisma.participation.count({ where: { companyId: cid } }),
        prisma.financialAccount.count({ where: { companyId: cid, activa: true } }),
        prisma.financialPosition.count({
          where: { account: { companyId: cid } },
        }),
      ]);

      results.push({
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
      });
    }

    return NextResponse.json({ companies: results });
  } catch (error: unknown) {
    console.error('[API /inversiones/grupo]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
