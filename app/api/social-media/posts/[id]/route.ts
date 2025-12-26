import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

/**
 * DELETE /api/social-media/posts/[id]
 * Eliminar un post de redes sociales
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const postId = params.id;

    // Verificar que el post existe y pertenece a la compañía
    const post = await prisma.socialMediaPost.findFirst({
      where: {
        id: postId,
        companyId: session.user.companyId,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    // Solo permitir eliminar posts que no estén publicados
    if (post.estado === 'publicado') {
      return NextResponse.json(
        { error: 'No se puede eliminar un post ya publicado' },
        { status: 400 }
      );
    }

    await prisma.socialMediaPost.delete({
      where: { id: postId },
    });

    logger.info('Post deleted successfully', { postId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error eliminando post'), {
      context: 'DELETE /api/social-media/posts/[id]',
    });
    return NextResponse.json({ error: 'Error al eliminar el post' }, { status: 500 });
  }
}

/**
 * GET /api/social-media/posts/[id]
 * Obtener detalles de un post específico
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const post = await prisma.socialMediaPost.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        account: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error obteniendo post'), {
      context: 'GET /api/social-media/posts/[id]',
    });
    return NextResponse.json({ error: 'Error al obtener el post' }, { status: 500 });
  }
}
