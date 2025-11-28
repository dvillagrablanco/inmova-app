import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activo = searchParams.get('activo');
    const upcoming = searchParams.get('upcoming') === 'true';

    const where: any = {};
    if (activo !== null) {
      where.activo = activo === 'true';
    }

    if (upcoming) {
      const now = new Date();
      const in30Days = new Date(now);
      in30Days.setDate(in30Days.getDate() + 30);
      where.proximaFecha = {
        gte: now,
        lte: in30Days,
      };
      where.activo = true;
    }

    const schedules = await prisma.maintenanceSchedule.findMany({
      where,
      include: {
        building: true,
        unit: {
          include: {
            building: true,
          },
        },
        provider: true,
      },
      orderBy: { proximaFecha: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    return NextResponse.json(
      { error: 'Error al obtener mantenimientos programados' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titulo,
      descripcion,
      tipo,
      buildingId,
      unitId,
      frecuencia,
      proximaFecha,
      diasAnticipacion,
      providerId,
      costoEstimado,
      notas,
    } = body;

    if (!titulo || !descripcion || !tipo || !frecuencia || !proximaFecha) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        titulo,
        descripcion,
        tipo,
        buildingId: buildingId || null,
        unitId: unitId || null,
        frecuencia,
        proximaFecha: new Date(proximaFecha),
        diasAnticipacion: diasAnticipacion || 15,
        activo: true,
        providerId: providerId || null,
        costoEstimado: costoEstimado ? parseFloat(costoEstimado) : null,
        notas: notas || null,
      },
      include: {
        building: true,
        unit: {
          include: {
            building: true,
          },
        },
        provider: true,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance schedule:', error);
    return NextResponse.json(
      { error: 'Error al crear mantenimiento programado' },
      { status: 500 }
    );
  }
}
