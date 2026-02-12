import type { UserRole } from '@/types/prisma-types';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

// Solo super_admin y soporte ven TODAS las empresas de la plataforma
const PLATFORM_ROLES = new Set<UserRole>(['super_admin', 'soporte']);

function getRequestedCompanyId(request: NextRequest | null | undefined): string | null {
  if (!request) return null;

  const headerCompanyId = request.headers.get('x-company-id');
  const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
  const { searchParams } = new URL(request.url);
  const queryCompanyId = searchParams.get('companyId');

  return queryCompanyId || headerCompanyId || cookieCompanyId || null;
}

async function getChildCompanyIds(companyId: string): Promise<string[]> {
  const children = await prisma.company.findMany({
    where: { parentCompanyId: companyId },
    select: { id: true },
  });

  return children.map((child) => child.id);
}

async function getAccessibleCompanyIds(
  userId: string,
  role: UserRole,
  primaryCompanyId: string | null | undefined
): Promise<string[]> {
  // Solo super_admin y soporte ven TODAS las empresas
  if (PLATFORM_ROLES.has(role)) {
    const companies = await prisma.company.findMany({
      select: { id: true },
    });
    return companies.map((company) => company.id);
  }

  // Para administrador, gestor y otros roles:
  // Recopilar empresas del userCompanyAccess + primaryCompany + hijas de las que tienen acceso
  const accessEntries = await prisma.userCompanyAccess.findMany({
    where: {
      userId,
      activo: true,
    },
    select: { companyId: true },
  });

  const ids = new Set(accessEntries.map((entry) => entry.companyId));
  if (primaryCompanyId) {
    ids.add(primaryCompanyId);
  }

  // Para administrador y gestor: incluir también las empresas hijas
  if (role === 'administrador' || role === 'gestor') {
    const parentIds = Array.from(ids);
    for (const parentId of parentIds) {
      const childIds = await getChildCompanyIds(parentId);
      childIds.forEach((id) => ids.add(id));
    }
  }

  return Array.from(ids);
}

export async function resolveCompanyScope(params: {
  userId: string;
  role: UserRole;
  primaryCompanyId: string | null | undefined;
  request: NextRequest;
}) {
  const { userId, role, primaryCompanyId, request } = params;
  const requestedCompanyId = getRequestedCompanyId(request);

  const accessibleCompanyIds = await getAccessibleCompanyIds(userId, role, primaryCompanyId);
  const fallbackCompanyId = primaryCompanyId || accessibleCompanyIds[0] || null;

  const activeCompanyId =
    requestedCompanyId && accessibleCompanyIds.includes(requestedCompanyId)
      ? requestedCompanyId
      : fallbackCompanyId;

  if (!activeCompanyId) {
    return {
      activeCompanyId: null,
      accessibleCompanyIds,
      scopeCompanyIds: [],
      isConsolidated: false,
    };
  }

  const childCompanyIds = await getChildCompanyIds(activeCompanyId);
  const scopeCompanyIds =
    childCompanyIds.length > 0 ? [activeCompanyId, ...childCompanyIds] : [activeCompanyId];

  return {
    activeCompanyId,
    accessibleCompanyIds,
    scopeCompanyIds,
    isConsolidated: scopeCompanyIds.length > 1,
  };
}

export async function canAccessCompany(params: {
  userId: string;
  role: UserRole;
  primaryCompanyId: string | null | undefined;
  companyId: string;
}) {
  const { userId, role, primaryCompanyId, companyId } = params;
  const accessibleCompanyIds = await getAccessibleCompanyIds(userId, role, primaryCompanyId);
  return accessibleCompanyIds.includes(companyId);
}

/**
 * Helper rápido para APIs que solo necesitan el companyId activo.
 * Prioridad: cookie activeCompanyId > session.user.companyId
 * Usar esto en APIs que aún no migraron a resolveCompanyScope completo.
 */
export function getActiveCompanyId(
  request: NextRequest,
  sessionCompanyId: string | null | undefined
): string | null {
  const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
  const headerCompanyId = request.headers.get('x-company-id');
  const { searchParams } = new URL(request.url);
  const queryCompanyId = searchParams.get('companyId');
  
  return queryCompanyId || headerCompanyId || cookieCompanyId || sessionCompanyId || null;
}
