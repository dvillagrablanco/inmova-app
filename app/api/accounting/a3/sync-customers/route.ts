// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getA3Service } from '@/lib/a3-integration-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = session.user;
    if (role !== 'administrador' && role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      where: { companyId },
      take: 10,
    });

    const a3Service = getA3Service();
    const results = [];

    for (const tenant of tenants) {
      try {
        const cliente = await a3Service.syncTenantToContact(tenant);
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.nombreCompleto,
          success: true,
          clienteId: cliente.id,
        });
      } catch (error) {
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.nombreCompleto,
          success: false,
          error: 'Error al sincronizar',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.filter((r) => r.success).length}/${results.length} clientes sincronizados con A3`,
      results,
    });
  } catch (error) {
    logger.error('Error syncing customers to A3:', error);
    return NextResponse.json({ error: 'Error al sincronizar clientes con A3' }, { status: 500 });
  }
}
