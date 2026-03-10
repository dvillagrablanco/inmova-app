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

/**
 * Si la empresa actual es filial (tiene parent), devuelve el grupo completo:
 * parent + todas las hermanas (otras filiales del mismo parent).
 * Permite que un usuario de Viroda vea datos de Rovida (ambas filiales de Vidaro).
 */
async function getGroupCompanyIds(companyId: string): Promise<string[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { parentCompanyId: true },
  });

  if (!company?.parentCompanyId) return [];

  const siblings = await prisma.company.findMany({
    where: { parentCompanyId: company.parentCompanyId },
    select: { id: true },
  });

  return [company.parentCompanyId, ...siblings.map(s => s.id)];
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

  // Para administrador y gestor: incluir empresas hijas y grupo (hermanas)
  if (role === 'administrador' || role === 'gestor') {
    const currentIds = Array.from(ids);
    for (const compId of currentIds) {
      const childIds = await getChildCompanyIds(compId);
      childIds.forEach((id) => ids.add(id));
      const groupIds = await getGroupCompanyIds(compId);
      groupIds.forEach((id) => ids.add(id));
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

  // Si la empresa activa es holding (tiene hijas), scope = ella + hijas
  // Si la empresa activa es filial (tiene parent), scope = grupo completo (parent + hermanas)
  const childCompanyIds = await getChildCompanyIds(activeCompanyId);
  let scopeCompanyIds: string[];

  if (childCompanyIds.length > 0) {
    scopeCompanyIds = [activeCompanyId, ...childCompanyIds];
  } else {
    const groupIds = await getGroupCompanyIds(activeCompanyId);
    scopeCompanyIds = groupIds.length > 0
      ? [...new Set([activeCompanyId, ...groupIds])]
      : [activeCompanyId];
  }

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
