/**
 * API: Garden Plots (Parcelas de Huertos)
 * GET - Listar parcelas
 * POST - Crear nueva parcela
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: [
        { gardenId: 'asc' },
        { numero: 'asc' },
      ],
    });

    // Formatear respuesta
    const formattedPlots = plots.map((plot) => ({
      id: plot.id,
      gardenId: plot.gardenId,
      gardenName: plot.garden.nombre,
      numero: plot.numero,
      superficie: plot.superficie,
      estado: plot.estado,
      arrendatario: plot.tenant?.nombre,
      arrendatarioEmail: plot.tenant?.email,
      fechaInicio: plot.fechaInicio,
      fechaFin: plot.fechaFin,
      cultivoActual: plot.cultivoActual,
    }));

    return NextResponse.json(formattedPlots);
  } catch (error: any) {
    console.error('[GardenPlots GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener parcelas', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
        numero,
        superficie: Number(superficie),
        estado: estado || 'DISPONIBLE',
        cultivoActual,
        tenantId,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
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
    console.error('[GardenPlots POST] Error:', error);
    return NextResponse.json({ error: 'Error al crear parcela', details: error.message }, { status: 500 });
  }
}
