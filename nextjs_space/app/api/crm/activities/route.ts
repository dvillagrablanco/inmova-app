import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { autoProgressLeadStage } from '@/lib/crm-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId es requerido' },
        { status: 400 }
      );
    }

    const activities = await prisma.crmActivity.findMany({
      where: { leadId },
      orderBy: { fecha: 'desc' },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Error al obtener actividades' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const activity = await prisma.crmActivity.create({
      data: {
        leadId: body.leadId,
        tipo: body.tipo,
        asunto: body.asunto,
        descripcion: body.descripcion,
        fecha: new Date(body.fecha),
        duracion: body.duracion ? parseInt(body.duracion) : null,
        resultado: body.resultado,
        proximaAccion: body.proximaAccion,
        completada: body.completada || false,
        creadoPor: user.id,
      },
    });

    // Actualizar ultimoContacto del lead
    await prisma.crmLead.update({
      where: { id: body.leadId },
      data: {
        ultimoContacto: new Date(),
      },
    });

    // Intentar progresión automática de estado
    await autoProgressLeadStage(body.leadId);

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Error al crear actividad' },
      { status: 500 }
    );
  }
}
