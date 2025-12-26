import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, hasPermission, forbiddenResponse } from '@/lib/permissions';

// GET - Listar posts sociales
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      companyId: user.companyId,
      moderado: false,
    };

    if (buildingId) where.buildingId = buildingId;

    const posts = await prisma.socialPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: {
          select: { id: true, nombreCompleto: true },
        },
        building: {
          select: { id: true, nombre: true },
        },
        comentarios: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, nombreCompleto: true },
            },
          },
        },
      },
    });

    const total = await prisma.socialPost.count({ where });

    return NextResponse.json({
      posts,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST - Crear nuevo post
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();

    // Community managers pueden crear posts
    const isCommunityPost =
      user.role === 'community_manager' ||
      user.role === 'administrador' ||
      user.role === 'super_admin';

    const post = await prisma.socialPost.create({
      data: {
        companyId: user.companyId,
        buildingId: data.buildingId,
        authorId: data.tenantId, // Si es un tenant
        tipo: data.tipo || 'post',
        contenido: data.contenido,
        multimedia: data.multimedia || [],
        hashtags: data.hashtags || [],
        visibilidad: data.visibilidad || 'building',
        destacado: isCommunityPost && data.destacado,
      },
      include: {
        author: {
          select: { id: true, nombreCompleto: true },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
