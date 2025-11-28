import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');

    const where: any = {};
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;

    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        unit: {
          include: {
            building: true,
            tenant: true,
          },
        },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });

    return NextResponse.json(maintenanceRequests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: 'Error al obtener solicitudes de mantenimiento' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { unitId, titulo, descripcion, prioridad, estado, fechaProgramada, providerId, costoEstimado } = body;

    if (!unitId || !titulo || !descripcion) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        unitId,
        titulo,
        descripcion,
        prioridad: prioridad || 'media',
        estado: estado || 'pendiente',
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        providerId,
        costoEstimado: costoEstimado ? parseFloat(costoEstimado) : null,
      },
    });

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: 'Error al crear solicitud de mantenimiento' }, { status: 500 });
  }
}