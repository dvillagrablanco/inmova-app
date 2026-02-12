/**
 * API de Soporte para Partners
 * 
 * Gestión de tickets de soporte
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Ticket {
  id: string;
  asunto: string;
  categoria: string;
  estado: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
  prioridad: 'baja' | 'media' | 'alta';
  fechaCreacion: Date;
  ultimaActualizacion: Date;
}

// TODO: Obtener tickets desde la base de datos
function generateTickets(): Ticket[] {
  return [];
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

    const tickets = generateTickets();

    return NextResponse.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error('[API Error] Partners Support:', error);
    return NextResponse.json(
      { error: 'Error obteniendo tickets' },
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
    const { asunto, categoria, prioridad, descripcion } = body;

    if (!asunto || !descripcion) {
      return NextResponse.json(
        { error: 'Asunto y descripción son requeridos' },
        { status: 400 }
      );
    }

    // En producción, guardar en base de datos
    const newTicket: Ticket = {
      id: `TK-${Date.now().toString().slice(-6)}`,
      asunto,
      categoria: categoria || 'general',
      estado: 'abierto',
      prioridad: prioridad || 'media',
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newTicket,
    }, { status: 201 });
  } catch (error) {
    console.error('[API Error] Create Ticket:', error);
    return NextResponse.json(
      { error: 'Error creando ticket' },
      { status: 500 }
    );
  }
}
