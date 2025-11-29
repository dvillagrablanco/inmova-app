import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/anuncios - Obtener anuncios
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const activo = searchParams.get('activo');

    const anuncios = await prisma.communityAnnouncement.findMany({
      where: {
        companyId: session.user.companyId,
        ...(buildingId && { buildingId }),
        ...(activo && { activo: activo === 'true' }),
      },
      include: {
        building: { select: { nombre: true } },
      },
      orderBy: { fechaPublicacion: 'desc' },
    });

    return NextResponse.json(anuncios);
  } catch (error) {
    console.error('Error fetching anuncios:', error);
    return NextResponse.json(
      { error: 'Error al obtener anuncios' },
      { status: 500 }
    );
  }
}

// POST /api/anuncios - Crear anuncio
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      buildingId,
      titulo,
      contenido,
      tipo,
      importante,
      enviarNotificacion,
      fechaExpiracion,
      adjuntos,
    } = body;

    const anuncio = await prisma.communityAnnouncement.create({
      data: {
        companyId: session.user.companyId,
        buildingId,
        titulo,
        contenido,
        tipo: tipo || 'informacion',
        importante: importante || false,
        enviarNotificacion: enviarNotificacion || false,
        fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : null,
        adjuntos: adjuntos || [],
        publicadoPor: session.user.id!,
      },
      include: {
        building: true,
      },
    });

    return NextResponse.json(anuncio, { status: 201 });
  } catch (error) {
    console.error('Error creating anuncio:', error);
    return NextResponse.json(
      { error: 'Error al crear anuncio' },
      { status: 500 }
    );
  }
}