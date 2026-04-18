import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/anuncios
 *
 * Devuelve los anuncios del usuario actual.
 * Usa el modelo Notification con tipo='anuncio' como almacén
 * (por compatibilidad con la UI existente que espera la forma `Anuncio`).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json([]);
    }

    const prisma = await getPrisma();

    // Notificaciones tipo informativo persistidas como "anuncios"
    const notifs = await prisma.notification
      .findMany({
        where: {
          companyId,
          entityType: 'anuncio',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      .catch(() => [] as any[]);

    // Adaptar a la forma que espera la UI
    const anuncios = notifs.map((n: any) => {
      let metadata: any = {};
      try {
        if (n.entityId && typeof n.entityId === 'string' && n.entityId.startsWith('{')) {
          metadata = JSON.parse(n.entityId);
        }
      } catch {
        metadata = {};
      }

      return {
        id: n.id,
        titulo: n.titulo || '',
        contenido: n.mensaje || '',
        tipo: metadata.tipo || 'informativo',
        prioridad: metadata.prioridad || 'normal',
        fechaPublicacion: n.createdAt,
        fechaExpiracion: n.fechaLimite || null,
        adjuntos: metadata.adjuntos || [],
        visiblePara: metadata.visiblePara || 'todos',
        vistas: metadata.vistas || 0,
        activo: !n.leida,
        building: metadata.building || { id: '', nombre: '' },
        publicadoPor: n.userId || '',
        createdAt: n.createdAt,
      };
    });

    return NextResponse.json(anuncios);
  } catch (error) {
    logger.error('Error en /api/anuncios GET', error as any);
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST /api/anuncios
 * Crea un nuevo anuncio (notificación informativa).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa activa' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.titulo || !body?.contenido) {
      return NextResponse.json({ error: 'titulo y contenido son requeridos' }, { status: 400 });
    }

    const prisma = await getPrisma();

    const metadata = JSON.stringify({
      tipo: body.tipo || 'informativo',
      prioridad: body.prioridad || 'normal',
      visiblePara: body.visiblePara || 'todos',
      building: body.buildingId ? { id: body.buildingId } : null,
    });

    const notif = await prisma.notification.create({
      data: {
        companyId,
        tipo: 'info' as any,
        titulo: body.titulo,
        mensaje: body.contenido,
        prioridad: 'medio' as any,
        fechaLimite: body.fechaExpiracion ? new Date(body.fechaExpiracion) : null,
        entityType: 'anuncio',
        entityId: metadata,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, id: notif.id }, { status: 201 });
  } catch (error) {
    logger.error('Error en /api/anuncios POST', error as any);
    return NextResponse.json({ error: 'Error al crear anuncio' }, { status: 500 });
  }
}
