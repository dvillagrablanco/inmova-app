/**
 * Sitemap Dinámico
 * Genera sitemap.xml con todas las URLs públicas del sitio
 */

import { MetadataRoute } from 'next';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 3600;
// Lazy import de prisma para evitar errores en build-time
let prisma: any = null;
let lastGoodRoutes: MetadataRoute.Sitemap | null = null;

async function getPrisma() {
  if (!prisma) {
    try {
      const { prisma: prismaClient } = await import('@/lib/db');
      prisma = prismaClient;
    } catch (error) {
      logger.warn('Prisma not available during build, using static routes only');
      return null;
    }
  }
  return prisma;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://inmova.app';
  const enableDynamicSitemap = process.env.ENABLE_DYNAMIC_SITEMAP !== 'false';

  // URLs estáticas (páginas públicas)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/landing/sobre-nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/landing/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/landing/demo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/landing/casos-exito`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/landing/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/landing/legal/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/landing/legal/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/landing/legal/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/landing/legal/gdpr`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    const prismaClient = await getPrisma();

    // Si Prisma no está disponible (build-time) o se desactiva, retornar solo rutas estáticas
    if (!enableDynamicSitemap || !prismaClient) {
      console.log('Sitemap: Using static routes only (Prisma not available)');
      return staticRoutes;
    }

    const [unitsResult, buildingsResult] = await Promise.allSettled([
      prismaClient.unit.findMany({
        where: {
          estado: 'disponible',
        },
        select: {
          id: true,
          updatedAt: true,
        },
        take: 1000, // Limitar a 1000 propiedades para el sitemap
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prismaClient.building.findMany({
        where: {},
        select: {
          id: true,
          updatedAt: true,
        },
        take: 500,
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);

    const propertyRoutes: MetadataRoute.Sitemap =
      unitsResult.status === 'fulfilled'
        ? unitsResult.value.map((unit: { id: string; updatedAt: Date }) => ({
            url: `${baseUrl}/unidades/${unit.id}`,
            lastModified: unit.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          }))
        : [];

    const buildingRoutes: MetadataRoute.Sitemap =
      buildingsResult.status === 'fulfilled'
        ? buildingsResult.value.map((building: { id: string; updatedAt: Date }) => ({
            url: `${baseUrl}/edificios/${building.id}`,
            lastModified: building.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
          }))
        : [];

    const routes = [...staticRoutes, ...propertyRoutes, ...buildingRoutes];
    lastGoodRoutes = routes;
    return routes;
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    // En caso de error, retornar solo las rutas estáticas
    return lastGoodRoutes || staticRoutes;
  }
}
