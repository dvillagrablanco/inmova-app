import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
  const prisma = await getPrisma();
  if (role && companyId) {
    return { role, companyId };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true },
  });

  return {
    role: role ?? user?.role ?? null,
    companyId: companyId ?? user?.companyId ?? null,
  };
};

/**
 * GET /api/admin/canva/status
 * Verifica el estado de conexión con Canva
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!role || !['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
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
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: 'canva' } },
      select: { credentials: true },
    });

    const creds = extractCredentials(integration?.credentials);
    const tokenExpiry = creds.expiresAt ? Date.parse(creds.expiresAt) : null;
    const tokenValid = tokenExpiry ? tokenExpiry > Date.now() : Boolean(creds.accessToken);
    const connected = Boolean(creds.accessToken) && tokenValid;

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      connected,
      tokenExpiresAt: creds.expiresAt ?? null,
      message: isConfigured 
        ? 'Canva configurado. Inicia sesión para conectar tu cuenta.'
        : 'Canva no configurado. Añade las credenciales en el panel de integraciones.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Canva Status Error]:', { message });
    return NextResponse.json(
      { error: 'Error al verificar estado de Canva' },
      { status: 500 }
    );
  }
}
