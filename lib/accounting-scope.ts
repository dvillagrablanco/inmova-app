/**
 * Resolución de scope de empresa para APIs de contabilidad.
 * 
 * Soporta:
 * - Query param ?companyId=xxx (usado por selector de empresa)
 * - Cookie activeCompanyId (persistida por el selector)
 * - session.user.companyId como fallback
 * - Para holdings: incluye automáticamente las filiales (datos consolidados)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

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
  // 1. Obtener companyId del request (query param > cookie > session)
  const { searchParams } = new URL(request.url);
  const queryCompanyId = searchParams.get('companyId');
  const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
  
  const activeCompanyId = queryCompanyId || cookieCompanyId || sessionUser.companyId;
  
  if (!activeCompanyId) return null;

  // 2. Para super_admin/administrador, verificar si es holding
  const company = await prisma.company.findUnique({
    where: { id: activeCompanyId },
    select: {
      id: true,
      parentCompanyId: true,
      childCompanies: { select: { id: true } },
    },
  });

  if (!company) return null;

  // 3. Si tiene filiales (es holding), incluir datos consolidados
  const childIds = company.childCompanies.map((c) => c.id);
  
  if (childIds.length > 0) {
    return {
      companyIds: [activeCompanyId, ...childIds],
      activeCompanyId,
      isConsolidated: true,
    };
  }

  // 4. Empresa individual
  return {
    companyIds: [activeCompanyId],
    activeCompanyId,
    isConsolidated: false,
  };
}
