import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const candidates = await prisma.candidate.findMany({
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        visits: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Error al obtener candidatos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      unitId,
      nombreCompleto,
      dni,
      email,
      telefono,
      fechaNacimiento,
      situacionLaboral,
      ingresosMensuales,
      notas,
    } = body;

    // Calculate scoring based on income and employment
    let scoring = 50;
    if (ingresosMensuales) {
      const unit = await prisma.unit.findUnique({ where: { id: unitId } });
      if (unit) {
        const ratio = unit.rentaMensual / ingresosMensuales;
        if (ratio < 0.3) scoring = 90;
        else if (ratio < 0.4) scoring = 70;
        else if (ratio < 0.5) scoring = 50;
        else scoring = 30;
      }
    }

    const candidate = await prisma.candidate.create({
      data: {
        unitId,
        nombreCompleto,
        dni,
        email,
        telefono,
        fechaNacimiento: new Date(fechaNacimiento),
        situacionLaboral,
        ingresosMensuales: ingresosMensuales ? parseFloat(ingresosMensuales) : null,
        scoring,
        notas,
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Error al crear candidato' }, { status: 500 });
  }
}
