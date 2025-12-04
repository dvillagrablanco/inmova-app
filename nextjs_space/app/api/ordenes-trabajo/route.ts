import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/ordenes-trabajo - Obtener órdenes de trabajo
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const estado = searchParams.get('estado');
    const buildingId = searchParams.get('buildingId');

    const ordenes = await prisma.providerWorkOrder.findMany({
      where: {
        companyId: session.user.companyId,
        ...(providerId && { providerId }),
        ...(estado && { estado: estado as any }),
        ...(buildingId && { buildingId }),
      },
      include: {
        provider: { select: { nombre: true, telefono: true, email: true } },
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
        maintenance: { select: { titulo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    logger.error('Error fetching ordenes:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes de trabajo' },
      { status: 500 }
    );
  }
}

// POST /api/ordenes-trabajo - Crear orden de trabajo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      providerId,
      buildingId,
      unitId,
      maintenanceRequestId,
      titulo,
      descripcion,
      tipo,
      estado,
      prioridad,
      fechaAsignacion,
      fechaEstimada,
      presupuestoInicial,
      costoTotal,
      notas,
    } = body;

    // Validaciones básicas
    if (!titulo || !providerId || !buildingId) {
      return NextResponse.json(
        { error: 'Título, proveedor y edificio son requeridos' },
        { status: 400 }
      );
    }

    const orden = await prisma.providerWorkOrder.create({
      data: {
        companyId: session.user.companyId,
        providerId,
        buildingId,
        unitId: unitId || null,
        maintenanceRequestId: maintenanceRequestId || null,
        titulo,
        descripcion: descripcion || '',
        tipo: tipo || 'correctivo',
        estado: estado || 'asignada',
        prioridad: prioridad || 'media',
        fechaAsignacion: fechaAsignacion ? new Date(fechaAsignacion) : new Date(),
        fechaEstimada: fechaEstimada ? new Date(fechaEstimada) : null,
        presupuestoInicial: presupuestoInicial || null,
        costoTotal: costoTotal || null,
        fotosAntes: [],
        fotosDespues: [],
        asignadoPor: session.user.id!,
      },
      include: {
        provider: true,
        building: true,
        unit: true,
      },
    });

    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    logger.error('Error creating orden:', error);
    return NextResponse.json(
      { error: 'Error al crear orden de trabajo' },
      { status: 500 }
    );
  }
}
