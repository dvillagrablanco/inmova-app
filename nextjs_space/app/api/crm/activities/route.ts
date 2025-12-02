import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    console.error('Error al obtener actividades CRM:', error);
    return NextResponse.json(
      { error: 'Error al obtener actividades' },
      { status: 500 }
    );
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
    const { leadId, tipo, asunto, descripcion, fecha, duracion, resultado, proximaAccion, completada } = body;

    if (!leadId || !tipo || !asunto || !fecha) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el lead existe
    const lead = await prisma.crmLead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      );
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
    console.error('Error al crear actividad CRM:', error);
    return NextResponse.json(
      { error: 'Error al crear actividad' },
      { status: 500 }
    );
  }
}
