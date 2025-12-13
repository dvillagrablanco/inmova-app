import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal-proveedor/reviews
 * Obtiene las reseñas recibidas por el proveedor autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el proveedor existe
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { companyId: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Obtener reseñas
    const reviews = await prisma.providerReview.findMany({
      where: {
        providerId,
        companyId: provider.companyId,
      },
      include: {
        workOrder: {
          select: {
            id: true,
            titulo: true,
            building: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular estadísticas
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.puntuacion, 0) / totalReviews
      : 0;

    // Contar por calificación
    const ratingDistribution = {
      5: reviews.filter(r => r.puntuacion === 5).length,
      4: reviews.filter(r => r.puntuacion === 4).length,
      3: reviews.filter(r => r.puntuacion === 3).length,
      2: reviews.filter(r => r.puntuacion === 2).length,
      1: reviews.filter(r => r.puntuacion === 1).length,
    };

    // Calcular promedios por categoría
    const avgCalidad = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.calidad || 0), 0) / totalReviews
      : 0;
    const avgPuntualidad = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.puntualidad || 0), 0) / totalReviews
      : 0;
    const avgProfesionalismo = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.profesionalismo || 0), 0) / totalReviews
      : 0;
    const avgPrecio = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.precio || 0), 0) / totalReviews
      : 0;
    const avgComunicacion = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.comunicacion || 0), 0) / totalReviews
      : 0;

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        categoryAverages: {
          calidad: Math.round(avgCalidad * 10) / 10,
          puntualidad: Math.round(avgPuntualidad * 10) / 10,
          profesionalismo: Math.round(avgProfesionalismo * 10) / 10,
          precio: Math.round(avgPrecio * 10) / 10,
          comunicacion: Math.round(avgComunicacion * 10) / 10,
        },
      },
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/portal-proveedor/reviews',
    });
    return NextResponse.json(
      { error: 'Error al obtener reseñas' },
      { status: 500 }
    );
  }
}
