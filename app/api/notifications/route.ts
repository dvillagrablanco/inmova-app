import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const tipo = searchParams.get('tipo');

    const where: any = {
      companyId: user.companyId,
      OR: [
        { userId: user.id },
        { userId: null } // Notificaciones globales
      ]
    };

    if (unreadOnly) {
      where.leida = false;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { prioridad: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensaje: true,
        leida: true,
        prioridad: true,
        fechaLimite: true,
        entityId: true,
        entityType: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const unreadCount = await prisma.notification.count({
      where: {
        companyId: user.companyId,
        OR: [
          { userId: user.id },
          { userId: null }
        ],
        leida: false
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva notificación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true, role: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    // Solo admins pueden crear notificaciones
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { tipo, titulo, mensaje, prioridad, fechaLimite, entityId, entityType, userId } = body;

    if (!tipo || !titulo || !mensaje) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        companyId: user.companyId,
        tipo,
        titulo,
        mensaje,
        prioridad: prioridad || 'bajo',
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        entityId,
        entityType,
        userId
      }
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return NextResponse.json(
      { error: 'Error al crear notificación' },
      { status: 500 }
    );
  }
}
