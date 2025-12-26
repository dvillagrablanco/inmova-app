import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  calculateLeadScoring,
  calculateProbabilidadCierre,
  determinarTemperatura,
} from '@/lib/crm-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET - Obtener un lead específico
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        actividades: {
          orderBy: { fecha: 'desc' },
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documentos: {
          orderBy: { createdAt: 'desc' },
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        asignadoUsuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    logger.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Error al obtener lead' }, { status: 500 });
  }
}

// PUT - Actualizar un lead
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();

    // Verificar que el lead pertenece a la compañía del usuario
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Recalcular scoring si cambian datos relevantes
    const nuevaPuntuacion =
      body.presupuestoMensual || body.urgencia || body.verticalesInteres
        ? calculateLeadScoring(body)
        : existingLead.puntuacion;

    const nuevaProbabilidad =
      body.presupuestoMensual || body.urgencia
        ? calculateProbabilidadCierre(body)
        : existingLead.probabilidadCierre;

    const nuevaTemperatura = determinarTemperatura(nuevaPuntuacion);

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        nombre: body.nombre,
        apellidos: body.apellidos,
        email: body.email,
        telefono: body.telefono,
        empresa: body.empresa,
        cargo: body.cargo,
        direccion: body.direccion,
        ciudad: body.ciudad,
        codigoPostal: body.codigoPostal,
        pais: body.pais,
        estado: body.estado,
        etapa: body.etapa,
        temperatura: nuevaTemperatura,
        puntuacion: nuevaPuntuacion,
        tipoNegocio: body.tipoNegocio,
        verticalesInteres: body.verticalesInteres,
        numeroUnidades: body.numeroUnidades ? parseInt(body.numeroUnidades) : null,
        presupuestoMensual: body.presupuestoMensual ? parseFloat(body.presupuestoMensual) : null,
        urgencia: body.urgencia,
        notas: body.notas,
        motivoPerdida: body.motivoPerdida,
        probabilidadCierre: nuevaProbabilidad,
        fechaEstimadaCierre: body.fechaEstimadaCierre ? new Date(body.fechaEstimadaCierre) : null,
        asignadoA: body.asignadoA,
        ultimoContacto: body.ultimoContacto ? new Date(body.ultimoContacto) : null,
        proximoSeguimiento: body.proximoSeguimiento ? new Date(body.proximoSeguimiento) : null,
      },
      include: {
        actividades: {
          orderBy: { fecha: 'desc' },
        },
        asignadoUsuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    logger.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Error al actualizar lead' }, { status: 500 });
  }
}

// DELETE - Eliminar un lead
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el lead pertenece a la compañía del usuario
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    await prisma.lead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Lead eliminado correctamente' });
  } catch (error) {
    logger.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Error al eliminar lead' }, { status: 500 });
  }
}
