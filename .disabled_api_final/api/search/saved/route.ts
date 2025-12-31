import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    const saved = await prisma.savedSearch.findMany({
      where: {
        userId: session.user.id,
        companyId,
        activa: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ saved });
  } catch (error: any) {
    logger.error('Error al obtener búsquedas guardadas:', error);
    return NextResponse.json(
      { error: 'Error al obtener búsquedas guardadas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre, query, filters } = await req.json();
    const companyId = (session.user as any).companyId;

    const saved = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        companyId,
        nombre,
        query,
        filters
      }
    });

    return NextResponse.json({ saved }, { status: 201 });
  } catch (error: any) {
    logger.error('Error al guardar búsqueda:', error);
    return NextResponse.json(
      { error: 'Error al guardar búsqueda' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await prisma.savedSearch.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error al eliminar búsqueda guardada:', error);
    return NextResponse.json(
      { error: 'Error al eliminar búsqueda guardada' },
      { status: 500 }
    );
  }
}
