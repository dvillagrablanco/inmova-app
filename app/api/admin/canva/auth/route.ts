import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Canva OAuth configuration
const CANVA_AUTH_URL = 'https://www.canva.com/api/oauth/authorize';
const CANVA_TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token';

// GET - Iniciar OAuth flow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'administrador'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = process.env.CANVA_CLIENT_ID;
    const redirectUri = process.env.CANVA_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/admin/canva/callback`;

    if (!clientId) {
      // Si no hay client ID, mostrar instrucciones de configuración
      return NextResponse.json({
        configured: false,
        message: 'Canva API no configurado',
        instructions: {
          step1: 'Crear una app en https://www.canva.dev/console',
          step2: 'Obtener Client ID y Client Secret',
          step3: 'Añadir las variables de entorno:',
          variables: [
            'CANVA_CLIENT_ID=tu_client_id',
            'CANVA_CLIENT_SECRET=tu_client_secret',
            'CANVA_REDIRECT_URI=https://inmovaapp.com/api/admin/canva/callback',
          ],
          step4: 'Reiniciar la aplicación',
        },
        documentation: 'https://www.canva.dev/docs/connect/authentication/',
        alternativeUrl: 'https://www.canva.com/design',
      });
    }

    // Generar state para seguridad CSRF
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
    })).toString('base64');

    // Scopes necesarios para la integración
    const scopes = [
      'design:content:read',
      'design:content:write',
      'design:meta:read',
      'asset:read',
      'asset:write',
      'brandtemplate:content:read',
      'brandtemplate:meta:read',
      'folder:read',
      'profile:read',
    ].join(' ');

    // Construir URL de autorización
    const authUrl = new URL(CANVA_AUTH_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    // Redirigir a Canva
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    logger.error('[Canva Auth Error]:', error);
    return NextResponse.json(
      { error: 'Error iniciando autenticación con Canva' },
      { status: 500 }
    );
  }
}

// POST - Intercambiar código por tokens (callback)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'administrador'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorización requerido' },
        { status: 400 }
      );
    }

    const clientId = process.env.CANVA_CLIENT_ID;
    const clientSecret = process.env.CANVA_CLIENT_SECRET;
    const redirectUri = process.env.CANVA_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/admin/canva/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Canva no configurado correctamente' },
        { status: 500 }
      );
    }

    // Intercambiar código por token
    const tokenResponse = await fetch(CANVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      logger.error('[Canva Token Error]:', error);
      return NextResponse.json(
        { error: 'Error obteniendo token de Canva' },
        { status: 500 }
      );
    }

    const tokens = await tokenResponse.json();

    // TODO: Guardar tokens en base de datos o Redis
    // Por ahora, devolver instrucciones para guardar manualmente
    return NextResponse.json({
      success: true,
      message: 'Canva conectado exitosamente',
      tokens: {
        accessToken: tokens.access_token ? '****' + tokens.access_token.slice(-8) : null,
        refreshToken: tokens.refresh_token ? '****' + tokens.refresh_token.slice(-8) : null,
        expiresIn: tokens.expires_in,
      },
      instructions: {
        message: 'Añade el access_token a las variables de entorno:',
        variable: `CANVA_ACCESS_TOKEN=${tokens.access_token}`,
      },
    });
  } catch (error: any) {
    logger.error('[Canva Token Exchange Error]:', error);
    return NextResponse.json(
      { error: 'Error en el intercambio de tokens' },
      { status: 500 }
    );
  }
}
