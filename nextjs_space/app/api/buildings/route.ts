import { NextRequest, NextResponse } from 'next/server';
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

    const buildings = await prisma.building.findMany({
      include: {
        units: {
          include: {
            tenant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics for each building
    const buildingsWithMetrics = buildings.map((building) => {
      const totalUnits = building.units.length;
      const occupiedUnits = building.units.filter((u) => u.estado === 'ocupada').length;
      const ocupacionPct = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      const ingresosMensuales = building.units
        .filter((u) => u.estado === 'ocupada')
        .reduce((sum, u) => sum + u.rentaMensual, 0);

      return {
        ...building,
        metrics: {
          totalUnits,
          occupiedUnits,
          ocupacionPct: Math.round(ocupacionPct * 10) / 10,
          ingresosMensuales: Math.round(ingresosMensuales * 100) / 100,
        },
      };
    });

    return NextResponse.json(buildingsWithMetrics);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return NextResponse.json({ error: 'Error al obtener edificios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, direccion, tipo, anoConstructor, numeroUnidades } = body;

    if (!nombre || !direccion || !tipo || !anoConstructor || !numeroUnidades) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const building = await prisma.building.create({
      data: {
        nombre,
        direccion,
        tipo,
        anoConstructor: parseInt(anoConstructor),
        numeroUnidades: parseInt(numeroUnidades),
      },
    });

    return NextResponse.json(building, { status: 201 });
  } catch (error) {
    console.error('Error creating building:', error);
    return NextResponse.json({ error: 'Error al crear edificio' }, { status: 500 });
  }
}