import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// POST /api/galerias/[id]/items - Agregar item a galería
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      tipo,
      habitacion,
      url,
      urlThumbnail,
      titulo,
      descripcion,
      orden,
      destacada,
      duracion,
      tipo360,
    } = body;

    const item = await prisma.galleryItem.create({
      data: {
        galleryId: params.id,
        tipo,
        habitacion,
        url,
        urlThumbnail,
        titulo,
        descripcion,
        orden: orden || 0,
        destacada: destacada || false,
        duracion,
        tipo360,
      },
    });

    // Actualizar timestamp de galería
    await prisma.propertyGallery.update({
      where: { id: params.id },
      data: { ultimaActualizacion: new Date() },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    return NextResponse.json(
      { error: 'Error al agregar item a galería' },
      { status: 500 }
    );
  }
}