/**
 * Resolución de scope de empresa para APIs de contabilidad.
 * 
 * Soporta:
 * - Query param ?companyId=xxx (usado por selector de empresa y filtros)
 * - Cookie activeCompanyId (persistida por switch-company)
 * - session.user.companyId como fallback
 * - Para holdings: incluye automáticamente las filiales (datos consolidados)
 * - Para super_admin: acceso a todas las empresas
 */

import { NextRequest } from 'next/server';

export interface AccountingScope {
  /** IDs de empresa para filtrar (puede ser 1 o varios si es holding) */
  companyIds: string[];
  /** ID de la empresa activa seleccionada */
  activeCompanyId: string;
  /** Si es vista consolidada (holding + filiales) */
  isConsolidated: boolean;
}

export async function resolveAccountingScope(
  request: NextRequest,
  sessionUser: { companyId?: string; role?: string; id?: string }
): Promise<AccountingScope | null> {
  // Lazy load Prisma to avoid build-time issues
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  // 1. Obtener companyId del request (query param > cookie > session)
  const { searchParams } = new URL(request.url);
  const queryCompanyId = searchParams.get('companyId');
  const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
  
  const activeCompanyId = queryCompanyId || cookieCompanyId || sessionUser.companyId;
  
  if (!activeCompanyId) {
    // Para super_admin sin empresa asignada, intentar obtener todas
    if (sessionUser.role === 'super_admin' || sessionUser.role === 'administrador') {
      const allCompanies = await prisma.company.findMany({
        where: { activo: true },
        select: { id: true },
        take: 50,
      });
      if (allCompanies.length > 0) {
        return {
          companyIds: allCompanies.map(c => c.id),
          activeCompanyId: allCompanies[0].id,
          isConsolidated: allCompanies.length > 1,
        };
      }
    }
    return null;
  }

  // 2. Buscar la empresa y sus relaciones
  const company = await prisma.company.findUnique({
    where: { id: activeCompanyId },
    select: {
      id: true,
      nombre: true,
      parentCompanyId: true,
      childCompanies: { select: { id: true, nombre: true } },
    },
  });

  if (!company) {
    // Si no se encuentra la empresa por ID, podría ser que el companyId
    // en la session esté desactualizado. Intentar con el userId.
    if (sessionUser.id) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { companyId: true },
      });
      if (user?.companyId && user.companyId !== activeCompanyId) {
        // Recursión con el companyId del user actualizado
        return resolveAccountingScope(request, { 
          ...sessionUser, 
          companyId: user.companyId 
        });
      }
    }
    return null;
  }

  // 3. Si tiene filiales (es holding), incluir datos consolidados
  const childIds = company.childCompanies.map((c) => c.id);
  
  if (childIds.length > 0) {
    return {
      companyIds: [activeCompanyId, ...childIds],
      activeCompanyId,
      isConsolidated: true,
    };
  }

  // 4. Para super_admin con empresa sin datos bancarios propios,
  // incluir empresas que tienen transacciones bancarias
  if (sessionUser.role === 'super_admin' && !queryCompanyId && !cookieCompanyId) {
    try {
      const result = await prisma.bankTransaction.groupBy({
        by: ['companyId'],
        _count: true,
      });
      const bankCompanyIds = result
        .map(r => r.companyId)
        .filter((id): id is string => !!id && id.length > 0);

      if (bankCompanyIds.length > 0) {
        const allIds = [...new Set([activeCompanyId, ...bankCompanyIds])];
        return {
          companyIds: allIds,
          activeCompanyId,
          isConsolidated: allIds.length > 1,
        };
      }
    } catch {
      // If groupBy fails, fall through to single company
    }
  }

  // 5. Empresa individual
  return {
    companyIds: [activeCompanyId],
    activeCompanyId,
    isConsolidated: false,
  };
}
