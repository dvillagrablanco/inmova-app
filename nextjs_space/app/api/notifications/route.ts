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

  const user = session.user as any;
  const userId = user.id;
  const companyId = user.companyId;

  const { searchParams } = new URL(req.url);
  const onlyUnread = searchParams.get('onlyUnread') === 'true';
  const generateAuto = searchParams.get('generate') === 'true';

  try {
    // Generar notificaciones automáticas si se solicita
    if (generateAuto) {
      await generateAutomaticNotifications(companyId);
    }

    // Filtrar por companyId y (userId o notificaciones globales)
    const where: any = {
      companyId: companyId,
      OR: [
        { userId: userId },
        { userId: null }, // Notificaciones globales para todos en la empresa
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

    // Contar notificaciones no leídas del usuario en esta empresa
    const unreadCount = await prisma.notification.count({
      where: {
        companyId: companyId,
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
  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const companyId = (session.user as any).companyId;

  try {
    const body = await req.json();
    const { tipo, titulo, mensaje, prioridad, fechaLimite, entityId, entityType, userId } = body;

    if (!tipo || !titulo || !mensaje) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        companyId,
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