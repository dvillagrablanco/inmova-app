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

/**
 * Calcula la liquidez REAL de una cuenta financiera.
 *
 * Reglas:
 * 1. saldo ≈ posiciones (±10%): el saldo ES el NAV → liquidez = 0
 * 2. posiciones >> saldo (>2x): posiciones duplicadas de otros custodios, saldo es NAV → liquidez = 0
 * 3. saldo > posiciones (diferencia > 10%): liquidez = saldo - posiciones (efectivo excedente)
 * 4. Sin posiciones: saldo es liquidez pura
 */
export function getAccountLiquidBalance(account: {
  saldoActual?: number | null;
  positions?: Array<{ valorActual?: number | null }>;
}): number {
  const saldo = account.saldoActual || 0;
  if (saldo <= 0) return 0;

  const positions = account.positions || [];
  const positionsValue = positions.reduce((sum, position) => sum + (position.valorActual || 0), 0);

  // Sin posiciones → saldo es liquidez pura (cuenta corriente)
  if (positionsValue <= 0) return saldo;

  // Caso 1: saldo ≈ posiciones (±10%) → saldo ES el NAV, no hay liquidez extra
  const ratio = Math.abs(saldo - positionsValue) / positionsValue;
  if (ratio < 0.1) return 0;

  // Caso 2: posiciones >> saldo (más del doble) → posiciones son de múltiples custodios,
  // el saldo representa el NAV real de la cuenta → no es liquidez adicional
  if (positionsValue > saldo * 2) return 0;

  // Caso 3: saldo > posiciones → hay efectivo excedente más allá de las posiciones
  if (saldo > positionsValue) {
    return Math.max(0, saldo - positionsValue);
  }

  // Caso por defecto: saldo < posiciones pero no es duplicado extremo
  return 0;
}
