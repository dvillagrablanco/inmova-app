/**
 * API de Planificación
 * 
 * Gestión de eventos programados
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { addDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ScheduledEvent {
  id: string;
  titulo: string;
  tipo: 'visita' | 'mantenimiento' | 'reunion' | 'contrato' | 'otro';
  fecha: Date;
  hora: string;
  duracion: number;
  descripcion?: string;
  propiedad?: string;
  asignado?: string;
  completado: boolean;
}

function generateEvents(): ScheduledEvent[] {
  return [
    {
      id: '1',
      titulo: 'Visita propiedad Centro',
      tipo: 'visita',
      fecha: new Date(),
      hora: '10:00',
      duracion: 30,
      propiedad: 'Apartamento Centro',
      asignado: 'María García',
      completado: false,
    },
    {
      id: '2',
      titulo: 'Reparación fontanería',
      tipo: 'mantenimiento',
      fecha: new Date(),
      hora: '14:00',
      duracion: 60,
      propiedad: 'Torre Marina #204',
      asignado: 'Técnico Juan',
      completado: false,
    },
    {
      id: '3',
      titulo: 'Firma contrato nuevo inquilino',
      tipo: 'contrato',
      fecha: addDays(new Date(), 1),
      hora: '11:00',
      duracion: 45,
      propiedad: 'Estudio Plaza',
      asignado: 'Carlos López',
      completado: false,
    },
    {
      id: '4',
      titulo: 'Reunión propietarios',
      tipo: 'reunion',
      fecha: addDays(new Date(), 2),
      hora: '17:00',
      duracion: 90,
      descripcion: 'Revisión trimestral',
      completado: false,
    },
    {
      id: '5',
      titulo: 'Inspección anual',
      tipo: 'visita',
      fecha: addDays(new Date(), 3),
      hora: '09:00',
      duracion: 120,
      propiedad: 'Centro Empresarial',
      asignado: 'Ana Martínez',
      completado: false,
    },
  ];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const events = generateEvents();

    return NextResponse.json({
      success: true,
      data: events,
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
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const newEvent: ScheduledEvent = {
      id: `evt-${Date.now()}`,
      titulo: body.titulo,
      tipo: body.tipo || 'otro',
      fecha: new Date(body.fecha),
      hora: body.hora,
      duracion: body.duracion || 30,
      descripcion: body.descripcion,
      propiedad: body.propiedad,
      asignado: body.asignado,
      completado: false,
    };

    return NextResponse.json({
      success: true,
      data: newEvent,
    }, { status: 201 });
  } catch (error) {
    console.error('[API Error] Create Event:', error);
    return NextResponse.json(
      { error: 'Error creando evento' },
      { status: 500 }
    );
  }
}
