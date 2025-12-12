/**
 * Sitemap Dinámico
 * Genera sitemap.xml con todas las URLs públicas del sitio
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://inmova.app';

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
    // URLs dinámicas de propiedades (solo disponibles y activas)
    // Solo incluir propiedades de la primera compañía para el sitemap público
    const units = await prisma.unit.findMany({
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
    });

    const propertyRoutes: MetadataRoute.Sitemap = units.map((unit) => ({
      url: `${baseUrl}/unidades/${unit.id}`,
      lastModified: unit.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // URLs dinámicas de edificios (solo activos)
    const buildings = await prisma.building.findMany({
      where: {},
      select: {
        id: true,
        updatedAt: true,
      },
      take: 500,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const buildingRoutes: MetadataRoute.Sitemap = buildings.map((building) => ({
      url: `${baseUrl}/edificios/${building.id}`,
      lastModified: building.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...propertyRoutes, ...buildingRoutes];
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    // En caso de error, retornar solo las rutas estáticas
    return staticRoutes;
  }
}
