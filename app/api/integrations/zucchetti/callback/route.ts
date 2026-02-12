/**
 * API Route: Callback OAuth de Zucchetti
 *
 * GET /api/integrations/zucchetti/callback
 * Recibe el código de autorización y lo intercambia por tokens
 *
 * URL pública: https://inmovaapp.com/api/integrations/zucchetti/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { decryptZucchettiToken, encryptZucchettiToken } from '@/lib/zucchetti-token-crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const ZUCCHETTI_CONFIG = {
  clientId: process.env.ZUCCHETTI_CLIENT_ID || '',
  clientSecret: process.env.ZUCCHETTI_CLIENT_SECRET || '',
  oauthUrl: process.env.ZUCCHETTI_OAUTH_URL || 'https://auth.zucchetti.it/oauth',
  apiUrl: process.env.ZUCCHETTI_API_URL || 'https://api.zucchetti.it/v1',
};

// ═══════════════════════════════════════════════════════════════
// ENCRIPTACIÓN DE TOKENS (helpers compartidos)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// INTERCAMBIO DE CÓDIGO POR TOKENS
// ═══════════════════════════════════════════════════════════════

interface ZucchettiTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<ZucchettiTokenResponse> {
  const tokenUrl = `${ZUCCHETTI_CONFIG.oauthUrl}/token`;

  // Construir body como form-urlencoded
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: ZUCCHETTI_CONFIG.clientId,
    client_secret: ZUCCHETTI_CONFIG.clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[Zucchetti OAuth] Error intercambiando código:', {
      status: response.status,
      error: errorText,
    });
    throw new Error(`Error de Zucchetti: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data as ZucchettiTokenResponse;
}

// ═══════════════════════════════════════════════════════════════
// OBTENER INFO DE LA EMPRESA EN ZUCCHETTI
// ═══════════════════════════════════════════════════════════════

async function getZucchettiCompanyInfo(accessToken: string): Promise<{
  companyId: string;
  companyName?: string;
}> {
  try {
    const response = await fetch(`${ZUCCHETTI_CONFIG.apiUrl}/company/info`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        companyId: data.company_id || data.id || 'unknown',
        companyName: data.name || data.company_name,
      };
    }

    // Si no hay endpoint de info, devolver placeholder
    return { companyId: 'zucchetti-connected' };
  } catch (error) {
    logger.warn('[Zucchetti OAuth] No se pudo obtener info de empresa:', error);
    return { companyId: 'zucchetti-connected' };
  }
}

// ═══════════════════════════════════════════════════════════════
// GET - CALLBACK OAUTH
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);

    // Parámetros OAuth
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // URL base para redirecciones
    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';

    // ─────────────────────────────────────────────────────────────
    // CASO 1: Error de Zucchetti
    // ─────────────────────────────────────────────────────────────
    if (error) {
      logger.error('[Zucchetti OAuth] Error de autorización:', {
        error,
        description: errorDescription,
      });

      // Redirigir a página de integraciones con error
      const redirectUrl = new URL('/admin/integraciones', baseUrl);
      redirectUrl.searchParams.set('integration', 'zucchetti');
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', errorDescription || error);

      return NextResponse.redirect(redirectUrl.toString());
    }

    // ─────────────────────────────────────────────────────────────
    // CASO 2: Faltan parámetros
    // ─────────────────────────────────────────────────────────────
    if (!code || !state) {
      logger.error('[Zucchetti OAuth] Faltan parámetros:', { code: !!code, state: !!state });

      const redirectUrl = new URL('/admin/integraciones', baseUrl);
      redirectUrl.searchParams.set('integration', 'zucchetti');
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', 'Parámetros de autorización inválidos');

      return NextResponse.redirect(redirectUrl.toString());
    }

    // ─────────────────────────────────────────────────────────────
    // CASO 3: Validar state (CSRF protection)
    // ─────────────────────────────────────────────────────────────

    // Buscar la empresa que tiene este state guardado
    const company = await prisma.company.findFirst({
      where: {
        zucchettiWebhookSecret: state,
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    if (!company) {
      logger.error('[Zucchetti OAuth] State inválido o expirado');

      const redirectUrl = new URL('/admin/integraciones', baseUrl);
      redirectUrl.searchParams.set('integration', 'zucchetti');
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', 'Sesión expirada. Por favor, intenta de nuevo.');

      return NextResponse.redirect(redirectUrl.toString());
    }

    // ─────────────────────────────────────────────────────────────
    // CASO 4: Intercambiar código por tokens
    // ─────────────────────────────────────────────────────────────

    const redirectUri = `${baseUrl}/api/integrations/zucchetti/callback`;

    logger.info(`[Zucchetti OAuth] Intercambiando código para empresa ${company.id}`);

    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Obtener info de la empresa en Zucchetti
    const zucchettiInfo = await getZucchettiCompanyInfo(tokens.access_token);

    // Calcular fecha de expiración
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // ─────────────────────────────────────────────────────────────
    // CASO 5: Guardar tokens en la BD (encriptados)
    // ─────────────────────────────────────────────────────────────

    await prisma.company.update({
      where: { id: company.id },
      data: {
        zucchettiEnabled: true,
        zucchettiAccessToken: encryptZucchettiToken(tokens.access_token),
        zucchettiRefreshToken: encryptZucchettiToken(tokens.refresh_token),
        zucchettiTokenExpiry: tokenExpiry,
        zucchettiCompanyId: zucchettiInfo.companyId,
        zucchettiLastSync: new Date(),
        zucchettiSyncErrors: 0,
        // Limpiar el state usado
        zucchettiWebhookSecret: null,
      },
    });

    logger.info(`[Zucchetti OAuth] ✅ Integración completada para empresa ${company.id}`, {
      zucchettiCompanyId: zucchettiInfo.companyId,
      tokenExpiry: tokenExpiry.toISOString(),
    });

    // Crear log de auditoría
    try {
      const session = await getServerSession(authOptions);
      const auditUserId = session?.user?.id;

      if (auditUserId) {
        await prisma.auditLog.create({
          data: {
            action: 'UPDATE',
            entityType: 'INTEGRATION',
            entityId: company.id,
            companyId: company.id,
            userId: auditUserId,
            changes: JSON.stringify({
              zucchettiCompanyId: zucchettiInfo.companyId,
              connectedAt: new Date().toISOString(),
            }),
          },
        });
      }
    } catch (auditError) {
      logger.warn('[Zucchetti OAuth] Error creando audit log:', auditError);
    }

    // ─────────────────────────────────────────────────────────────
    // CASO 6: Redirigir a página de éxito
    // ─────────────────────────────────────────────────────────────

    const redirectUrl = new URL('/admin/integraciones', baseUrl);
    redirectUrl.searchParams.set('integration', 'zucchetti');
    redirectUrl.searchParams.set('status', 'success');
    redirectUrl.searchParams.set('message', 'Zucchetti conectado correctamente');

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    logger.error('[Zucchetti OAuth] Error en callback:', error);

    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const redirectUrl = new URL('/admin/integraciones', baseUrl);
    redirectUrl.searchParams.set('integration', 'zucchetti');
    redirectUrl.searchParams.set('status', 'error');
    redirectUrl.searchParams.set('message', error.message || 'Error conectando con Zucchetti');

    return NextResponse.redirect(redirectUrl.toString());
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS PARA USO INTERNO
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene los tokens desencriptados de Zucchetti para una empresa
 */
export async function getZucchettiTokens(companyId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiry: Date;
  companyId: string;
} | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        zucchettiEnabled: true,
        zucchettiAccessToken: true,
        zucchettiRefreshToken: true,
        zucchettiTokenExpiry: true,
        zucchettiCompanyId: true,
      },
    });

    if (!company?.zucchettiEnabled || !company.zucchettiAccessToken) {
      return null;
    }

    return {
      accessToken: decryptZucchettiToken(company.zucchettiAccessToken),
      refreshToken: company.zucchettiRefreshToken
        ? decryptZucchettiToken(company.zucchettiRefreshToken)
        : '',
      expiry: company.zucchettiTokenExpiry || new Date(),
      companyId: company.zucchettiCompanyId || '',
    };
  } catch (error) {
    logger.error('[Zucchetti] Error obteniendo tokens:', error);
    return null;
  }
}

/**
 * Refresca el token de acceso si está expirado
 */
export async function refreshZucchettiToken(companyId: string): Promise<boolean> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        zucchettiRefreshToken: true,
        zucchettiTokenExpiry: true,
      },
    });

    if (!company?.zucchettiRefreshToken) {
      return false;
    }

    // Verificar si el token aún es válido (con 5 min de margen)
    if (
      company.zucchettiTokenExpiry &&
      company.zucchettiTokenExpiry > new Date(Date.now() + 5 * 60 * 1000)
    ) {
      return true; // Token aún válido
    }

    const refreshToken = decryptZucchettiToken(company.zucchettiRefreshToken);

    // Solicitar nuevo token
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: ZUCCHETTI_CONFIG.clientId,
      client_secret: ZUCCHETTI_CONFIG.clientSecret,
    });

    const response = await fetch(`${ZUCCHETTI_CONFIG.oauthUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      logger.error('[Zucchetti] Error refrescando token:', await response.text());
      return false;
    }

    const tokens: ZucchettiTokenResponse = await response.json();
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Actualizar tokens en BD
    await prisma.company.update({
      where: { id: companyId },
      data: {
        zucchettiAccessToken: encryptZucchettiToken(tokens.access_token),
        zucchettiRefreshToken: encryptZucchettiToken(tokens.refresh_token),
        zucchettiTokenExpiry: tokenExpiry,
      },
    });

    logger.info(`[Zucchetti] Token refrescado para empresa ${companyId}`);
    return true;
  } catch (error) {
    logger.error('[Zucchetti] Error refrescando token:', error);
    return false;
  }
}
