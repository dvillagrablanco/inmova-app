import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { detectAbnormalConsumption } from '@/lib/energy-service';
import { format } from 'date-fns';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/energy/readings - Obtener lecturas de energía
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const buildingId = searchParams.get('buildingId');
    const unitId = searchParams.get('unitId');
    const periodo = searchParams.get('periodo');

    const readings = await prisma.energyReading.findMany({
      where: {
        companyId: session.user.companyId,
        ...(tipo && { tipo: tipo as any }),
        ...(buildingId && { buildingId }),
        ...(unitId && { unitId }),
        ...(periodo && { periodo }),
      },
      include: {
        building: true,
        unit: true,
      },
      orderBy: { fechaLectura: 'desc' },
      take: 100,
    });

    return NextResponse.json(readings);
  } catch (error) {
    console.error('Error fetching energy readings:', error);
    return NextResponse.json(
      { error: 'Error al obtener lecturas' },
      { status: 500 }
    );
  }
}

// POST /api/energy/readings - Crear lectura de energía
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      buildingId,
      unitId,
      tipo,
      lecturaAnterior,
      lecturaActual,
      fechaLectura,
      costo,
      notas,
    } = body;

    const lectura = parseFloat(lecturaActual);
    const anterior = lecturaAnterior ? parseFloat(lecturaAnterior) : 0;
    const consumo = lectura - anterior;

    const fecha = fechaLectura ? new Date(fechaLectura) : new Date();
    const periodo = format(fecha, 'yyyy-MM');

    const reading = await prisma.energyReading.create({
      data: {
        companyId: session.user.companyId,
        buildingId: buildingId || null,
        unitId: unitId || null,
        tipo,
        lecturaAnterior: anterior || null,
        lecturaActual: lectura,
        consumo,
        fechaLectura: fecha,
        periodo,
        costo: costo ? parseFloat(costo) : null,
        registradoPor: session.user.email || '',
        notas: notas || null,
      },
      include: {
        building: true,
        unit: true,
      },
    });

    // Detectar consumo anormal
    try {
      await detectAbnormalConsumption(session.user.companyId, reading.id);
    } catch (error) {
      console.error('Error detecting abnormal consumption:', error);
      // No fallar la creación de la lectura si falla la detección
    }

    return NextResponse.json(reading, { status: 201 });
  } catch (error) {
    console.error('Error creating energy reading:', error);
    return NextResponse.json(
      { error: 'Error al crear lectura' },
      { status: 500 }
    );
  }
}
