import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { addDays } from 'date-fns';

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
    const buildingId = searchParams.get('buildingId');

    const where: any = {
      companyId: user.companyId,
    };

    if (estado) where.estado = estado;
    if (buildingId) where.buildingId = buildingId;

    const policies = await prisma.insurancePolicy.findMany({
      where,
      orderBy: { fechaVencimiento: 'asc' },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error('Error fetching insurance policies:', error);
    return NextResponse.json(
      { error: 'Error al obtener pólizas de seguro' },
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

    const policy = await prisma.insurancePolicy.create({
      data: {
        companyId: user.companyId,
        buildingId: body.buildingId,
        tipoSeguro: body.tipoSeguro,
        numeroPoliza: body.numeroPoliza,
        aseguradora: body.aseguradora,
        coberturas: body.coberturas || [],
        montoCobertura: parseFloat(body.montoCobertura),
        primaAnual: parseFloat(body.primaAnual),
        deducible: body.deducible ? parseFloat(body.deducible) : null,
        fechaInicio: new Date(body.fechaInicio),
        fechaVencimiento: new Date(body.fechaVencimiento),
        estado: body.estado || 'activa',
        agente: body.agente,
        telefonoAgente: body.telefonoAgente,
        emailAgente: body.emailAgente,
        notas: body.notas,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance policy:', error);
    return NextResponse.json(
      { error: 'Error al crear póliza de seguro' },
      { status: 500 }
    );
  }
}
