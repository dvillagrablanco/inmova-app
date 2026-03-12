/**
 * POST /api/open-banking/tink/connect
 * Genera un enlace de Tink Link para conectar una cuenta bancaria
 * 
 * Body: { market?: string, bankId?: string }
 * Returns: { tinkLinkUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { canAccessCompany } from '@/lib/company-scope';
import logger from '@/lib/logger';
import type { UserRole } from '@/types/prisma-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const ROLE_ALLOWLIST: UserRole[] = [
  'super_admin',
  'administrador',
  'gestor',
  'operador',
  'soporte',
  'community_manager',
  'socio_ewoorker',
  'contratista_ewoorker',
  'subcontratista_ewoorker',
];

function resolveUserRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') {
    return null;
  }

  return ROLE_ALLOWLIST.includes(role as UserRole) ? (role as UserRole) : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const {
      isTinkConfigured,
      createUser,
      generateTinkLink,
      buildTinkExternalUserId,
    } = await import(
      '@/lib/tink-service'
    );

    if (!isTinkConfigured()) {
      return NextResponse.json({ error: 'Tink no configurado' }, { status: 503 });
    }

    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const prisma = await getPrisma();
    const role = resolveUserRole((session.user as any).role);
    const humanIdHint =
      (session.user as any).name ||
      (session.user as any).email ||
      `Usuario ${userId}`;

    if (!role) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 403 });
    }

    const targetCompanyId = body.companyId || companyId;
    const hasAccess = await canAccessCompany({
      userId,
      role,
      primaryCompanyId: companyId,
      companyId: targetCompanyId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso a la sociedad solicitada' }, { status: 403 });
    }

    // Crear SIEMPRE un usuario Tink nuevo por intento de conexión.
    // Tink exige su user_id interno, no el external_user_id.
    const tinkExternalUserId = `${buildTinkExternalUserId(targetCompanyId, userId)}_${Date.now()}`;
    const tinkUserId = await createUser(tinkExternalUserId, body.market || 'ES');

    let connection = await prisma.bankConnection.findFirst({
      where: { companyId: targetCompanyId, userId, proveedor: 'tink' },
      orderBy: { createdAt: 'desc' },
    });

    if (connection) {
      connection = await prisma.bankConnection.update({
        where: { id: connection.id },
        data: {
          provider: 'tink',
          nombreBanco: body.bankId || body.providerName || 'Tink Open Banking',
          estado: 'renovacion_requerida',
          errorDetalle: null,
          scope: 'AIS',
          accessToken: tinkUserId, // user_id interno de Tink
          refreshToken: tinkExternalUserId, // external_user_id para trazabilidad
        },
      });
    } else {
      connection = await prisma.bankConnection.create({
        data: {
          companyId: targetCompanyId,
          userId,
          proveedor: 'tink',
          provider: 'tink',
          nombreBanco: body.bankId || body.providerName || 'Tink Open Banking',
          estado: 'renovacion_requerida',
          scope: 'AIS',
          accessToken: tinkUserId, // user_id interno de Tink
          refreshToken: tinkExternalUserId, // external_user_id para trazabilidad
        },
      });
    }

    // Generate Tink Link
    const appUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const redirectUri = new URL('/api/open-banking/tink/callback', appUrl);
    redirectUri.searchParams.set('companyId', targetCompanyId);
    redirectUri.searchParams.set('userId', userId);
    redirectUri.searchParams.set('connectionId', connection.id);

    const tinkLinkUrl = await generateTinkLink({
      userId: tinkUserId,
      idHint: humanIdHint,
      market: body.market || 'ES',
      redirectUri: redirectUri.toString(),
    });

    logger.info('[Tink] Connect link generated', {
      companyId: targetCompanyId,
      tinkUserId,
      connectionId: connection.id,
    });

    return NextResponse.json({
      success: true,
      tinkLinkUrl,
      tinkUserId,
      connectionId: connection.id,
      companyId: targetCompanyId,
    });
  } catch (error: any) {
    logger.error('[Tink Connect]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/open-banking/tink/connect
 * Verifica el estado de conexión de Tink
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { isTinkConfigured, testConnection, SPANISH_BANKS } = await import('@/lib/tink-service');

    const configured = isTinkConfigured();
    let connectionTest = { ok: false, message: 'No configurado' };
    
    if (configured) {
      connectionTest = await testConnection();
    }

    return NextResponse.json({
      configured,
      connected: connectionTest.ok,
      message: connectionTest.message,
      availableBanks: SPANISH_BANKS,
    });
  } catch (error: any) {
    logger.error('[Tink Status]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
