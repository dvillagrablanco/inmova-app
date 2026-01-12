'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener visitas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Por ahora retornar array vacío - datos reales vendrán de la BD
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva visita
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyAddress,
      visitorName,
      visitorPhone,
      visitorEmail,
      scheduledDate,
      scheduledTime,
      notes,
      agentName,
    } = body;

    if (!propertyAddress || !visitorName || !visitorPhone || !scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Crear visita simulada (en producción usar Prisma)
    const newVisit = {
      id: `visit_${Date.now()}`,
      propertyAddress,
      propertyId: 'temp_id',
      visitorName,
      visitorPhone,
      visitorEmail,
      scheduledDate,
      scheduledTime,
      status: 'scheduled',
      notes,
      agentName,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newVisit, { status: 201 });
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
