export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener servicios reales de la base de datos
    const services = await prisma.marketplaceService.findMany({
      where: {
        activo: true,
        disponible: true,
      },
      include: {
        provider: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            tipo: true,
            rating: true,
          },
        },
      },
      orderBy: [
        { destacado: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transformar al formato esperado por el frontend
    const formattedServices = services.map((service) => {
      const images = Array.isArray(service.imagenes) ? service.imagenes : [];
      const image = typeof images[0] === 'string' ? images[0] : null;
      const tags = [service.categoria, service.subcategoria].filter(
        (tag): tag is string => Boolean(tag)
      );

      return {
        id: service.id,
        name: service.nombre,
        category: service.categoria.toLowerCase(),
        provider: service.provider ? {
          id: service.provider.id,
          name: service.provider.nombre,
          verified: Boolean(service.provider.id),
          rating: service.provider.rating ?? 0,
          reviews: service.totalReviews,
        } : null,
        description: service.descripcion,
        price: service.precio ?? 0,
        priceType: service.tipoPrecio,
        image,
        featured: service.destacado,
        tags,
      };
    });

    return NextResponse.json(formattedServices);
  } catch (error: unknown) {
    logger.error('Error fetching marketplace services:', error);
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}
