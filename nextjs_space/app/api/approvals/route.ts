import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { createNotification } from '@/lib/notification-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/approvals
 * Obtiene las aprobaciones pendientes para el usuario administrador
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || 'pendiente';

    let approvals;

    if (user.role === 'administrador') {
      // Los administradores ven todas las aprobaciones de su empresa
      approvals = await prisma.approval.findMany({
        where: {
          estado: estado as any,
        },
        include: {
          expense: {
            include: {
              building: true,
              unit: {
                include: {
                  building: true,
                },
              },
              provider: true,
            },
          },
          maintenance: {
            include: {
              unit: {
                include: {
                  building: true,
                },
              },
              provider: true,
            },
          },
        },
        orderBy: {
          fechaSolicitud: 'desc',
        },
      });

      // Filtrar por empresa (verificar a través de las relaciones)
      approvals = approvals.filter((approval) => {
        if (approval.expense) {
          const building = approval.expense.building || approval.expense.unit?.building;
          return building?.companyId === user.companyId;
        }
        if (approval.maintenance) {
          return approval.maintenance.unit?.building?.companyId === user.companyId;
        }
        return false;
      });
    } else {
      // Otros usuarios solo ven sus propias solicitudes
      approvals = await prisma.approval.findMany({
        where: {
          solicitadoPor: user.id,
          estado: estado as any,
        },
        include: {
          expense: {
            include: {
              building: true,
              unit: {
                include: {
                  building: true,
                },
              },
              provider: true,
            },
          },
          maintenance: {
            include: {
              unit: {
                include: {
                  building: true,
                },
              },
              provider: true,
            },
          },
        },
        orderBy: {
          fechaSolicitud: 'desc',
        },
      });
    }

    return NextResponse.json(approvals);
  } catch (error: any) {
    console.error('Error al obtener aprobaciones:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener aprobaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/approvals
 * Crea una nueva solicitud de aprobación
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { tipo, entityId, monto, motivo } = body;

    if (!tipo || !entityId || !monto) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear solicitud de aprobación
    const approval = await prisma.approval.create({
      data: {
        tipo,
        entityId,
        expenseId: tipo === 'gasto' ? entityId : undefined,
        maintenanceId: tipo === 'mantenimiento' ? entityId : undefined,
        solicitadoPor: user.id,
        monto,
        motivo,
        estado: 'pendiente',
      },
    });

    // Actualizar el estado de la entidad
    if (tipo === 'gasto') {
      await prisma.expense.update({
        where: { id: entityId },
        data: {
          requiereAprobacion: true,
          estadoAprobacion: 'pendiente',
        },
      });
    } else if (tipo === 'mantenimiento') {
      await prisma.maintenanceRequest.update({
        where: { id: entityId },
        data: {
          requiereAprobacion: true,
          estadoAprobacion: 'pendiente',
        },
      });
    }

    // Notificar a los administradores
    const admins = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: 'administrador',
      },
    });

    for (const admin of admins) {
      await createNotification({
        companyId: user.companyId,
        userId: admin.id,
        tipo: 'alerta_sistema',
        titulo: 'Nueva solicitud de aprobación',
        mensaje: `${user.name} ha solicitado aprobación para un ${tipo} de ${monto.toFixed(2)} €`,
        prioridad: 'medio',
        entityId: approval.id,
        entityType: 'approval',
      });
    }

    return NextResponse.json(approval, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear solicitud de aprobación:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al crear solicitud de aprobación' },
      { status: 500 }
    );
  }
}