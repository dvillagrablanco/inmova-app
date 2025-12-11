/**
 * API para generar hoja de registro de viajeros
 * POST /api/str-advanced/legal/generate-registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateTravelerRegistration } from '@/lib/str-advanced-service';

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
    const { bookingId, travelers } = body;

    if (!bookingId || !travelers || !Array.isArray(travelers)) {
      return NextResponse.json(
        { error: 'bookingId y travelers son requeridos' },
        { status: 400 }
      );
    }

    const registration = await generateTravelerRegistration(bookingId, travelers);

    return NextResponse.json(registration);
  } catch (error: any) {
    console.error('Error generando registro:', error);
    return NextResponse.json(
      { error: error.message || 'Error generando registro' },
      { status: 500 }
    );
  }
}
