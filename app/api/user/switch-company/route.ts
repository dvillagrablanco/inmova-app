import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { canAccessCompany } from '@/lib/company-scope';
import type { UserRole } from '@prisma/client';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
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

async function resolveUserRole(role: unknown): UserRole | null {
  const prisma = await getPrisma();
  if (typeof role !== 'string') {
    return null;
  }
  return ROLE_ALLOWLIST.includes(role as UserRole) ? (role as UserRole) : null;
}

/**
 * POST /api/user/switch-company
 * Cambia la empresa activa del usuario
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'El ID de la empresa es requerido' },
        { status: 400 }
      );
    }

    const role = resolveUserRole(session.user.role);
    if (!role) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    const hasAccess = await canAccessCompany({
      userId: session.user.id,
      role,
      primaryCompanyId: user?.companyId,
      companyId,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta empresa' },
        { status: 403 }
      );
    }

    const accessEntry = await prisma.userCompanyAccess.findUnique({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
    });

    if (accessEntry) {
      await prisma.userCompanyAccess.update({
        where: {
          userId_companyId: {
            userId: session.user.id,
            companyId,
          },
        },
        data: {
          lastAccess: new Date(),
        },
      });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { companyId },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Empresa cambiada exitosamente',
      companyId,
      redirect: true,
    });

    response.cookies.set('activeCompanyId', companyId, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    logger.error('Error switching company:', error);
    return NextResponse.json(
      { error: 'Error al cambiar de empresa' },
      { status: 500 }
    );
  }
}
