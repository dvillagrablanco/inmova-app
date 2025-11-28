import { prisma } from './db';
import { QuoteStatus, JobStatus } from '@prisma/client';

/**
 * PAQUETE 11: MARKETPLACE DE SERVICIOS - SERVICE LAYER
 */

// Calcular estadísticas de un proveedor
export async function calculateProviderStats(providerId: string) {
  const [totalJobs, completedJobs, reviews] = await Promise.all([
    prisma.serviceJob.count({ where: { providerId } }),
    prisma.serviceJob.count({ where: { providerId, estado: 'completado' } }),
    prisma.serviceReview.findMany({ where: { providerId } }),
  ]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length
    : 0;

  const avgPuntualidad = reviews.length > 0 && reviews.some(r => r.puntualidad)
    ? reviews.reduce((sum, r) => sum + (r.puntualidad || 0), 0) / reviews.filter(r => r.puntualidad).length
    : 0;

  const avgCalidad = reviews.length > 0 && reviews.some(r => r.calidad)
    ? reviews.reduce((sum, r) => sum + (r.calidad || 0), 0) / reviews.filter(r => r.calidad).length
    : 0;

  const recommendationRate = reviews.length > 0
    ? (reviews.filter(r => r.recomendaria).length / reviews.length) * 100
    : 0;

  return {
    totalJobs,
    completedJobs,
    totalReviews: reviews.length,
    avgRating: parseFloat(avgRating.toFixed(1)),
    avgPuntualidad: parseFloat(avgPuntualidad.toFixed(1)),
    avgCalidad: parseFloat(avgCalidad.toFixed(1)),
    recommendationRate: parseFloat(recommendationRate.toFixed(1)),
  };
}

// Obtener mejores proveedores por calificación
export async function getTopProviders(companyId: string, limit: number = 5) {
  const providers = await prisma.provider.findMany({
    where: { companyId },
    include: {
      serviceReviews: true,
      serviceJobs: { where: { estado: 'completado' } },
    },
  });

  const providersWithStats = await Promise.all(
    providers.map(async (provider) => {
      const stats = await calculateProviderStats(provider.id);
      return { ...provider, stats };
    })
  );

  return providersWithStats
    .filter(p => p.stats.totalReviews > 0)
    .sort((a, b) => b.stats.avgRating - a.stats.avgRating)
    .slice(0, limit);
}

// Sugerir proveedor basado en tipo de servicio
export async function suggestProviderForService(
  companyId: string,
  servicioTipo: string
) {
  // Buscar proveedores del tipo requerido
  const providers = await prisma.provider.findMany({
    where: {
      companyId,
      tipo: { contains: servicioTipo, mode: 'insensitive' },
    },
    include: {
      serviceReviews: true,
      serviceJobs: { where: { estado: 'completado' } },
    },
  });

  if (providers.length === 0) return null;

  // Calcular score para cada proveedor
  const providersWithScores = await Promise.all(
    providers.map(async (provider) => {
      const stats = await calculateProviderStats(provider.id);
      
      // Score basado en: rating (40%), trabajos completados (30%), tasa de recomendación (30%)
      const score =
        (stats.avgRating / 5) * 40 +
        Math.min(stats.completedJobs / 10, 1) * 30 +
        (stats.recommendationRate / 100) * 30;

      return { provider, stats, score };
    })
  );

  // Retornar el mejor proveedor
  const bestProvider = providersWithScores.sort((a, b) => b.score - a.score)[0];
  return bestProvider;
}

// Actualizar rating de proveedor basado en reviews
export async function updateProviderRating(providerId: string) {
  const reviews = await prisma.serviceReview.findMany({
    where: { providerId },
  });

  if (reviews.length === 0) return;

  const avgRating =
    reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length;

  await prisma.provider.update({
    where: { id: providerId },
    data: { rating: parseFloat(avgRating.toFixed(1)) },
  });
}

// Verificar cotizaciones expiradas y actualizar estado
export async function checkExpiredQuotes(companyId: string) {
  const now = new Date();
  
  const expiredQuotes = await prisma.serviceQuote.updateMany({
    where: {
      companyId,
      estado: 'cotizada',
      validezCotizacion: { lt: now },
    },
    data: { estado: 'expirada' },
  });

  return expiredQuotes.count;
}

// Obtener estadísticas del marketplace
export async function getMarketplaceStats(companyId: string) {
  const [totalQuotes, pendingQuotes, activeJobs, completedJobs, totalReviews] =
    await Promise.all([
      prisma.serviceQuote.count({ where: { companyId } }),
      prisma.serviceQuote.count({
        where: { companyId, estado: { in: ['solicitada', 'en_revision'] } },
      }),
      prisma.serviceJob.count({
        where: { companyId, estado: { in: ['pendiente', 'en_progreso'] } },
      }),
      prisma.serviceJob.count({ where: { companyId, estado: 'completado' } }),
      prisma.serviceReview.count({ where: { companyId } }),
    ]);

  const reviews = await prisma.serviceReview.findMany({ where: { companyId } });
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length
      : 0;

  return {
    totalQuotes,
    pendingQuotes,
    activeJobs,
    completedJobs,
    totalReviews,
    avgRating: parseFloat(avgRating.toFixed(1)),
  };
}
