import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
// import { updateProviderRating } from '@/lib/marketplace-service';

// GET /api/marketplace/reviews - Obtener reseñas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const jobId = searchParams.get('jobId');

    const reviews = await prisma.serviceReview.findMany({
      where: {
        companyId: session?.user?.companyId,
        ...(providerId && { providerId }),
        ...(jobId && { jobId }),
      },
      include: {
        provider: true,
        job: {
          include: {
            building: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
  }
}

// POST /api/marketplace/reviews - Crear reseña
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      jobId,
      providerId,
      calificacion,
      puntualidad,
      calidad,
      comunicacion,
      precioJusto,
      comentario,
      recomendaria,
    } = body;

    // Verificar que el trabajo existe y está completado
    const job = await prisma.serviceJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.estado !== 'completado') {
      return NextResponse.json(
        { error: 'El trabajo debe estar completado para crear una reseña' },
        { status: 400 }
      );
    }

    // Verificar que no exista ya una reseña para este trabajo
    const existingReview = await prisma.serviceReview.findFirst({
      where: { jobId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Ya existe una reseña para este trabajo' },
        { status: 400 }
      );
    }

    const review = await prisma.serviceReview.create({
      data: {
        companyId: session?.user?.companyId,
        jobId,
        providerId,
        calificacion: parseInt(calificacion),
        puntualidad: puntualidad ? parseInt(puntualidad) : null,
        calidad: calidad ? parseInt(calidad) : null,
        comunicacion: comunicacion ? parseInt(comunicacion) : null,
        precioJusto: precioJusto ? parseInt(precioJusto) : null,
        comentario: comentario || null,
        recomendaria: recomendaria !== false,
        creadoPor: session?.user?.email || '',
      },
      include: {
        provider: true,
        job: true,
      },
    });

    // Actualizar rating del proveedor
    // await updateProviderRating(providerId);

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    logger.error('Error creating review:', error);
    return NextResponse.json({ error: 'Error al crear reseña' }, { status: 500 });
  }
}
