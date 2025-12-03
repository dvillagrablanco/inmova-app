import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET - Obtener recordatorios automáticos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const activo = searchParams.get('activo');

    const reminders = await prisma.automaticReminder.findMany({
      where: {
        companyId: user.companyId,
        ...(tipo && { tipo: tipo as any }),
        ...(activo !== null && { activo: activo === 'true' })
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reminders);
  } catch (error) {
    logger.error('Error al obtener recordatorios:', error);
    return NextResponse.json({ error: 'Error al obtener recordatorios' }, { status: 500 });
  }
}

// POST - Crear recordatorio automático
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role === 'operador') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await req.json();
    const reminder = await prisma.automaticReminder.create({
      data: {
        companyId: user.companyId,
        nombre: body.nombre,
        descripcion: body.descripcion,
        tipo: body.tipo,
        channel: body.channel || 'email',
        frequency: body.frequency || 'once',
        diasAnticipacion: body.diasAnticipacion || 7,
        horaEnvio: body.horaEnvio || '09:00',
        enviarA: body.enviarA || [],
        conditions: body.conditions,
        entityType: body.entityType,
        tituloPlantilla: body.tituloPlantilla,
        mensajePlantilla: body.mensajePlantilla,
        variables: body.variables || [],
        creadoPor: user.id,
        activo: true
      }
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    logger.error('Error al crear recordatorio:', error);
    return NextResponse.json({ error: 'Error al crear recordatorio' }, { status: 500 });
  }
}

// PATCH - Actualizar recordatorio
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    const reminder = await prisma.automaticReminder.update({
      where: { id },
      data
    });

    return NextResponse.json(reminder);
  } catch (error) {
    logger.error('Error al actualizar recordatorio:', error);
    return NextResponse.json({ error: 'Error al actualizar recordatorio' }, { status: 500 });
  }
}
