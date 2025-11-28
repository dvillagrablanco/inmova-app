import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');
    const buildingId = searchParams.get('buildingId');
    const unitId = searchParams.get('unitId');

    const where: any = {
      companyId: user.companyId,
    };

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (buildingId) where.buildingId = buildingId;
    if (unitId) where.unitId = unitId;

    const inspections = await prisma.legalInspection.findMany({
      where,
      orderBy: { fechaProgramada: 'desc' },
    });

    return NextResponse.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json(
      { error: 'Error al obtener inspecciones' },
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

    const inspection = await prisma.legalInspection.create({
      data: {
        companyId: user.companyId,
        unitId: body.unitId,
        buildingId: body.buildingId,
        contractId: body.contractId,
        tenantId: body.tenantId,
        tipo: body.tipo,
        estado: body.estado || 'programada',
        fechaProgramada: new Date(body.fechaProgramada),
        inspector: body.inspector,
        checklist: body.checklist || JSON.stringify({}),
        observaciones: body.observaciones,
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    console.error('Error creating inspection:', error);
    return NextResponse.json(
      { error: 'Error al crear inspección' },
      { status: 500 }
    );
  }
}
