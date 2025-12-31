/**
 * API v1 - Sistema de Autenticación
 * Soporta API Keys y OAuth 2.0 Access Tokens
 */

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import crypto from 'crypto';

export interface AuthContext {
  valid: boolean;
  companyId?: string;
  userId?: string;
  scopes?: string[];
  authMethod?: 'api_key' | 'oauth_token';
  rateLimit?: number;
}

/**
 * Valida un API Key
 */
export async function validateApiKey(apiKey: string): Promise<AuthContext> {
  try {
    // Verificar formato
    if (!apiKey || !apiKey.startsWith('sk_')) {
      return { valid: false };
    }

    // Buscar en BD (key está hasheada)
    const keyHash = hashApiKey(apiKey);

    const keyRecord = await prisma.apiKey.findUnique({
      where: {
        key: keyHash,
        status: 'ACTIVE',
      },
      include: {
        company: {
          select: {
            id: true,
            activo: true,
          },
        },
      },
    });

    if (!keyRecord) {
      return { valid: false };
    }

    // Verificar que la empresa esté activa
    if (!keyRecord.company.activo) {
      return { valid: false };
    }

    // Verificar expiración
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return { valid: false };
    }

    // Actualizar último uso
    await prisma.apiKey
      .update({
        where: { id: keyRecord.id },
        data: {
          lastUsedAt: new Date(),
        },
      })
      .catch((err) => {
        logger.error('Error updating lastUsedAt for API key:', err);
      });

    return {
      valid: true,
      companyId: keyRecord.companyId,
      userId: keyRecord.createdBy,
      scopes: keyRecord.scopes,
      authMethod: 'api_key',
      rateLimit: keyRecord.rateLimit,
    };
  } catch (error) {
    logger.error('Error validating API key:', error);
    return { valid: false };
  }
}

/**
 * Valida un OAuth Access Token
 */
export async function validateOAuthToken(token: string): Promise<AuthContext> {
  try {
    if (!token || !token.startsWith('oauth_')) {
      return { valid: false };
    }

    const tokenRecord = await prisma.oAuthAccessToken.findUnique({
      where: {
        token,
        revoked: false,
      },
      include: {
        company: {
          select: {
            id: true,
            activo: true,
          },
        },
        app: {
          select: {
            rateLimit: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      return { valid: false };
    }

    // Verificar expiración
    if (tokenRecord.expiresAt < new Date()) {
      return { valid: false };
    }

    // Verificar que la empresa esté activa
    if (!tokenRecord.company.activo) {
      return { valid: false };
    }

    // Actualizar último uso
    await prisma.oAuthAccessToken
      .update({
        where: { id: tokenRecord.id },
        data: {
          lastUsedAt: new Date(),
        },
      })
      .catch((err) => {
        logger.error('Error updating lastUsedAt for OAuth token:', err);
      });

    return {
      valid: true,
      companyId: tokenRecord.companyId,
      userId: tokenRecord.userId,
      scopes: tokenRecord.scopes,
      authMethod: 'oauth_token',
      rateLimit: tokenRecord.app.rateLimit,
    };
  } catch (error) {
    logger.error('Error validating OAuth token:', error);
    return { valid: false };
  }
}

/**
 * Middleware de autenticación para API v1
 */
export async function authenticateRequest(authorization: string | null): Promise<AuthContext> {
  if (!authorization) {
    return { valid: false };
  }

  // Extraer token
  const token = authorization.replace(/^Bearer\s+/i, '');

  // Intentar validar como API Key
  if (token.startsWith('sk_')) {
    return await validateApiKey(token);
  }

  // Intentar validar como OAuth token
  if (token.startsWith('oauth_')) {
    return await validateOAuthToken(token);
  }

  return { valid: false };
}

/**
 * Verificar que el auth context tenga un scope específico
 */
export function hasScope(authContext: AuthContext, requiredScope: string): boolean {
  if (!authContext.valid || !authContext.scopes) {
    return false;
  }

  // Verificar scope exacto
  if (authContext.scopes.includes(requiredScope)) {
    return true;
  }

  // Verificar wildcard (ej: admin:* permite admin:read, admin:write, etc.)
  const scopeParts = requiredScope.split(':');
  if (scopeParts.length === 2) {
    const wildcardScope = `${scopeParts[0]}:*`;
    if (authContext.scopes.includes(wildcardScope)) {
      return true;
    }
  }

  return false;
}

/**
 * Genera un nuevo API Key
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): {
  key: string;
  keyHash: string;
  keyPrefix: string;
} {
  const prefix = environment === 'live' ? 'sk_live_' : 'sk_test_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `${prefix}${randomBytes}`;
  const keyHash = hashApiKey(key);
  const keyPrefix = key.substring(0, 16); // Primeros 16 chars para display

  return {
    key, // Mostrar UNA VEZ al usuario
    keyHash, // Guardar en BD
    keyPrefix, // Para mostrar en UI (sk_live_abc12345...)
  };
}

/**
 * Hash de API Key (SHA-256)
 */
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Genera un token aleatorio seguro
 */
export function generateSecureToken(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verificar si un scope es válido
 */
export function isValidScope(scope: string): boolean {
  const validScopes = [
    'properties:read',
    'properties:write',
    'tenants:read',
    'tenants:write',
    'contracts:read',
    'contracts:write',
    'payments:read',
    'payments:write',
    'documents:read',
    'documents:write',
    'maintenance:read',
    'maintenance:write',
    'webhooks:read',
    'webhooks:write',
    'admin:*', // Acceso completo
  ];

  return validScopes.includes(scope) || scope.endsWith(':*');
}

/**
 * Parsear scopes de string a array
 */
export function parseScopes(scopesString: string): string[] {
  return scopesString
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && isValidScope(s));
}
