import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';

function verifyToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as { tenantId: string };
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = payload.tenantId;

    // Obtener datos del inquilino
    const tenant = await db.tenant.findUnique({
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
    const contracts = await db.contract.findMany({
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
    const payments = await db.payment.findMany({
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
    const maintenanceRequests = await db.maintenanceRequest.findMany({
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
    console.error('Error al obtener dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener dashboard' },
      { status: 500 }
    );
  }
}
