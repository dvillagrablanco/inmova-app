import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/canva/status
 * Verifica el estado de conexión con Canva
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar si hay credenciales de Canva configuradas
    const canvaClientId = process.env.CANVA_CLIENT_ID;
    const canvaClientSecret = process.env.CANVA_CLIENT_SECRET;
    
    const isConfigured = Boolean(
      canvaClientId && 
      canvaClientSecret && 
      canvaClientId.length > 10 && 
      !canvaClientId.includes('placeholder')
    );

    // TODO: Verificar token de acceso válido si está configurado
    // Por ahora, indicamos que no está conectado hasta que se configure
    
    return NextResponse.json({
      success: true,
      configured: isConfigured,
      connected: false, // Se actualizará cuando se implemente OAuth
      message: isConfigured 
        ? 'Canva configurado. Inicia sesión para conectar tu cuenta.'
        : 'Canva no configurado. Añade las credenciales en el panel de integraciones.',
    });
  } catch (error: any) {
    logger.error('[Canva Status Error]:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado de Canva' },
      { status: 500 }
    );
  }
}
