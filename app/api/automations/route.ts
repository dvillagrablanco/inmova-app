import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session?.user?.companyId;
    const automations = await prisma.automation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(automations);
  } catch (error) {
    logger.error('Error fetching automations:', error);
    return NextResponse.json({ error: 'Error al obtener automatizaciones' }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session?.user?.companyId;
    const userId = session?.user?.id
    const body = await request.json();
    const { nombre, descripcion, tipo, triggerType, prioridad, activa } = body;
    if (!nombre || !tipo || !triggerType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    // Crear automatización con configuración básica
    const automation = await prisma.automation.create({
      data: {
        companyId,
        userId,
        nombre,
        descripcion: descripcion || null,
        tipo,
        triggerType,
        triggerConfig: {}, // Configuración básica vacía
        acciones: [], // Acciones vacías por ahora
        prioridad: prioridad || 'media',
        activa: activa !== undefined ? activa : true,
      },
    });
    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    logger.error('Error creating automation:', error);
    return NextResponse.json({ error: 'Error al crear automatización' }, { status: 500 });
  }
}
