import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Reference to shared in-memory storage
let sportsFacilities: any[] = [];

function getFacilities() {
  return sportsFacilities;
}

function setFacilities(facilities: any[]) {
  sportsFacilities = facilities;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { id } = params;

    const facility = getFacilities().find(
      (f) => f.id === id && f.companyId === companyId
    );

    if (!facility) {
      return NextResponse.json({ error: 'Instalación no encontrada' }, { status: 404 });
    }

    return NextResponse.json(facility);
  } catch (error) {
    logger.error('[Sports API] Error fetching facility:', error);
    return NextResponse.json({ error: 'Error al obtener instalación' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { id } = params;
    const body = await request.json();

    const facilities = getFacilities();
    const index = facilities.findIndex(
      (f) => f.id === id && f.companyId === companyId
    );

    if (index === -1) {
      return NextResponse.json({ error: 'Instalación no encontrada' }, { status: 404 });
    }

    const updatedFacility = {
      ...facilities[index],
      nombre: body.nombre || facilities[index].nombre,
      tipo: body.tipo || facilities[index].tipo,
      ubicacion: body.ubicacion || facilities[index].ubicacion,
      capacidad: parseInt(body.capacidad) || facilities[index].capacidad,
      horarioApertura: body.horarioApertura || facilities[index].horarioApertura,
      horarioCierre: body.horarioCierre || facilities[index].horarioCierre,
      precioHora: parseFloat(body.precioHora) || facilities[index].precioHora,
      estado: body.estado || facilities[index].estado,
      buildingId: body.buildingId !== undefined ? body.buildingId : facilities[index].buildingId,
      equipamiento: body.equipamiento !== undefined ? body.equipamiento : facilities[index].equipamiento,
      notas: body.notas !== undefined ? body.notas : facilities[index].notas,
      updatedAt: new Date().toISOString(),
    };

    facilities[index] = updatedFacility;
    setFacilities(facilities);

    return NextResponse.json(updatedFacility);
  } catch (error) {
    logger.error('[Sports API] Error updating facility:', error);
    return NextResponse.json({ error: 'Error al actualizar instalación' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { id } = params;

    const facilities = getFacilities();
    const index = facilities.findIndex(
      (f) => f.id === id && f.companyId === companyId
    );

    if (index === -1) {
      return NextResponse.json({ error: 'Instalación no encontrada' }, { status: 404 });
    }

    facilities.splice(index, 1);
    setFacilities(facilities);

    return NextResponse.json({ success: true, message: 'Instalación eliminada' });
  } catch (error) {
    logger.error('[Sports API] Error deleting facility:', error);
    return NextResponse.json({ error: 'Error al eliminar instalación' }, { status: 500 });
  }
}
