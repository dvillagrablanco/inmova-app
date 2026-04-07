import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json([]);

    const entityType = req.nextUrl.searchParams.get('entityType');
    const entityId = req.nextUrl.searchParams.get('entityId');
    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType y entityId requeridos' }, { status: 400 });
    }

    const notes = await prisma.note.findMany({
      where: { companyId, entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = notes.map((n: any) => ({
      id: n.id,
      entityType: n.entityType,
      entityId: n.entityId,
      contenido: n.contenido,
      autor: n.autor,
      fechaCreacion: n.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[notas GET]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({ error: 'Company requerida' }, { status: 400 });

    const body = await req.json();
    const { entityType, entityId, contenido } = body;
    if (!entityType || !entityId || !contenido?.trim()) {
      return NextResponse.json(
        { error: 'entityType, entityId y contenido requeridos' },
        { status: 400 }
      );
    }

    const autor = session.user?.name || session.user?.email || 'Usuario';
    const note = await prisma.note.create({
      data: {
        companyId,
        entityType,
        entityId,
        contenido: contenido.trim(),
        autor,
        authorId: (session.user as any).id || null,
      },
    });

    return NextResponse.json(
      {
        id: note.id,
        entityType: note.entityType,
        entityId: note.entityId,
        contenido: note.contenido,
        autor: note.autor,
        fechaCreacion: note.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[notas POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
