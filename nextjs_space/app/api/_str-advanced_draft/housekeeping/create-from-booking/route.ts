/**
 * API para crear tarea de limpieza desde booking
 * POST /api/str-advanced/housekeeping/create-from-booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createCleaningTaskFromBooking } from '@/lib/str-advanced-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId es requerido' },
        { status: 400 }
      );
    }

    const task = await createCleaningTaskFromBooking(bookingId);

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error creando tarea de limpieza:', error);
    return NextResponse.json(
      { error: error.message || 'Error creando tarea' },
      { status: 500 }
    );
  }
}
