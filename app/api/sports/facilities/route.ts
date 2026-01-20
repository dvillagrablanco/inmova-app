import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory storage for demo
let sportsFacilities: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const facilities = sportsFacilities.filter((f) => f.companyId === companyId);

    return NextResponse.json(facilities);
  } catch (error) {
    logger.error('[Sports API] Error fetching facilities:', error);
    return NextResponse.json({ error: 'Error al obtener instalaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    if (!body.nombre || !body.tipo || !body.ubicacion || !body.capacidad) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const newFacility = {
      id: `sports_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      nombre: body.nombre,
      tipo: body.tipo,
      ubicacion: body.ubicacion,
      capacidad: parseInt(body.capacidad),
      horarioApertura: body.horarioApertura || '08:00',
      horarioCierre: body.horarioCierre || '22:00',
      precioHora: parseFloat(body.precioHora) || 0,
      estado: body.estado || 'DISPONIBLE',
      buildingId: body.buildingId || null,
      buildingName: null,
      equipamiento: body.equipamiento || '',
      notas: body.notas || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sportsFacilities.push(newFacility);

    return NextResponse.json(newFacility, { status: 201 });
  } catch (error) {
    logger.error('[Sports API] Error creating facility:', error);
    return NextResponse.json({ error: 'Error al crear instalación' }, { status: 500 });
  }
}
