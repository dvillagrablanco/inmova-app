export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, forbiddenResponse, notFoundResponse } from '@/lib/permissions';

// POST - Inscribirse a un evento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id: eventId } = params;
    const data = await request.json();
    
    // Verificar que el evento existe y pertenece a la empresa
    const event = await prisma.communityEvent.findFirst({
      where: {
        id: eventId,
        companyId: user.companyId
      }
    });
    
    if (!event) {
      return notFoundResponse('Evento no encontrado');
    }
    
    // Verificar capacidad
    const currentAttendees = event.asistentesConfirmados?.length || 0;
    const isWaitlist = event.capacidadMaxima ? currentAttendees >= event.capacidadMaxima : false;
    
    // Crear inscripción
    const attendee = await prisma.eventAttendee.create({
      data: {
        eventId,
        tenantId: data.tenantId,
        nombreExterno: data.nombreExterno,
        emailExterno: data.emailExterno,
        confirmado: !isWaitlist,
        enListaEspera: isWaitlist,
      }
    });
    
    // Actualizar contador del evento
    if (!isWaitlist) {
      await prisma.communityEvent.update({
        where: { id: eventId },
        data: {
          asistentesLista: { increment: 1 }
        }
      });
    }
    
    return NextResponse.json({
      ...attendee,
      message: isWaitlist ? 'Añadido a lista de espera' : 'Inscripción confirmada'
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya estás inscrito en este evento' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Cancelar inscripción
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id: eventId } = params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
    }
    
    const deleted = await prisma.eventAttendee.deleteMany({
      where: {
        eventId,
        tenantId
      }
    });
    
    if (deleted.count > 0) {
      await prisma.communityEvent.update({
        where: { id: eventId },
        data: {
          asistentesLista: { decrement: 1 }
        }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
