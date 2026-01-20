import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/community-manager/accounts
 * Obtiene las cuentas de redes sociales conectadas
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

    // TODO: Obtener cuentas reales de la base de datos
    // Por ahora, retornamos array vacío indicando que no hay cuentas conectadas
    // Las cuentas se conectarán mediante OAuth con cada plataforma
    
    return NextResponse.json({
      success: true,
      accounts: [],
      message: 'No hay cuentas de redes sociales conectadas. Conecta tus cuentas para comenzar.',
    });
  } catch (error: any) {
    logger.error('[Community Manager Accounts Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener cuentas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/community-manager/accounts
 * Conectar una nueva cuenta de red social
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { platform, accessToken, refreshToken } = body;

    if (!platform || !accessToken) {
      return NextResponse.json(
        { error: 'Plataforma y token de acceso son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Implementar conexión real con cada plataforma:
    // - Instagram: Meta Graph API
    // - Facebook: Meta Graph API
    // - LinkedIn: LinkedIn API
    // - Twitter/X: Twitter API v2
    
    return NextResponse.json({
      success: true,
      message: 'Cuenta conectada correctamente',
      // account: newAccount
    });
  } catch (error: any) {
    logger.error('[Community Manager Connect Account Error]:', error);
    return NextResponse.json(
      { error: 'Error al conectar cuenta' },
      { status: 500 }
    );
  }
}
