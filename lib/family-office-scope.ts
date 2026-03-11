import type { NextRequest } from 'next/server';

import { prisma } from '@/lib/db';
import { resolveCompanyScope } from '@/lib/company-scope';
import type { UserRole } from '@/types/prisma-types';

type SessionUserLike = {
  id: string;
  role: string;
  companyId?: string | null;
};

export async function resolveFamilyOfficeScope(
  request: NextRequest,
  user: SessionUserLike
): Promise<{
  activeCompanyId: string;
  rootCompanyId: string;
  rootCompanyName: string;
  groupCompanyIds: string[];
}> {
  if (!user.companyId) {
    throw new Error('Empresa no definida');
  }

  const scope = await resolveCompanyScope({
    userId: user.id,
    role: user.role as UserRole,
    primaryCompanyId: user.companyId,
    request,
  });

  const activeCompanyId = scope.activeCompanyId || user.companyId;
  const activeCompany = await prisma.company.findUnique({
    where: { id: activeCompanyId },
    select: {
      id: true,
      nombre: true,
      parentCompanyId: true,
      parentCompany: {
        select: { id: true, nombre: true },
      },
    },
  });

  const rootCompanyId = activeCompany?.parentCompany?.id || activeCompany?.id || activeCompanyId;
  const rootCompanyName = activeCompany?.parentCompany?.nombre || activeCompany?.nombre || 'Grupo';

  const groupCompanyIds =
    scope.scopeCompanyIds.length > 0 ? Array.from(new Set(scope.scopeCompanyIds)) : [rootCompanyId];

  return {
    activeCompanyId,
    rootCompanyId,
    rootCompanyName,
    groupCompanyIds,
  };
}

export function normalizeInvestmentVehicleName(value: string | null | undefined): string {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  return normalized || 'DIRECTO';
}

export function getAccountLiquidBalance(account: {
  saldoActual?: number | null;
  positions?: Array<{ valorActual?: number | null }>;
}): number {
  const saldo = account.saldoActual || 0;
  const positions = account.positions || [];
  const positionsValue = positions.reduce((sum, position) => sum + (position.valorActual || 0), 0);

  const isDuplicatedNav =
    positionsValue > 1000 &&
    saldo > 1000 &&
    Math.abs(saldo - positionsValue) / positionsValue < 0.1;

  return isDuplicatedNav ? 0 : saldo;
}
