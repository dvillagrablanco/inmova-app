import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateAutomaticNotifications } from '@/lib/notification-generator';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const onlyUnread = searchParams.get('onlyUnread') === 'true';
  const generateAuto = searchParams.get('generate') === 'true';

  try {
    // Generar notificaciones automáticas si se solicita
    if (generateAuto) {
      await generateAutomaticNotifications();
    }

    // Filtrar por userId o notificaciones globales (userId null)
    const where: any = {
      OR: [
        { userId: userId },
        { userId: null }, // Notificaciones globales para todos
      ],
    };
    
    if (onlyUnread) where.leida = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { prioridad: 'desc' }, // Ordenar por prioridad primero (alto > medio > bajo)
        { createdAt: 'desc' },
      ],
      take: 50,
    });

    // Contar notificaciones no leídas del usuario
    const unreadCount = await prisma.notification.count({
      where: {
        OR: [
          { userId: userId },
          { userId: null },
        ],
        leida: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tipo, titulo, mensaje, prioridad, fechaLimite, entityId, entityType, userId } = body;

    if (!tipo || !titulo || !mensaje) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        tipo,
        titulo,
        mensaje,
        prioridad: prioridad || 'bajo',
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        entityId: entityId || null,
        entityType: entityType || null,
        userId: userId || null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 });
  }
}