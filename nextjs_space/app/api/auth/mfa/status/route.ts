/**
 * API Endpoint: Estado de MFA
 * GET /api/auth/mfa/status
 * 
 * Obtiene el estado actual de MFA para el usuario autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMFAStatus } from '@/lib/mfa-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const status = await getMFAStatus(userId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener estado MFA' },
      { status: 500 }
    );
  }
}
