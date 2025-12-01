import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/anuncios/[id] - Obtener detalle de anuncio
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const anuncio = await prisma.communityAnnouncement.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        building: true,
      },
    });

    if (!anuncio) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(anuncio);
  } catch (error) {
    console.error('Error al obtener anuncio:', error);
    return NextResponse.json(
      { error: 'Error al obtener anuncio' },
      { status: 500 }
    );
  }
}

// PATCH /api/anuncios/[id] - Actualizar anuncio
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo administrador o gestor pueden actualizar
    if (!['administrador', 'gestor'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar anuncios' },
        { status: 403 }
      );
    }

    const data = await req.json();

    // Verificar que el anuncio existe y pertenece a la empresa
    const anuncioExistente = await prisma.communityAnnouncement.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!anuncioExistente) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }

    const anuncio = await prisma.communityAnnouncement.update({
      where: { id: params.id },
      data: {
        titulo: data.titulo,
        contenido: data.contenido,
        tipo: data.tipo,
        importante: data.prioridad === 'alta' || data.prioridad === 'urgente',
        fechaExpiracion: data.fechaExpiracion
          ? new Date(data.fechaExpiracion)
          : null,
        adjuntos: data.adjuntos,
        activo: data.activo !== undefined ? data.activo : anuncioExistente.activo,
      },
    });

    return NextResponse.json(anuncio);
  } catch (error) {
    console.error('Error al actualizar anuncio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar anuncio' },
      { status: 500 }
    );
  }
}

// DELETE /api/anuncios/[id] - Desactivar anuncio
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo administrador o gestor pueden eliminar
    if (!['administrador', 'gestor'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar anuncios' },
        { status: 403 }
      );
    }

    // Verificar que el anuncio existe
    const anuncioExistente = await prisma.communityAnnouncement.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!anuncioExistente) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }

    // Desactivar en lugar de eliminar
    const anuncio = await prisma.communityAnnouncement.update({
      where: { id: params.id },
      data: { activo: false },
    });

    return NextResponse.json(anuncio);
  } catch (error) {
    console.error('Error al eliminar anuncio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar anuncio' },
      { status: 500 }
    );
  }
}
