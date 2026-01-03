/**
 * Servicio de OAuth para Social Media APIs
 * 
 * Maneja el flujo OAuth 2.0 para integración con redes sociales.
 * 
 * @module OAuthService
 */

import { prisma } from './db';
import logger from './logger';
import crypto from 'crypto';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const OAUTH_CONFIGS = {
  FACEBOOK: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
    ],
    clientId: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
  },
  LINKEDIN: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: [
      'w_member_social',
      'r_basicprofile',
      'r_organization_social',
      'w_organization_social',
    ],
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  },
  TWITTER: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
  },
};

// ============================================================================
// TIPOS
// ============================================================================

export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'TWITTER';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

export interface OAuthState {
  platform: SocialPlatform;
  companyId: string;
  userId: string;
  redirectTo?: string;
}

// ============================================================================
// GENERACIÓN DE URLs DE AUTORIZACIÓN
// ============================================================================

/**
 * Genera URL de autorización OAuth
 */
export async function generateAuthUrl(
  platform: SocialPlatform,
  companyId: string,
  userId: string,
  redirectTo?: string
): Promise<{ url: string; state: string }> {
  try {
    // Instagram usa el mismo flujo que Facebook
    const config = platform === 'INSTAGRAM' 
      ? OAUTH_CONFIGS.FACEBOOK 
      : OAUTH_CONFIGS[platform];

    if (!config.clientId) {
      throw new Error(`${platform} OAuth not configured`);
    }

    // Generar state token seguro
    const stateData: OAuthState = {
      platform,
      companyId,
      userId,
      redirectTo,
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Guardar state en BD (expira en 10 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await prisma.oAuthState.create({
      data: {
        state,
        platform,
        companyId,
        userId,
        expiresAt,
      },
    });

    // Construir URL de autorización
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback/${platform.toLowerCase()}`;
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state,
    });

    const authUrl = `${config.authUrl}?${params.toString()}`;

    logger.info(`🔐 Generated OAuth URL for ${platform}`, {
      companyId,
      userId,
    });

    return { url: authUrl, state };

  } catch (error: any) {
    logger.error('❌ Error generating OAuth URL:', error);
    throw new Error(`Failed to generate auth URL: ${error.message}`);
  }
}

/**
 * Valida y parsea state token
 */
export async function validateState(state: string): Promise<OAuthState | null> {
  try {
    // Verificar que existe en BD y no ha expirado
    const stateRecord = await prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!stateRecord) {
      logger.warn('⚠️ OAuth state not found in database');
      return null;
    }

    if (stateRecord.expiresAt < new Date()) {
      logger.warn('⚠️ OAuth state expired');
      await prisma.oAuthState.delete({ where: { state } });
      return null;
    }

    // Parsear state
    const stateData: OAuthState = JSON.parse(
      Buffer.from(state, 'base64url').toString()
    );

    // Limpiar state usado
    await prisma.oAuthState.delete({ where: { state } });

    return stateData;

  } catch (error: any) {
    logger.error('❌ Error validating state:', error);
    return null;
  }
}

// ============================================================================
// INTERCAMBIO DE TOKENS
// ============================================================================

/**
 * Intercambia código de autorización por access token
 */
export async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string
): Promise<OAuthTokens> {
  try {
    const config = platform === 'INSTAGRAM' 
      ? OAUTH_CONFIGS.FACEBOOK 
      : OAUTH_CONFIGS[platform];

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback/${platform.toLowerCase()}`;

    // Preparar request según plataforma
    let body: any;
    let headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (platform === 'TWITTER') {
      // Twitter usa Basic Auth
      const auth = Buffer.from(
        `${config.clientId}:${config.clientSecret}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;

      body = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: 'challenge', // Para PKCE (si se implementa)
      });
    } else {
      // Facebook/LinkedIn usan client_id + client_secret en body
      body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
    }

    // Hacer request
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token exchange failed: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    // Parsear respuesta según plataforma
    const tokens: OAuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      scope: data.scope,
    };

    // Calcular expiración
    if (data.expires_in) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
      tokens.expiresAt = expiresAt;
    }

    logger.info(`✅ Tokens exchanged for ${platform}`);

    return tokens;

  } catch (error: any) {
    logger.error(`❌ Error exchanging code for token (${platform}):`, error);
    throw new Error(`Token exchange failed: ${error.message}`);
  }
}

/**
 * Refresca access token usando refresh token
 */
export async function refreshAccessToken(
  platform: SocialPlatform,
  refreshToken: string
): Promise<OAuthTokens> {
  try {
    const config = platform === 'INSTAGRAM' 
      ? OAUTH_CONFIGS.FACEBOOK 
      : OAUTH_CONFIGS[platform];

    let body: any;
    let headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (platform === 'TWITTER') {
      const auth = Buffer.from(
        `${config.clientId}:${config.clientSecret}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;

      body = new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
    } else {
      body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();

    const tokens: OAuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      scope: data.scope,
    };

    if (data.expires_in) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
      tokens.expiresAt = expiresAt;
    }

    logger.info(`🔄 Access token refreshed for ${platform}`);

    return tokens;

  } catch (error: any) {
    logger.error(`❌ Error refreshing token (${platform}):`, error);
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

// ============================================================================
// GESTIÓN DE TOKENS EN BD
// ============================================================================

/**
 * Guarda tokens OAuth en BD
 */
export async function saveTokens(
  companyId: string,
  userId: string,
  platform: SocialPlatform,
  tokens: OAuthTokens,
  accountInfo?: any
): Promise<any> {
  try {
    // Encriptar tokens (básico - en producción usar KMS)
    const encryptedAccessToken = encryptToken(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken
      ? encryptToken(tokens.refreshToken)
      : null;

    // Guardar en BD
    const connection = await prisma.socialMediaConnection.upsert({
      where: {
        companyId_platform: {
          companyId,
          platform,
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        accountId: accountInfo?.id,
        accountName: accountInfo?.name,
        accountHandle: accountInfo?.handle,
        connectedAt: new Date(),
        active: true,
      },
      create: {
        companyId,
        userId,
        platform,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        accountId: accountInfo?.id,
        accountName: accountInfo?.name,
        accountHandle: accountInfo?.handle,
        active: true,
      },
    });

    logger.info(`💾 Tokens saved for ${platform}`, {
      companyId,
      connectionId: connection.id,
    });

    return connection;

  } catch (error: any) {
    logger.error('❌ Error saving tokens:', error);
    throw new Error(`Failed to save tokens: ${error.message}`);
  }
}

/**
 * Obtiene tokens OAuth desde BD
 */
export async function getTokens(
  companyId: string,
  platform: SocialPlatform
): Promise<OAuthTokens | null> {
  try {
    const connection = await prisma.socialMediaConnection.findUnique({
      where: {
        companyId_platform: {
          companyId,
          platform,
        },
      },
    });

    if (!connection || !connection.active) {
      return null;
    }

    // Verificar si el token expiró
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      // Intentar refrescar si hay refresh token
      if (connection.refreshToken) {
        const decryptedRefreshToken = decryptToken(connection.refreshToken);
        const newTokens = await refreshAccessToken(platform, decryptedRefreshToken);
        
        // Guardar nuevos tokens
        await saveTokens(companyId, connection.userId, platform, newTokens);
        
        return newTokens;
      }

      // Si no hay refresh token, retornar null (requiere re-autenticación)
      logger.warn(`⚠️ Token expired and no refresh token for ${platform}`);
      return null;
    }

    // Desencriptar y retornar
    return {
      accessToken: decryptToken(connection.accessToken),
      refreshToken: connection.refreshToken
        ? decryptToken(connection.refreshToken)
        : undefined,
      expiresAt: connection.expiresAt || undefined,
      scope: connection.scope || undefined,
    };

  } catch (error: any) {
    logger.error('❌ Error getting tokens:', error);
    return null;
  }
}

/**
 * Desconecta una cuenta de redes sociales
 */
export async function disconnectAccount(
  companyId: string,
  platform: SocialPlatform
): Promise<boolean> {
  try {
    await prisma.socialMediaConnection.update({
      where: {
        companyId_platform: {
          companyId,
          platform,
        },
      },
      data: {
        active: false,
        disconnectedAt: new Date(),
      },
    });

    logger.info(`🔌 Account disconnected: ${platform}`, { companyId });
    return true;

  } catch (error: any) {
    logger.error('❌ Error disconnecting account:', error);
    return false;
  }
}

// ============================================================================
// ENCRIPTACIÓN (BÁSICA - MEJORAR EN PRODUCCIÓN)
// ============================================================================

/**
 * Encripta un token (usar KMS en producción)
 */
function encryptToken(token: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(
    process.env.NEXTAUTH_SECRET || 'fallback-secret',
    'salt',
    32
  );
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta un token
 */
function decryptToken(encryptedToken: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(
    process.env.NEXTAUTH_SECRET || 'fallback-secret',
    'salt',
    32
  );

  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================================================
// VERIFICACIÓN DE INFO DE CUENTA
// ============================================================================

/**
 * Obtiene información de la cuenta conectada
 */
export async function getAccountInfo(
  platform: SocialPlatform,
  accessToken: string
): Promise<any> {
  try {
    let url: string;
    let headers: any = {
      Authorization: `Bearer ${accessToken}`,
    };

    switch (platform) {
      case 'FACEBOOK':
      case 'INSTAGRAM':
        url = 'https://graph.facebook.com/v18.0/me?fields=id,name';
        break;
      case 'LINKEDIN':
        url = 'https://api.linkedin.com/v2/me';
        break;
      case 'TWITTER':
        url = 'https://api.twitter.com/2/users/me';
        break;
      default:
        throw new Error(`Platform ${platform} not supported`);
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch account info: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name || data.firstName + ' ' + data.lastName,
      handle: data.username || data.vanityName,
    };

  } catch (error: any) {
    logger.error('❌ Error fetching account info:', error);
    return null;
  }
}

export default {
  generateAuthUrl,
  validateState,
  exchangeCodeForToken,
  refreshAccessToken,
  saveTokens,
  getTokens,
  disconnectAccount,
  getAccountInfo,
};
