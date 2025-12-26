// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAlegraService } from '@/lib/alegra-integration-service';
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

    const alegraService = getAlegraService();
    const results = [];

    for (const tenant of tenants) {
      try {
        const contact = await alegraService.syncTenantToContact(tenant);
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.nombreCompleto,
          success: true,
          contactId: contact.id,
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
      message: `${results.filter((r) => r.success).length}/${results.length} clientes sincronizados con Alegra`,
      results,
    });
  } catch (error) {
    logger.error('Error syncing customers to Alegra:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar clientes con Alegra' },
      { status: 500 }
    );
  }
}
