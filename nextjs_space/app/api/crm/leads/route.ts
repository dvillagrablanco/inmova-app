import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateLeadScoring, calculateProbabilidadCierre } from '@/lib/crm-service';

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
    const estado = searchParams.get('estado');
    const asignadoA = searchParams.get('asignadoA');

    const where: any = {
      companyId: user.companyId,
    };

    if (estado) where.estado = estado;
    if (asignadoA) where.asignadoA = asignadoA;

    const leads = await prisma.crmLead.findMany({
      where,
      include: {
        activities: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
      },
      orderBy: [
        { scoring: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Error al obtener leads' },
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

    const lead = await prisma.crmLead.create({
      data: {
        companyId: user.companyId,
        nombreCompleto: body.nombreCompleto,
        email: body.email,
        telefono: body.telefono,
        unitId: body.unitId,
        estado: body.estado || 'nuevo',
        fuente: body.fuente || 'web',
        presupuesto: body.presupuesto ? parseFloat(body.presupuesto) : null,
        fechaMudanza: body.fechaMudanza ? new Date(body.fechaMudanza) : null,
        necesidades: body.necesidades,
        notas: body.notas,
        asignadoA: body.asignadoA || user.id,
      },
    });

    // Calcular scoring inicial
    await calculateLeadScoring(lead.id);
    await calculateProbabilidadCierre(lead.id);

    // Obtener lead actualizado
    const updatedLead = await prisma.crmLead.findUnique({
      where: { id: lead.id },
      include: {
        activities: true,
      },
    });

    return NextResponse.json(updatedLead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Error al crear lead' },
      { status: 500 }
    );
  }
}
