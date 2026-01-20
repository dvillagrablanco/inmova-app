import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authKey = process.env.INMOVA_CONTASIMPLE_AUTH_KEY;
    
    if (!authKey) {
      return NextResponse.json({
        success: false,
        error: 'No hay credenciales configuradas',
      });
    }

    // Test connection to Contasimple API
    const apiUrl = process.env.CONTASIMPLE_API_URL || 'https://api.contasimple.com/api/v2';
    
    try {
      const response = await fetch(`${apiUrl}/company`, {
        headers: {
          'Authorization': `Bearer ${authKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          message: 'Conexión exitosa',
          company: data.name || 'Conectado',
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Error ${response.status}: ${response.statusText}`,
        });
      }
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo conectar con Contasimple API',
      });
    }
  } catch (error) {
    logger.error('Error testing Contasimple:', error);
    return NextResponse.json(
      { success: false, error: 'Error probando conexión' },
      { status: 500 }
    );
  }
}
