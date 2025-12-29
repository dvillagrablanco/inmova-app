import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://inmovaapp.com';

  try {
    // Páginas estáticas
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/register`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
    ];

    // Propiedades públicas (si hay rutas públicas de propiedades)
    let propertyPages: MetadataRoute.Sitemap = [];

    try {
      const properties = await prisma.property.findMany({
        where: {
          // Solo propiedades públicas/disponibles
          status: 'AVAILABLE',
        },
        select: {
          id: true,
          updatedAt: true,
        },
        take: 1000, // Limitar para evitar sitemaps gigantes
        orderBy: {
          updatedAt: 'desc',
        },
      });

      propertyPages = properties.map((property) => ({
        url: `${baseUrl}/properties/${property.id}`,
        lastModified: property.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    } catch (error) {
      console.error('[Sitemap] Error fetching properties:', error);
      // Continuar sin propiedades si hay error
    }

    // Blog posts (si existen)
    let blogPages: MetadataRoute.Sitemap = [];

    try {
      // Agregar posts del blog si tienes una tabla de blog
      // const posts = await prisma.blogPost.findMany({ ... });
      // blogPages = posts.map(post => ({ ... }));
    } catch (error) {
      // Blog no implementado, ignorar
    }

    return [...staticPages, ...propertyPages, ...blogPages];
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error);

    // Devolver al menos las páginas estáticas
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
