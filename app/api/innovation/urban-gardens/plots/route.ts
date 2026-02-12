/**
 * API: Garden Plots (Parcelas de Huertos)
 * GET - Listar parcelas
 * POST - Crear nueva parcela
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener gardenId del query string (opcional)
    const { searchParams } = new URL(request.url);
    const gardenId = searchParams.get('gardenId');

    // Buscar todas las parcelas de huertos de la empresa
    const plots = await prisma.gardenPlot.findMany({
      where: {
        garden: {
          companyId: session.user.companyId,
          ...(gardenId && { id: gardenId }),
        },
      },
      include: {
        garden: {
          select: {
            id: true,
            nombre: true,
          },
        },
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
          },
        },
      },
      orderBy: [
        { gardenId: 'asc' },
        { numeroParcela: 'asc' },
      ],
    });

    // Formatear respuesta
    const formattedPlots = plots.map((plot) => ({
      id: plot.id,
      gardenId: plot.gardenId,
      gardenName: plot.garden.nombre,
      numero: plot.numeroParcela,
      superficie: plot.metrosCuadrados,
      estado: plot.estado,
      arrendatario: plot.tenant?.nombreCompleto,
      arrendatarioEmail: plot.tenant?.email,
      fechaInicio: plot.reservadaDesde,
      fechaFin: plot.reservadaHasta,
      cultivoActual: plot.cultivos ?? null,
    }));

    return NextResponse.json(formattedPlots);
  } catch (error: any) {
    logger.error('[GardenPlots GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener parcelas', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { gardenId, numero, superficie, estado, cultivoActual, tenantId, fechaInicio, fechaFin } = body;

    // Validaciones básicas
    if (!gardenId || !numero || !superficie) {
      return NextResponse.json(
        { error: 'Campos requeridos: gardenId, numero, superficie' },
        { status: 400 }
      );
    }

    // Verificar que el huerto pertenece a la empresa
    const garden = await prisma.urbanGarden.findFirst({
      where: {
        id: gardenId,
        companyId: session.user.companyId,
      },
    });

    if (!garden) {
      return NextResponse.json({ error: 'Huerto no encontrado' }, { status: 404 });
    }

    // Crear parcela
    const plot = await prisma.gardenPlot.create({
      data: {
        gardenId,
        numeroParcela: numero,
        metrosCuadrados: Number(superficie),
        estado: estado ? String(estado).toLowerCase() : 'disponible',
        cultivos: cultivoActual ?? undefined,
        tenantId,
        reservadaDesde: fechaInicio ? new Date(fechaInicio) : null,
        reservadaHasta: fechaFin ? new Date(fechaFin) : null,
      },
      include: {
        garden: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...plot,
        gardenName: plot.garden.nombre,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('[GardenPlots POST] Error:', error);
    return NextResponse.json({ error: 'Error al crear parcela', details: error.message }, { status: 500 });
  }
}
