/**
 * API para Valoraciones y Feedback del Servicio - Portal Inquilino
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal-inquilino/ratings
 * Obtiene las valoraciones del inquilino autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar el inquilino
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Obtener todas las valoraciones del inquilino
    const ratings = await prisma.serviceRating.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ratings });
  } catch (error: any) {
    logger.error('Error al obtener valoraciones:', error);
    return NextResponse.json({ error: 'Error al obtener valoraciones' }, { status: 500 });
  }
}

/**
 * POST /api/portal-inquilino/ratings
 * Crea una nueva valoración
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, puntuacion, comentario } = body;

    // Validaciones
    if (!tipo || !puntuacion) {
      return NextResponse.json({ error: 'Tipo y puntuación son requeridos' }, { status: 400 });
    }

    if (puntuacion < 1 || puntuacion > 5) {
      return NextResponse.json({ error: 'La puntuación debe estar entre 1 y 5' }, { status: 400 });
    }

    // Buscar el inquilino
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
      include: {
        contracts: {
          where: { estado: 'activo' },
          include: {
            unit: {
              include: {
                building: {
                  include: {
                    company: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Obtener la compañía del contrato activo
    const companyId = tenant.contracts[0]?.unit?.building?.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: 'No se encontró una compañía asociada' }, { status: 404 });
    }

    // Crear la valoración
    const rating = await prisma.serviceRating.create({
      data: {
        companyId,
        tenantId: tenant.id,
        tipo,
        puntuacion,
        comentario: comentario || null,
        visible: true,
      },
    });

    return NextResponse.json({ rating }, { status: 201 });
  } catch (error: any) {
    logger.error('Error al crear valoración:', error);
    return NextResponse.json({ error: 'Error al crear valoración' }, { status: 500 });
  }
}
