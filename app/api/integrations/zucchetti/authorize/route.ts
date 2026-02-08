/**
 * API Route: Iniciar flujo OAuth de Zucchetti
 *
 * GET /api/integrations/zucchetti/authorize
 * Genera la URL de autorización y redirige al usuario a Zucchetti
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import crypto from 'crypto';
import { getZucchettiAuthMode } from '@/lib/zucchetti-altai-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración de Zucchetti desde variables de entorno
const ZUCCHETTI_CONFIG = {
  clientId: process.env.ZUCCHETTI_CLIENT_ID || '',
  clientSecret: process.env.ZUCCHETTI_CLIENT_SECRET || '',
  oauthUrl: process.env.ZUCCHETTI_OAUTH_URL || 'https://auth.zucchetti.it/oauth',
  apiUrl: process.env.ZUCCHETTI_API_URL || 'https://api.zucchetti.it/v1',
  scopes:
    'accounting:read accounting:write customers:read customers:write invoices:read invoices:write payments:read payments:write',
};

/**
 * GET /api/integrations/zucchetti/authorize
 * Inicia el flujo OAuth redirigiendo al usuario a Zucchetti
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden configurar integraciones
    if (
      session.user.role !== 'administrador' &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'Solo administradores pueden configurar integraciones' },
        { status: 403 }
      );
    }

    const authMode = getZucchettiAuthMode();
    if (authMode === 'altai') {
      return NextResponse.json(
        {
          error: 'Zucchetti est? configurado en modo Altai',
          message: 'El flujo OAuth no aplica para Altai. Usa el test de conexi?n.',
        },
        { status: 400 }
      );
    }

    // Verificar que Zucchetti está configurado
    if (!ZUCCHETTI_CONFIG.clientId || !ZUCCHETTI_CONFIG.clientSecret) {
      logger.warn('[Zucchetti OAuth] Credenciales no configuradas');
      return NextResponse.json(
        {
          error: 'Zucchetti no está configurado',
          message:
            'Las credenciales de Zucchetti no están configuradas en el servidor. Contacta al administrador.',
          configured: false,
        },
        { status: 503 }
      );
    }

    // Generar state para prevenir CSRF
    const state = crypto.randomBytes(32).toString('hex');

    // Guardar state en la sesión/BD para validarlo en el callback
    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        // Usamos el campo de webhook secret temporalmente para guardar el state
        // En producción deberías usar una tabla separada para OAuth states
        zucchettiWebhookSecret: state,
      },
    });

    // Construir URL de callback
    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const redirectUri = `${baseUrl}/api/integrations/zucchetti/callback`;

    // Construir URL de autorización de Zucchetti
    const authParams = new URLSearchParams({
      client_id: ZUCCHETTI_CONFIG.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: ZUCCHETTI_CONFIG.scopes,
      state: state,
      // Opcional: incluir company_id para multi-empresa
      // company_id: session.user.companyId,
    });

    const authorizationUrl = `${ZUCCHETTI_CONFIG.oauthUrl}/authorize?${authParams.toString()}`;

    logger.info(`[Zucchetti OAuth] Iniciando autorización para empresa ${session.user.companyId}`);

    // Devolver URL (el frontend puede redirigir) o redirigir directamente
    const { searchParams } = new URL(request.url);
    const autoRedirect = searchParams.get('redirect') === 'true';

    if (autoRedirect) {
      return NextResponse.redirect(authorizationUrl);
    }

    return NextResponse.json({
      success: true,
      authorizationUrl,
      message: 'Redirige al usuario a esta URL para autorizar la integración',
      expiresIn: 600, // El state expira en 10 minutos
    });
  } catch (error: any) {
    logger.error('[Zucchetti OAuth] Error iniciando autorización:', error);
    return NextResponse.json(
      { error: 'Error iniciando autorización', details: error.message },
      { status: 500 }
    );
  }
}
