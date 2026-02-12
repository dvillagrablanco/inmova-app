/**
 * API de Planificación
 * 
 * Gestión de eventos programados
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET() {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const companyId = (session.user as any)?.companyId;
    if (!companyId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const events = await prisma.calendarEvent.findMany({
      where: { companyId },
      orderBy: { fechaInicio: 'asc' },
      take: 50,
    });

    const mapped = events.map((e: any) => ({
      id: e.id,
      titulo: e.titulo,
      tipo: e.tipo || 'otro',
      fecha: e.fechaInicio,
      hora: e.fechaInicio ? new Date(e.fechaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
      duracion: e.duracionMinutos || 30,
      descripcion: e.descripcion || '',
      propiedad: e.ubicacion || '',
      asignado: e.asignadoA || '',
      completado: e.estado === 'completado',
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('[API Error] Planificación:', error);
    return NextResponse.json(
      { error: 'Error obteniendo eventos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any)?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    const body = await request.json();
    
    const event = await prisma.calendarEvent.create({
      data: {
        companyId,
        titulo: body.titulo || 'Nuevo evento',
        tipo: body.tipo || 'otro',
        fechaInicio: new Date(body.fecha || Date.now()),
        duracionMinutos: body.duracion || 30,
        descripcion: body.descripcion || '',
        ubicacion: body.propiedad || '',
        asignadoA: body.asignado || '',
        estado: 'pendiente',
        creadorId: (session.user as any).id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        titulo: event.titulo,
        tipo: event.tipo,
        fecha: event.fechaInicio,
        completado: false,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[API Error] Create Event:', error);
    return NextResponse.json({ error: 'Error creando evento' }, { status: 500 });
  }
}
