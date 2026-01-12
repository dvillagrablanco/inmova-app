import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session?.user?.companyId;

    const tags = await prisma.documentTag.findMany({
      where: { companyId },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({ tags });
  } catch (error: any) {
    logger.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar etiquetas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre, color } = await request.json();

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const companyId = session?.user?.companyId;

    const tag = await prisma.documentTag.create({
      data: {
        companyId,
        nombre,
        color: color || '#000000',
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating tag:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear etiqueta' },
      { status: 500 }
    );
  }
}
