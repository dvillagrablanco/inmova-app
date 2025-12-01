import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/incidencias - Obtener incidencias
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const prioridad = searchParams.get('prioridad');

    const incidencias = await prisma.communityIncident.findMany({
      where: {
        companyId: session.user.companyId,
        ...(buildingId && { buildingId }),
        ...(estado && { estado: estado as any }),
        ...(tipo && { tipo: tipo as any }),
        ...(prioridad && { prioridad: prioridad as any }),
      },
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(incidencias);
  } catch (error) {
    console.error('Error fetching incidencias:', error);
    return NextResponse.json(
      { error: 'Error al obtener incidencias' },
      { status: 500 }
    );
  }
}

// POST /api/incidencias - Crear incidencia
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      buildingId,
      titulo,
      descripcion,
      tipo,
      prioridad,
      unitId,
      ubicacion,
      fotos,
      reportedBy,
      reporterType,
    } = body;

    const incidencia = await prisma.communityIncident.create({
      data: {
        companyId: session.user.companyId,
        buildingId,
        titulo,
        descripcion,
        tipo,
        prioridad: prioridad || 'media',
        unitId,
        ubicacion,
        fotos: fotos || [],
        reportedBy: reportedBy || session.user.id!,
        reporterType: reporterType || 'user',
      },
      include: {
        building: true,
        unit: true,
      },
    });

    return NextResponse.json(incidencia, { status: 201 });
  } catch (error) {
    console.error('Error creating incidencia:', error);
    return NextResponse.json(
      { error: 'Error al crear incidencia' },
      { status: 500 }
    );
  }
}