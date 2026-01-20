import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/community-manager/posts
 * Obtiene los posts programados/publicados
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // TODO: Obtener posts reales de la base de datos
    // Por ahora, retornamos array vacío
    
    return NextResponse.json({
      success: true,
      posts: [],
      total: 0,
      message: 'No hay publicaciones. Crea tu primera publicación.',
    });
  } catch (error: any) {
    logger.error('[Community Manager Posts Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener publicaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/community-manager/posts
 * Crear una nueva publicación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { content, platforms, status, scheduledDate, mediaUrl } = body;

    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Contenido y al menos una plataforma son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Guardar en base de datos y programar publicación
    const newPost = {
      id: `post_${Date.now()}`,
      content,
      platforms,
      status: status || 'scheduled',
      scheduledDate: scheduledDate || new Date().toISOString(),
      mediaUrl,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    return NextResponse.json({
      success: true,
      post: newPost,
      message: status === 'draft' ? 'Borrador guardado' : 'Publicación programada correctamente',
    });
  } catch (error: any) {
    logger.error('[Community Manager Create Post Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear publicación' },
      { status: 500 }
    );
  }
}
