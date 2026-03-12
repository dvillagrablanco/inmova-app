import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createRequisition, isNordigenConfigured } from '@/lib/nordigen-service';
import { getPrismaClient } from '@/lib/db';
import { canAccessCompany } from '@/lib/company-scope';
import logger from '@/lib/logger';
import type { UserRole } from '@/types/prisma-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

/**
 * POST /api/open-banking/nordigen/connect
 * Inicia conexión con un banco via Nordigen
 * Body: { institutionId: string, institutionName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isNordigenConfigured()) {
      return NextResponse.json({ error: 'Nordigen no configurado' }, { status: 503 });
    }

    const { institutionId, institutionName, companyId } = await request.json();
    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId requerido' }, { status: 400 });
    }

    const role = resolveUserRole(session.user.role);
    if (!role) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 403 });
    }

    const targetCompanyId = companyId || session.user.companyId;
    const hasAccess = await canAccessCompany({
      userId: session.user.id,
      role,
      primaryCompanyId: session.user.companyId,
      companyId: targetCompanyId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso a la sociedad solicitada' }, { status: 403 });
    }

    const result = await createRequisition({
      institutionId,
      companyId: targetCompanyId,
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json({ error: 'Error creando conexión' }, { status: 500 });
    }

    // Save pending connection to DB
    const prisma = getPrismaClient();
    await prisma.bankConnection.create({
      data: {
        companyId: targetCompanyId,
        userId: session.user.id,
        proveedor: 'nordigen',
        provider: 'nordigen',
        proveedorItemId: result.requisitionId,
        nombreBanco: institutionName || institutionId,
        estado: 'renovacion_requerida', // Pending user auth
        consentId: result.requisitionId,
      },
    });

    logger.info(`[Nordigen] Conexión iniciada: ${result.requisitionId} para ${institutionId}`);

    return NextResponse.json({
      success: true,
      requisitionId: result.requisitionId,
      link: result.link,
      redirectUrl: result.link,
      companyId: targetCompanyId,
      message: 'Redirigir al usuario al link para autorizar acceso bancario',
    });
  } catch (error: any) {
    logger.error('[Nordigen Connect Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
