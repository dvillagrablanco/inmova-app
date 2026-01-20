/**
 * API: Workspace Bookings
 * GET /api/workspace/bookings - Lista reservas
 * POST /api/workspace/bookings - Crear reserva
 * PATCH /api/workspace/bookings - Actualizar estado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createBookingSchema = z.object({
  unitId: z.string(),
  tenantId: z.string().optional(),
  fecha: z.string(),
  horaInicio: z.string(),
  horaFin: z.string().optional(),
  duracion: z.number().optional(),
  precio: z.number().optional(),
  notas: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      estado: searchParams.get('estado') || undefined,
      fecha: searchParams.get('fecha') || undefined,
      espacioId: searchParams.get('espacioId') || undefined,
    };

    const bookings = await WorkspaceService.getBookings(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: bookings
    });
  } catch (error: any) {
    console.error('[Workspace Bookings GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo reservas', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createBookingSchema.parse(body);

    const booking = await WorkspaceService.createBooking({
      ...validated,
      companyId: session.user.companyId
    });

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Reserva creada correctamente'
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[Workspace Bookings POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando reserva', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, estado } = z.object({
      id: z.string(),
      estado: z.string()
    }).parse(body);

    await WorkspaceService.updateBookingStatus(id, estado);

    return NextResponse.json({
      success: true,
      message: 'Estado de reserva actualizado'
    });
  } catch (error: any) {
    console.error('[Workspace Bookings PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando reserva', message: error.message },
      { status: 500 }
    );
  }
}
