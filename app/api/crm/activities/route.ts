import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para actividad CRM
const createCRMActivitySchema = z.object({
  leadId: z.string().uuid({ message: 'ID de lead inválido' }),
  tipo: z.enum(['llamada', 'email', 'reunion', 'visita', 'tarea', 'nota'], {
    message: 'Tipo de actividad inválido',
  }),
  asunto: z.string().min(1, { message: 'El asunto es requerido' }),
  descripcion: z.string().optional(),
  fecha: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  duracion: z.number().int().positive().optional(),
  resultado: z.string().optional(),
  proximaAccion: z.string().optional(),
  completada: z.boolean().optional(),
});

/**
 * GET /api/crm/activities
 * Obtiene todas las actividades CRM
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    const where: any = {};

    if (leadId) {
      where.leadId = leadId;
    }

    const activities = await prisma.crmActivity.findMany({
      where,
      include: {
        lead: {
          select: {
            nombreCompleto: true,
            email: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    logger.error('Error al obtener actividades CRM:', error);
    return NextResponse.json({ error: 'Error al obtener actividades' }, { status: 500 });
  }
}

/**
 * POST /api/crm/activities
 * Crea una nueva actividad CRM
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validación con Zod
    const validationResult = createCRMActivitySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error creating CRM activity:', { errors });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
    }

    const {
      leadId,
      tipo,
      asunto,
      descripcion,
      fecha,
      duracion,
      resultado,
      proximaAccion,
      completada,
    } = validationResult.data;

    // Verificar que el lead existe
    const lead = await prisma.crmLead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    const activity = await prisma.crmActivity.create({
      data: {
        leadId,
        tipo,
        asunto,
        descripcion,
        fecha: new Date(fecha),
        duracion,
        resultado,
        proximaAccion,
        completada: completada || false,
        creadoPor: session.user.id,
      },
      include: {
        lead: {
          select: {
            nombreCompleto: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    logger.error('Error al crear actividad CRM:', error);
    return NextResponse.json({ error: 'Error al crear actividad' }, { status: 500 });
  }
}
