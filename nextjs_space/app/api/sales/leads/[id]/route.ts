import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/sales/leads/[id] - Obtener un lead específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const lead = await prisma.salesLead.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            telefono: true,
          },
        },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    logError('Error en GET /api/sales/leads/[id]', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener lead' },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/leads/[id] - Actualizar un lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const data = await request.json();

    // Verificar que el lead existe y pertenece a la company
    const existingLead = await prisma.salesLead.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    const updateData: any = {};

    // Campos actualizables
    if (data.nombreCompleto !== undefined) updateData.nombreCompleto = data.nombreCompleto;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.empresa !== undefined) updateData.empresa = data.empresa;
    if (data.cargo !== undefined) updateData.cargo = data.cargo;
    if (data.presupuestoMensual !== undefined)
      updateData.presupuestoMensual = data.presupuestoMensual;
    if (data.propiedadesEstimadas !== undefined)
      updateData.propiedadesEstimadas = data.propiedadesEstimadas;
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.prioridad !== undefined) updateData.prioridad = data.prioridad;
    if (data.fuente !== undefined) updateData.fuente = data.fuente;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.probabilidadCierre !== undefined)
      updateData.probabilidadCierre = data.probabilidadCierre;

    // Actualizar fechas según el estado
    if (data.estado) {
      if (data.estado === 'CONTACTADO' && !existingLead.fechaContacto) {
        updateData.fechaContacto = new Date();
      } else if (data.estado === 'CERRADO_GANADO' && !existingLead.fechaConversion) {
        updateData.fechaConversion = new Date();
        updateData.convertido = true;
      } else if (data.estado === 'CERRADO_PERDIDO') {
        updateData.convertido = false;
      }
    }

    const lead = await prisma.salesLead.update({
      where: { id: params.id },
      data: updateData,
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    logger.info(`Lead actualizado: ${lead.id}`);

    return NextResponse.json(lead);
  } catch (error) {
    logError('Error en PATCH /api/sales/leads/[id]', error as Error);
    return NextResponse.json(
      { error: 'Error al actualizar lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/leads/[id] - Eliminar un lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el lead existe y pertenece a la company
    const existingLead = await prisma.salesLead.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    await prisma.salesLead.delete({
      where: { id: params.id },
    });

    logger.info(`Lead eliminado: ${params.id}`);

    return NextResponse.json({ message: 'Lead eliminado correctamente' });
  } catch (error) {
    logError('Error en DELETE /api/sales/leads/[id]', error as Error);
    return NextResponse.json(
      { error: 'Error al eliminar lead' },
      { status: 500 }
    );
  }
}
