import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener configuración actual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authKey = process.env.INMOVA_CONTASIMPLE_AUTH_KEY;
    
    return NextResponse.json({
      configured: !!authKey,
      enabled: !!authKey,
      authKeyMasked: authKey ? `****${authKey.slice(-8)}` : null,
    });
  } catch (error) {
    logger.error('Error getting config:', error);
    return NextResponse.json(
      { error: 'Error obteniendo configuración' },
      { status: 500 }
    );
  }
}

// POST - Las credenciales de plataforma se configuran via env vars
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Para configuración de plataforma, las credenciales van en variables de entorno
    // Este endpoint solo informa al admin que debe configurarlas en el servidor
    return NextResponse.json({
      message: 'Las credenciales de Contasimple para Inmova se configuran en las variables de entorno del servidor',
      instructions: [
        'Añade INMOVA_CONTASIMPLE_AUTH_KEY en .env.production',
        'Reinicia PM2 con: pm2 restart inmova-app --update-env',
      ],
    });
  } catch (error) {
    logger.error('Error saving config:', error);
    return NextResponse.json(
      { error: 'Error guardando configuración' },
      { status: 500 }
    );
  }
}
