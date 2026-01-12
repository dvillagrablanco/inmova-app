import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PATCH /api/ordenes-trabajo/[id] - Actualizar orden de trabajo
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
    const {
      titulo,
      descripcion,
      tipo,
      estado,
      prioridad,
      providerId,
      buildingId,
      unitId,
      fechaAsignacion,
      fechaEstimada,
      fechaInicio,
      fechaCompletado,
      presupuestoInicial,
      costoTotal,
      notas,
      fotosAntes,
      fotosDespues,
      materialesUsados,
      horasTrabajadas,
      costoMateriales,
      costoManoObra,
      firmadoPor,
      firmaDigital,
      valoracion,
      comentarios,
    } = body;

    const updateData: any = {};
    
    // Campos básicos editables
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (prioridad !== undefined) updateData.prioridad = prioridad;
    if (providerId !== undefined) updateData.providerId = providerId;
    if (buildingId !== undefined) updateData.buildingId = buildingId;
    if (unitId !== undefined) updateData.unitId = unitId;
    if (notas !== undefined) updateData.notas = notas;
    
    // Fechas
    if (fechaAsignacion) updateData.fechaAsignacion = new Date(fechaAsignacion);
    if (fechaEstimada) updateData.fechaEstimada = new Date(fechaEstimada);
    if (fechaInicio) updateData.fechaInicio = new Date(fechaInicio);
    if (fechaCompletado) updateData.fechaCompletado = new Date(fechaCompletado);
    
    // Estado con lógica especial
    if (estado) {
      updateData.estado = estado;
      if (estado === 'completada' && !fechaCompletado) {
        updateData.fechaCompletado = new Date();
        updateData.fechaFirma = new Date();
      }
    }
    
    // Costos
    if (presupuestoInicial !== undefined) updateData.presupuestoInicial = presupuestoInicial;
    if (costoTotal !== undefined) updateData.costoTotal = costoTotal;
    if (costoMateriales !== undefined) updateData.costoMateriales = costoMateriales;
    if (costoManoObra !== undefined) updateData.costoManoObra = costoManoObra;
    
    // Otros campos
    if (fotosAntes) updateData.fotosAntes = fotosAntes;
    if (fotosDespues) updateData.fotosDespues = fotosDespues;
    if (materialesUsados) updateData.materialesUsados = materialesUsados;
    if (horasTrabajadas !== undefined) updateData.horasTrabajadas = horasTrabajadas;
    if (firmadoPor) updateData.firmadoPor = firmadoPor;
    if (firmaDigital) updateData.firmaDigital = firmaDigital;
    if (valoracion !== undefined) updateData.valoracion = valoracion;
    if (comentarios) updateData.comentarios = comentarios;

    const orden = await prisma.providerWorkOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        provider: true,
        building: true,
        unit: true,
      },
    });

    return NextResponse.json(orden);
  } catch (error) {
    logger.error('Error updating orden:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de trabajo' },
      { status: 500 }
    );
  }
}
