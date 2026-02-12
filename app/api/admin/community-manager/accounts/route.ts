import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import { encryptField } from '@/lib/encryption';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PLATFORM_MAP: Record<string, 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'TWITTER'> = {
  facebook: 'FACEBOOK',
  instagram: 'INSTAGRAM',
  linkedin: 'LINKEDIN',
  twitter: 'TWITTER',
};

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

    const sessionUser = session.user as { role?: string | null; companyId?: string | null };
    const userRole = sessionUser?.role;
    if (!userRole || !['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const companyId = sessionUser?.companyId;
    if (!companyId) {
      return NextResponse.json({
        success: true,
        accounts: [],
        message: 'No hay empresa asociada para cargar cuentas.',
      });
    }

    const accounts = await prisma.socialMediaAccount.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = accounts
      .map((account) => ({
        id: account.id,
        platform: account.platform.toLowerCase(),
        name: account.accountName,
        username: account.accountId,
        followers: 0,
        connected: account.activo,
        lastPost: undefined as string | undefined,
      }))
      .filter((account) => Object.keys(PLATFORM_MAP).includes(account.platform));
    
    return NextResponse.json({
      success: true,
      accounts: formatted,
      message:
        formatted.length === 0
          ? 'No hay cuentas de redes sociales conectadas. Conecta tus cuentas para comenzar.'
          : undefined,
    });
  } catch (error: unknown) {
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

    const sessionUser = session.user as { role?: string | null; companyId?: string | null };
    const userRole = sessionUser?.role;
    if (!userRole || !['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      platform,
      accessToken,
      refreshToken,
      accountId,
      accountName,
      tokenExpiry,
      pageId,
      businessAccountId,
    } = body as {
      platform?: string;
      accessToken?: string;
      refreshToken?: string;
      accountId?: string;
      accountName?: string;
      tokenExpiry?: string;
      pageId?: string;
      businessAccountId?: string;
    };

    if (!platform || !accountId || !accountName) {
      return NextResponse.json(
        { error: 'Plataforma, accountId y accountName son requeridos' },
        { status: 400 }
      );
    }

    const companyId = sessionUser?.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'No hay empresa asociada para conectar cuentas' },
        { status: 400 }
      );
    }

    const platformValue = PLATFORM_MAP[platform.toLowerCase()];
    if (!platformValue) {
      return NextResponse.json(
        { error: 'Plataforma no soportada' },
        { status: 400 }
      );
    }

    const existing = await prisma.socialMediaAccount.findFirst({
      where: {
        companyId,
        platform: platformValue,
        accountId,
      },
    });

    const encryptedAccessToken = accessToken ? encryptField(accessToken) : null;
    const encryptedRefreshToken = refreshToken ? encryptField(refreshToken) : null;
    const expiryDate = tokenExpiry ? new Date(tokenExpiry) : null;

    const account = existing
      ? await prisma.socialMediaAccount.update({
          where: { id: existing.id },
          data: {
            accountName,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiry: expiryDate,
            pageId: pageId || null,
            businessAccountId: businessAccountId || null,
            activo: true,
          },
        })
      : await prisma.socialMediaAccount.create({
          data: {
            companyId,
            platform: platformValue,
            accountId,
            accountName,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiry: expiryDate,
            pageId: pageId || null,
            businessAccountId: businessAccountId || null,
            activo: true,
          },
        });
    
    return NextResponse.json({
      success: true,
      message: 'Cuenta conectada correctamente',
      account: {
        id: account.id,
        platform: account.platform.toLowerCase(),
        name: account.accountName,
        username: account.accountId,
        followers: 0,
        connected: account.activo,
      },
    });
  } catch (error: unknown) {
    logger.error('[Community Manager Connect Account Error]:', error);
    return NextResponse.json(
      { error: 'Error al conectar cuenta' },
      { status: 500 }
    );
  }
}
