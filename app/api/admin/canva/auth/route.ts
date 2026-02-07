import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import { encryptField } from '@/lib/encryption';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Canva OAuth configuration
const CANVA_AUTH_URL = 'https://www.canva.com/api/oauth/authorize';
const CANVA_TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token';

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
});

const bodySchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const extractCredentials = (value: unknown) => {
  const record = toObjectRecord(value);
  return {
    accessToken: typeof record.accessToken === 'string' ? record.accessToken : undefined,
    refreshToken: typeof record.refreshToken === 'string' ? record.refreshToken : undefined,
    expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : undefined,
    scope: typeof record.scope === 'string' ? record.scope : undefined,
    tokenType: typeof record.tokenType === 'string' ? record.tokenType : undefined,
  };
};

const maskToken = (token?: string) => {
  if (!token) return null;
  return token.length > 8 ? `****${token.slice(-8)}` : '****';
};

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
  if (role && companyId) {
    return { role, companyId };
  }

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true },
  });

  return {
    role: role ?? user?.role ?? null,
    companyId: companyId ?? user?.companyId ?? null,
  };
};

// GET - Iniciar OAuth flow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    const allowedRoles = ['super_admin', 'superadmin', 'admin', 'administrador'];
    const userRole = sessionUser?.role?.toLowerCase();

    if (!sessionUser?.id || !userRole || !allowedRoles.includes(userRole)) {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Canva Auth Error]:', { message });
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
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    const allowedRoles = ['super_admin', 'superadmin', 'admin', 'administrador'];
    const userRole = sessionUser?.role?.toLowerCase();

    if (!sessionUser?.id || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const { code, state } = body;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8')) as {
          userId?: string;
        };
        if (decoded.userId && decoded.userId !== sessionUser.id) {
          return NextResponse.json(
            { error: 'State inválido para este usuario' },
            { status: 400 }
          );
        }
      } catch (stateError) {
        logger.warn('[Canva Auth] State inválido', { stateError });
      }
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

    const tokens = tokenResponseSchema.parse(await tokenResponse.json());
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : undefined;

    const { role, companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!role || !companyId) {
      return NextResponse.json(
        { error: 'No se pudo determinar la empresa del usuario' },
        { status: 400 }
      );
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const existing = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: 'canva' } },
      select: { credentials: true, settings: true },
    });

    const existingCreds = extractCredentials(existing?.credentials);
    const nextCredentials = {
      accessToken: encryptField(tokens.access_token),
      refreshToken: tokens.refresh_token
        ? encryptField(tokens.refresh_token)
        : existingCreds.refreshToken,
      expiresAt: expiresAt ?? existingCreds.expiresAt,
      scope: tokens.scope ?? existingCreds.scope,
      tokenType: tokens.token_type ?? existingCreds.tokenType,
    };

    const baseSettings = toObjectRecord(existing?.settings);
    const nextSettings = { ...baseSettings, connectedAt: new Date().toISOString() };

    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'canva' } },
      create: {
        companyId,
        provider: 'canva',
        name: 'Canva',
        category: 'design',
        credentials: nextCredentials,
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        createdBy: sessionUser.id,
        lastSyncAt: new Date(),
      },
      update: {
        credentials: nextCredentials,
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Canva conectado exitosamente',
      tokens: {
        accessToken: maskToken(tokens.access_token),
        refreshToken: maskToken(tokens.refresh_token),
        expiresIn: tokens.expires_in ?? null,
        expiresAt: expiresAt ?? null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Canva Token Exchange Error]:', { message });
    return NextResponse.json(
      { error: 'Error en el intercambio de tokens' },
      { status: 500 }
    );
  }
}
