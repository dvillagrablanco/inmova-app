export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
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
    const formattedServices = services.map((service) => ({
      id: service.id,
      name: service.nombre,
      category: service.categoria.toLowerCase(),
      provider: service.provider ? {
        id: service.provider.id,
        name: service.provider.nombre,
        verified: true,
        rating: service.provider.rating || 0,
        reviews: 0,
      } : null,
      description: service.descripcion,
      price: service.precio ?? 0,
      priceType: service.tipoPrecio || 'fixed',
      image: Array.isArray(service.imagenes) ? service.imagenes[0] || null : null,
      featured: service.destacado,
      tags: [],
    }));

    return NextResponse.json(formattedServices);
  } catch (error) {
    logger.error('Error fetching marketplace services:', error);
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}
