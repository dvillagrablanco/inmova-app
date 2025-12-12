import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authTenantOptions } from '@/lib/auth-tenant-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authTenantOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = (session.user as any).id;

    // Obtener datos del inquilino
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        telefono: true,
        dni: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Obtener contratos activos
    const contracts = await prisma.contract.findMany({
      where: {
        tenantId,
        estado: 'activo',
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });

    // Obtener pagos recientes
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          tenantId,
        },
      },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaVencimiento: 'desc',
      },
      take: 10,
    });

    // Obtener solicitudes de mantenimiento
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        unit: {
          tenantId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Calcular estadísticas
    const totalPagado = payments
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);

    const totalPendiente = payments
      .filter((p) => p.estado === 'pendiente' || p.estado === 'atrasado')
      .reduce((sum, p) => sum + p.monto, 0);

    return NextResponse.json({
      tenant,
      contracts,
      payments,
      maintenanceRequests,
      stats: {
        contractsCount: contracts.length,
        paymentsCount: payments.length,
        maintenanceCount: maintenanceRequests.length,
        totalPagado,
        totalPendiente,
      },
    });
  } catch (error) {
    logger.error('Error al obtener dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener dashboard' },
      { status: 500 }
    );
  }
}
