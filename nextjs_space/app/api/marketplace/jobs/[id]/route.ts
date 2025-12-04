import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/marketplace/jobs/[id] - Obtener trabajo específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const job = await prisma.serviceJob.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        provider: true,
        building: true,
        unit: true,
        quote: true,
        reviews: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Trabajo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    logger.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Error al obtener trabajo' },
      { status: 500 }
    );
  }
}

// PATCH /api/marketplace/jobs/[id] - Actualizar trabajo
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

    // Verificar que el trabajo existe y pertenece a la compañía
    const existingJob = await prisma.serviceJob.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Trabajo no encontrado' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Solo actualizar campos proporcionados
    if (body.titulo !== undefined) updateData.titulo = body.titulo;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.fechaInicio !== undefined) updateData.fechaInicio = new Date(body.fechaInicio);
    if (body.fechaFin !== undefined) updateData.fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;
    if (body.montoTotal !== undefined) updateData.montoTotal = parseFloat(body.montoTotal);
    if (body.montoPagado !== undefined) updateData.montoPagado = parseFloat(body.montoPagado);
    if (body.garantiaMeses !== undefined) updateData.garantiaMeses = body.garantiaMeses;
    if (body.notasTrabajo !== undefined) updateData.notasTrabajo = body.notasTrabajo;
    if (body.resultadoTrabajo !== undefined) updateData.resultadoTrabajo = body.resultadoTrabajo;
    if (body.buildingId !== undefined) updateData.buildingId = body.buildingId || null;
    if (body.unitId !== undefined) updateData.unitId = body.unitId || null;

    const job = await prisma.serviceJob.update({
      where: { id: params.id },
      data: updateData,
      include: {
        provider: true,
        building: true,
        unit: true,
        quote: true,
        reviews: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    logger.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Error al actualizar trabajo' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace/jobs/[id] - Eliminar trabajo
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el trabajo existe y pertenece a la compañía
    const existingJob = await prisma.serviceJob.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Trabajo no encontrado' },
        { status: 404 }
      );
    }

    await prisma.serviceJob.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Trabajo eliminado correctamente' });
  } catch (error) {
    logger.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Error al eliminar trabajo' },
      { status: 500 }
    );
  }
}
