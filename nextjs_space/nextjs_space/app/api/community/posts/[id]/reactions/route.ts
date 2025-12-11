import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';

// POST - Añadir/cambiar reacción
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id: postId } = params;
    const data = await request.json();
    
    // Upsert de la reacción
    const reaction = await prisma.postReaction.upsert({
      where: {
        postId_tenantId: {
          postId,
          tenantId: data.tenantId || ''
        }
      },
      update: {
        tipo: data.tipo || 'like'
      },
      create: {
        postId,
        tenantId: data.tenantId,
        userId: data.userId,
        tipo: data.tipo || 'like'
      }
    });
    
    // Actualizar contador de likes
    const likesCount = await prisma.postReaction.count({
      where: { postId, tipo: 'like' }
    });
    
    await prisma.socialPost.update({
      where: { id: postId },
      data: { likes: likesCount }
    });
    
    return NextResponse.json(reaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Quitar reacción
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id: postId } = params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (tenantId) {
      await prisma.postReaction.deleteMany({
        where: {
          postId,
          tenantId
        }
      });
    }
    
    // Actualizar contador
    const likesCount = await prisma.postReaction.count({
      where: { postId, tipo: 'like' }
    });
    
    await prisma.socialPost.update({
      where: { id: postId },
      data: { likes: likesCount }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
