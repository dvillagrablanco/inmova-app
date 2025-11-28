import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateLeadScoring, calculateProbabilidadCierre } from '@/lib/crm-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const lead = await prisma.crmLead.findUnique({
      where: { id: params.id },
      include: {
        activities: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Error al obtener lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    const updateData: any = {};
    if (body.nombreCompleto) updateData.nombreCompleto = body.nombreCompleto;
    if (body.email) updateData.email = body.email;
    if (body.telefono) updateData.telefono = body.telefono;
    if (body.unitId !== undefined) updateData.unitId = body.unitId;
    if (body.estado) updateData.estado = body.estado;
    if (body.fuente) updateData.fuente = body.fuente;
    if (body.presupuesto !== undefined) {
      updateData.presupuesto = body.presupuesto ? parseFloat(body.presupuesto) : null;
    }
    if (body.fechaMudanza !== undefined) {
      updateData.fechaMudanza = body.fechaMudanza ? new Date(body.fechaMudanza) : null;
    }
    if (body.necesidades !== undefined) updateData.necesidades = body.necesidades;
    if (body.notas !== undefined) updateData.notas = body.notas;
    if (body.asignadoA !== undefined) updateData.asignadoA = body.asignadoA;
    if (body.ultimoContacto !== undefined) {
      updateData.ultimoContacto = body.ultimoContacto ? new Date(body.ultimoContacto) : null;
    }
    if (body.proximoSeguimiento !== undefined) {
      updateData.proximoSeguimiento = body.proximoSeguimiento
        ? new Date(body.proximoSeguimiento)
        : null;
    }

    const lead = await prisma.crmLead.update({
      where: { id: params.id },
      data: updateData,
    });

    // Recalcular scoring y probabilidad
    await calculateLeadScoring(lead.id);
    await calculateProbabilidadCierre(lead.id);

    const updatedLead = await prisma.crmLead.findUnique({
      where: { id: lead.id },
      include: {
        activities: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Error al actualizar lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await prisma.crmLead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Lead eliminado' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Error al eliminar lead' },
      { status: 500 }
    );
  }
}
