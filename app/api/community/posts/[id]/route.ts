export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, hasPermission, forbiddenResponse, notFoundResponse } from '@/lib/permissions';

// GET - Obtener detalle de un post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    
    const post = await prisma.socialPost.findFirst({
      where: {
        id,
        companyId: user.companyId
      },
      include: {
        author: {
          select: { id: true, nombreCompleto: true }
        },
        building: {
          select: { id: true, nombre: true }
        },
        comentarios: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, nombreCompleto: true }
            }
          }
        }
      }
    });
    
    if (!post) {
      return notFoundResponse('Post no encontrado');
    }
    
    // Obtener reacciones
    const reactions = await prisma.postReaction.findMany({
      where: { postId: id },
      select: {
        tipo: true,
        tenantId: true,
        userId: true
      }
    });
    
    return NextResponse.json({
      ...post,
      reactions
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// PATCH - Actualizar post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const data = await request.json();
    
    // Solo community managers pueden moderar posts
    if (data.moderado !== undefined && !hasPermission(user.role, 'moderateCommunity')) {
      return forbiddenResponse('No tienes permiso para moderar posts');
    }
    
    const post = await prisma.socialPost.updateMany({
      where: {
        id,
        companyId: user.companyId
      },
      data: {
        ...(data.contenido && { contenido: data.contenido }),
        ...(data.multimedia && { multimedia: data.multimedia }),
        ...(data.hashtags && { hashtags: data.hashtags }),
        ...(data.visibilidad && { visibilidad: data.visibilidad }),
        ...(data.destacado !== undefined && { destacado: data.destacado }),
        ...(data.moderado !== undefined && { moderado: data.moderado }),
      }
    });
    
    return NextResponse.json({ success: true, updated: post.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Eliminar post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    
    if (!hasPermission(user.role, 'moderateCommunity') && !hasPermission(user.role, 'delete')) {
      return forbiddenResponse('No tienes permiso para eliminar posts');
    }
    
    await prisma.socialPost.deleteMany({
      where: {
        id,
        companyId: user.companyId
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
