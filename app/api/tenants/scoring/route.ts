import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as { role?: string }).role as any,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json([]);
    }

    const prisma = await getPrisma();
    const companyFilter =
      scope.scopeCompanyIds.length > 1
        ? { in: scope.scopeCompanyIds }
        : scope.activeCompanyId;

    const tenants = await prisma.tenant.findMany({
      where: { companyId: companyFilter, isDemo: false },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        contracts: {
          select: {
            id: true,
            fechaInicio: true,
            payments: {
              select: {
                fechaVencimiento: true,
                fechaPago: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    const tenantIds = tenants.map((t) => t.id);

    const maintenanceCounts = await prisma.maintenanceRequest.groupBy({
      by: ['unitId'],
      where: {
        unit: {
          tenantId: { in: tenantIds },
          building: { companyId: companyFilter },
        },
      },
      _count: { id: true },
    });

    const unitToTenant = await prisma.unit.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true, tenantId: true },
    });
    const unitTenantMap = new Map(unitToTenant.map((u) => [u.id, u.tenantId]));

    const incidentCountByTenant = new Map<string, number>();
    for (const mc of maintenanceCounts) {
      const tenantId = unitTenantMap.get(mc.unitId);
      if (tenantId) {
        incidentCountByTenant.set(
          tenantId,
          (incidentCountByTenant.get(tenantId) ?? 0) + mc._count.id
        );
      }
    }

    const results: Array<{
      tenantId: string;
      nombre: string;
      email: string;
      score: number;
      paymentScore: number;
      durationScore: number;
      incidentScore: number;
    }> = [];

    const now = new Date();

    for (const tenant of tenants) {
      let paymentScore = 25;
      let durationScore = 0;
      let incidentScore = 5;

      const allPayments = tenant.contracts.flatMap((c) => c.payments);
      const paidPayments = allPayments.filter((p) => p.fechaPago != null);
      const totalPaid = paidPayments.length;

      if (totalPaid > 0) {
        const onTime = paidPayments.filter(
          (p) =>
            p.fechaPago &&
            p.fechaVencimiento &&
            p.fechaPago <= p.fechaVencimiento
        ).length;
        paymentScore = Math.round((onTime / totalPaid) * 50);
      } else if (allPayments.length === 0) {
        paymentScore = 25;
      }

      const firstContract = tenant.contracts
        .filter((c) => c.fechaInicio)
        .sort(
          (a, b) =>
            new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
        )[0];

      if (firstContract) {
        const months =
          (now.getFullYear() - new Date(firstContract.fechaInicio).getFullYear()) * 12 +
          (now.getMonth() - new Date(firstContract.fechaInicio).getMonth());
        if (months > 24) durationScore = 25;
        else if (months > 12) durationScore = 15;
        else if (months > 6) durationScore = 10;
      }

      const incidentCount = incidentCountByTenant.get(tenant.id) ?? 0;
      if (incidentCount === 0) incidentScore = 25;
      else if (incidentCount <= 2) incidentScore = 15;
      else incidentScore = 5;

      const score = Math.min(
        100,
        Math.round(paymentScore + durationScore + incidentScore)
      );

      results.push({
        tenantId: tenant.id,
        nombre: tenant.nombreCompleto,
        email: tenant.email,
        score,
        paymentScore,
        durationScore,
        incidentScore,
      });
    }

    results.sort((a, b) => b.score - a.score);

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Tenant Scoring Error]:', error);
    return NextResponse.json(
      { error: 'Error al calcular scoring de inquilinos' },
      { status: 500 }
    );
  }
}
