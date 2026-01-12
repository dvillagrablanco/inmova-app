import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/marketplace/quotes/[id] - Obtener cotización específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const quote = await prisma.serviceQuote.findFirst({
      where: {
        id: params.id,
        companyId: session?.user?.companyId,
      },
      include: {
        provider: true,
        building: true,
        unit: true,
        serviceJobs: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    logger.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    );
  }
}

// PATCH /api/marketplace/quotes/[id] - Actualizar cotización
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Verificar que la cotización existe y pertenece a la compañía
    const existingQuote = await prisma.serviceQuote.findFirst({
      where: {
        id: params.id,
        companyId: session?.user?.companyId,
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Solo actualizar campos proporcionados
    if (body.titulo !== undefined) updateData.titulo = body.titulo;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.servicioRequerido !== undefined) updateData.servicioRequerido = body.servicioRequerido;
    if (body.urgencia !== undefined) updateData.urgencia = body.urgencia;
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.fechaRespuesta !== undefined) updateData.fechaRespuesta = body.fechaRespuesta ? new Date(body.fechaRespuesta) : null;
    if (body.montoCotizado !== undefined) updateData.montoCotizado = body.montoCotizado ? parseFloat(body.montoCotizado) : null;
    if (body.tiempoEstimado !== undefined) updateData.tiempoEstimado = body.tiempoEstimado;
    if (body.notasProveedor !== undefined) updateData.notasProveedor = body.notasProveedor;
    if (body.validezCotizacion !== undefined) updateData.validezCotizacion = body.validezCotizacion ? new Date(body.validezCotizacion) : null;
    if (body.buildingId !== undefined) updateData.buildingId = body.buildingId || null;
    if (body.unitId !== undefined) updateData.unitId = body.unitId || null;

    const quote = await prisma.serviceQuote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        provider: true,
        building: true,
        unit: true,
        serviceJobs: true,
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    logger.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace/quotes/[id] - Eliminar cotización
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la cotización existe y pertenece a la compañía
    const existingQuote = await prisma.serviceQuote.findFirst({
      where: {
        id: params.id,
        companyId: session?.user?.companyId,
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    await prisma.serviceQuote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Cotización eliminada correctamente' });
  } catch (error) {
    logger.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cotización' },
      { status: 500 }
    );
  }
}
