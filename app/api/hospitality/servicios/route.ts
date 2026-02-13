/**
 * API Hospitality: Servicios al Huésped
 * 
 * GET - Lista servicios configurados
 * 
 * Por ahora retorna servicios por defecto.
 * En futuro se conectará a tabla GuestService en BD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Servicios por defecto - en futuro vendrán de BD
    return NextResponse.json({ data: [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno', data: [] }, { status: 500 });
  }
}
