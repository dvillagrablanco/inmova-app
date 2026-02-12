/**
 * API de Reseñas para Portal de Proveedores
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET() {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ success: true, data: { reviews: [], ratingDistribution: [] } });
    }

    // Buscar reviews del proveedor por email del usuario
    const reviews = await prisma.review.findMany({
      where: {
        OR: [
          { entityId: userEmail },
          { company: { users: { some: { email: userEmail } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mapped = reviews.map((r: any) => ({
      id: r.id,
      clienteNombre: r.authorName || 'Anónimo',
      servicio: r.title || '',
      puntuacion: r.rating || 0,
      comentario: r.comment || '',
      fecha: r.createdAt?.toISOString().split('T')[0] || '',
      respondida: !!r.response,
      respuesta: r.response || undefined,
      fechaRespuesta: r.respondedAt?.toISOString().split('T')[0] || undefined,
      util: r.helpfulCount || 0,
      noUtil: r.notHelpfulCount || 0,
    }));

    // Calcular distribución de ratings
    const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: mapped.filter(r => r.puntuacion === stars).length,
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: mapped,
        ratingDistribution,
      },
    });
  } catch (error) {
    logger.error('[API Error] Reviews:', error);
    return NextResponse.json({ error: 'Error obteniendo reseñas' }, { status: 500 });
  }
}
