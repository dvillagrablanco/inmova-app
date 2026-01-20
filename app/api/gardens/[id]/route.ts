import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Reference to shared storage
let urbanGardens: any[] = [];

function getGardens() {
  return urbanGardens;
}

function setGardens(gardens: any[]) {
  urbanGardens = gardens;
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

    const garden = getGardens().find(
      (g) => g.id === id && g.companyId === companyId
    );

    if (!garden) {
      return NextResponse.json({ error: 'Huerto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(garden);
  } catch (error) {
    logger.error('[Gardens API] Error fetching garden:', error);
    return NextResponse.json({ error: 'Error al obtener huerto' }, { status: 500 });
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

    const gardens = getGardens();
    const index = gardens.findIndex(
      (g) => g.id === id && g.companyId === companyId
    );

    if (index === -1) {
      return NextResponse.json({ error: 'Huerto no encontrado' }, { status: 404 });
    }

    const updatedGarden = {
      ...gardens[index],
      nombre: body.nombre || gardens[index].nombre,
      ubicacion: body.ubicacion || gardens[index].ubicacion,
      superficie: parseFloat(body.superficie) || gardens[index].superficie,
      numeroParcelas: parseInt(body.numeroParcelas) || gardens[index].numeroParcelas,
      precioParcela: parseFloat(body.precioParcela) || gardens[index].precioParcela,
      tipoRiego: body.tipoRiego || gardens[index].tipoRiego,
      estado: body.estado || gardens[index].estado,
      buildingId: body.buildingId !== undefined ? body.buildingId : gardens[index].buildingId,
      amenities: body.amenities || gardens[index].amenities,
      descripcion: body.descripcion !== undefined ? body.descripcion : gardens[index].descripcion,
      updatedAt: new Date().toISOString(),
    };

    gardens[index] = updatedGarden;
    setGardens(gardens);

    return NextResponse.json(updatedGarden);
  } catch (error) {
    logger.error('[Gardens API] Error updating garden:', error);
    return NextResponse.json({ error: 'Error al actualizar huerto' }, { status: 500 });
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

    const gardens = getGardens();
    const index = gardens.findIndex(
      (g) => g.id === id && g.companyId === companyId
    );

    if (index === -1) {
      return NextResponse.json({ error: 'Huerto no encontrado' }, { status: 404 });
    }

    gardens.splice(index, 1);
    setGardens(gardens);

    return NextResponse.json({ success: true, message: 'Huerto eliminado' });
  } catch (error) {
    logger.error('[Gardens API] Error deleting garden:', error);
    return NextResponse.json({ error: 'Error al eliminar huerto' }, { status: 500 });
  }
}
