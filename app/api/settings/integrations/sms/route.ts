/**
 * API Route: Configuración de SMS (Twilio)
 * 
 * POST /api/settings/integrations/sms
 * Guarda la configuración de Twilio de la empresa
 * 
 * NOTA: Funcionalidad en desarrollo - Próximamente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // TODO: Implementar cuando la integración de Twilio esté lista
    return NextResponse.json(
      { error: 'Funcionalidad en desarrollo - Próximamente' },
      { status: 501 }
    );
  } catch (error: any) {
    console.error('[SMS Config] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error guardando configuración' },
      { status: 500 }
    );
  }
}
