import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/community-manager/blog
 * Obtiene los posts del blog
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

    // TODO: Obtener posts del blog de la base de datos
    // Por ahora, retornamos array vacío
    
    return NextResponse.json({
      success: true,
      posts: [],
      total: 0,
      message: 'No hay artículos en el blog. Crea tu primer artículo.',
    });
  } catch (error: any) {
    logger.error('[Community Manager Blog Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener artículos del blog' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/community-manager/blog
 * Crear un nuevo artículo del blog
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
    const { title, content, excerpt, category, status, publishDate } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título y contenido son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Guardar en base de datos
    const newPost = {
      id: `blog_${Date.now()}`,
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      category: category || 'General',
      status: status || 'draft',
      publishDate,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Artículo creado correctamente',
    });
  } catch (error: any) {
    logger.error('[Community Manager Create Blog Post Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear artículo' },
      { status: 500 }
    );
  }
}
