import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

// GET: Obtener el progreso de setup del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        setupProgress: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // El campo setupProgress puede ser un JSON almacenado como string
    const completedActions = user.setupProgress
      ? typeof user.setupProgress === 'string'
        ? JSON.parse(user.setupProgress)
        : user.setupProgress
      : [];

    return NextResponse.json({ completedActions });
  } catch (error) {
    logger.error('Error al obtener progreso de setup', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Guardar el progreso de setup del usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { completedActions } = body;

    if (!Array.isArray(completedActions)) {
      return NextResponse.json({ error: 'completedActions debe ser un array' }, { status: 400 });
    }

    // Actualizar el progreso en la base de datos
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        setupProgress: JSON.stringify(completedActions),
      },
    });

    return NextResponse.json({ success: true, completedActions });
  } catch (error) {
    logger.error('Error al guardar progreso de setup', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
