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
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para actualizar lead CRM
const leadUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellidos: z.string().optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  codigoPostal: z.string().optional(),
  pais: z.string().optional(),
  estado: z
    .enum(['nuevo', 'contactado', 'calificado', 'visitado', 'propuesta_enviada', 'negociacion', 'ganado', 'perdido'])
    .optional(),
  etapa: z.string().optional(),
  tipoNegocio: z.enum(['propietario', 'inquilino', 'inversor', 'agente']).optional(),
  verticalesInteres: z.array(z.string()).optional(),
  numeroUnidades: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
    .refine((val) => val === undefined || val >= 0, {
      message: 'El número de unidades debe ser positivo',
    })
    .nullable(),
  presupuestoMensual: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val === undefined || val >= 0, {
      message: 'El presupuesto debe ser positivo',
    })
    .nullable(),
  urgencia: z.enum(['baja', 'media', 'alta']).optional(),
  notas: z.string().optional(),
  motivoPerdida: z.string().optional().nullable(),
  fechaEstimadaCierre: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .optional()
    .nullable(),
  asignadoA: z.string().uuid().optional().nullable(),
  ultimoContacto: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .optional()
    .nullable(),
  proximoSeguimiento: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .optional()
    .nullable(),
});

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

    // Validación con Zod
    const validationResult = leadUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error updating lead:', { errors, leadId: params.id });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
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

    const validatedBody = validationResult.data;

    const shouldRecalculateScoring =
      validatedBody.email !== undefined ||
      validatedBody.telefono !== undefined ||
      validatedBody.empresa !== undefined ||
      validatedBody.cargo !== undefined ||
      validatedBody.ciudad !== undefined ||
      validatedBody.presupuestoMensual !== undefined ||
      validatedBody.urgencia !== undefined;

    const scoringFactors = {
      hasEmail: !!(validatedBody.email ?? existingLead.email),
      hasTelefono: !!(validatedBody.telefono ?? existingLead.telefono),
      hasEmpresa: !!(validatedBody.empresa ?? existingLead.empresa),
      hasCargo: !!(validatedBody.cargo ?? existingLead.cargo),
      hasCiudad: !!(validatedBody.ciudad ?? existingLead.ciudad),
      hasPresupuesto: !!(validatedBody.presupuestoMensual ?? existingLead.presupuestoMensual),
      contactosRealizados: existingLead.numeroContactos ?? 0,
      urgencia: validatedBody.urgencia ?? existingLead.urgencia ?? undefined,
    };

    // Recalcular scoring si cambian datos relevantes
    const nuevaPuntuacion = shouldRecalculateScoring
      ? calculateLeadScoring(scoringFactors)
      : existingLead.puntuacion;

    const estadoActualizado = validatedBody.estado ?? existingLead.estado ?? undefined;

    const nuevaProbabilidad =
      shouldRecalculateScoring || validatedBody.estado !== undefined
        ? calculateProbabilidadCierre(nuevaPuntuacion, estadoActualizado)
        : existingLead.probabilidadCierre;

    const nuevaTemperatura = determinarTemperatura(nuevaPuntuacion);

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        nombre: validatedBody.nombre,
        apellidos: validatedBody.apellidos,
        email: validatedBody.email,
        telefono: validatedBody.telefono,
        empresa: validatedBody.empresa,
        cargo: validatedBody.cargo,
        direccion: validatedBody.direccion,
        ciudad: validatedBody.ciudad,
        codigoPostal: validatedBody.codigoPostal,
        pais: validatedBody.pais,
        estado: validatedBody.estado,
        etapa: validatedBody.etapa,
        temperatura: nuevaTemperatura,
        puntuacion: nuevaPuntuacion,
        tipoNegocio: validatedBody.tipoNegocio,
        verticalesInteres: validatedBody.verticalesInteres,
        numeroUnidades: validatedBody.numeroUnidades,
        presupuestoMensual: validatedBody.presupuestoMensual,
        urgencia: validatedBody.urgencia,
        notas: validatedBody.notas,
        motivoPerdida: validatedBody.motivoPerdida,
        probabilidadCierre: nuevaProbabilidad,
        fechaEstimadaCierre: validatedBody.fechaEstimadaCierre
          ? new Date(validatedBody.fechaEstimadaCierre)
          : null,
        asignadoA: validatedBody.asignadoA,
        ultimoContacto: validatedBody.ultimoContacto
          ? new Date(validatedBody.ultimoContacto)
          : null,
        proximoSeguimiento: validatedBody.proximoSeguimiento
          ? new Date(validatedBody.proximoSeguimiento)
          : null,
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
