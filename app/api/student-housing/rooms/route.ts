/**
 * API: Student Housing Rooms
 * GET /api/student-housing/rooms - Lista habitaciones
 * PATCH /api/student-housing/rooms - Actualizar estado de habitación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { StudentHousingService } from '@/lib/services/student-housing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      estado: searchParams.get('estado') || undefined,
      edificio: searchParams.get('edificio') || undefined,
      tipo: searchParams.get('tipo') || undefined,
    };

    const rooms = await StudentHousingService.getRooms(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: rooms
    });
  } catch (error: any) {
    console.error('[Student Housing Rooms GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo habitaciones', message: error.message },
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
    const { roomId, status } = z.object({
      roomId: z.string(),
      status: z.string()
    }).parse(body);

    await StudentHousingService.updateRoomStatus(roomId, status);

    return NextResponse.json({
      success: true,
      message: 'Estado de habitación actualizado'
    });
  } catch (error: any) {
    console.error('[Student Housing Rooms PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando habitación', message: error.message },
      { status: 500 }
    );
  }
}
