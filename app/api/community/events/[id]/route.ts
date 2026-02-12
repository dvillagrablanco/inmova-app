export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, forbiddenResponse, notFoundResponse } from '@/lib/permissions';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET - Obtener detalle de un evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const { id } = params;
    
    const event = await prisma.communityEvent.findFirst({
      where: {
        id,
        companyId: user.companyId
      },
      include: {
        building: {
          select: { id: true, nombre: true, direccion: true }
        }
      }
    });
    
    if (!event) {
      return notFoundResponse('Evento no encontrado');
    }
    
    // Obtener asistentes
    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId: id },
      include: {
        tenant: {
          select: { id: true, nombreCompleto: true, email: true }
        }
      }
    });
    
    // Obtener comentarios
    const comments = await prisma.eventComment.findMany({
      where: { eventId: id, visible: true },
      include: {
        tenant: {
          select: { id: true, nombreCompleto: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      ...event,
      attendees,
      comments
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// PATCH - Actualizar evento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const { id } = params;
    
    if (!hasPermission(user.role, 'manageEvents')) {
      return forbiddenResponse('No tienes permiso para editar eventos');
    }
    
    const data = await request.json();
    
    const event = await prisma.communityEvent.updateMany({
      where: {
        id,
        companyId: user.companyId
      },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.categoria && { categoria: data.categoria }),
        ...(data.fecha && { fecha: new Date(data.fecha) }),
        ...(data.horaInicio && { horaInicio: data.horaInicio }),
        ...(data.horaFin && { horaFin: data.horaFin }),
        ...(data.ubicacion && { ubicacion: data.ubicacion }),
        ...(data.capacidadMaxima !== undefined && { capacidadMaxima: data.capacidadMaxima }),
        ...(data.precio !== undefined && { precio: data.precio }),
        ...(data.estado && { estado: data.estado }),
        ...(data.fotos && { fotos: data.fotos }),
      }
    });
    
    return NextResponse.json({ success: true, updated: event.count });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Eliminar evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const { id } = params;
    
    if (!hasPermission(user.role, 'delete')) {
      return forbiddenResponse('No tienes permiso para eliminar eventos');
    }
    
    await prisma.communityEvent.deleteMany({
      where: {
        id,
        companyId: user.companyId
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
