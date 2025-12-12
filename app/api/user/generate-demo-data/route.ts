export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateDemoData, hasDemoData } from '@/lib/demo-data-generator';
import logger from '@/lib/logger';
import type { BusinessVertical } from '@prisma/client';

// POST: Generar datos demo para el usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener businessVertical desde la base de datos
    const { prisma } = await import('@/lib/db');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessVertical: true },
    });

    const businessVertical = user?.businessVertical;

    if (!businessVertical) {
      return NextResponse.json(
        { error: 'No se ha definido un vertical de negocio para el usuario' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene datos demo
    const alreadyHasDemoData = await hasDemoData(session.user.companyId);
    if (alreadyHasDemoData) {
      return NextResponse.json(
        { error: 'Ya se han generado datos demo anteriormente' },
        { status: 400 }
      );
    }

    // Generar datos demo
    const result = await generateDemoData(
      session.user.id,
      session.user.companyId,
      businessVertical
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    logger.error('Error en la API de generación de datos demo', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET: Verificar si el usuario ya tiene datos demo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const alreadyHasDemoData = await hasDemoData(session.user.companyId);

    return NextResponse.json({ hasDemoData: alreadyHasDemoData });
  } catch (error) {
    logger.error('Error al verificar datos demo', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
