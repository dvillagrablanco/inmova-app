/**
 * Helper de scoping para Unidades (units).
 *
 * IMPORTANTE: dentro de un mismo edificio físico (Building) puede haber
 * unidades de distintas sociedades del MISMO grupo (caso real grupo Vidaro:
 * en C/ Reina 15 hay viviendas de Viroda + locales de Rovida en el mismo
 * edificio físico, y los garajes de Hernández de Tejada 6 son de Rovida
 * mientras que las viviendas son de Viroda).
 *
 * Modelo de propiedad:
 *   - `Unit.ownerCompanyId` (NUEVO, nullable): sociedad PROPIETARIA real de la
 *     unidad. Se usa para imputación contable, fiscal, alquiler, etc.
 *   - `Building.companyId`: sociedad GESTORA / responsable del edificio físico
 *     (administra zonas comunes, IBI del edificio, gastos de comunidad...).
 *   - Si `Unit.ownerCompanyId IS NULL`, se asume `Building.companyId`.
 *
 * Una unidad se considera DENTRO del scope de una empresa si:
 *   - `Unit.ownerCompanyId IN scope`  (propiedad explícita), O
 *   - `Unit.ownerCompanyId IS NULL` AND `Building.companyId IN scope`
 *     (compatibilidad con datos históricos sin ownerCompanyId)
 */

import type { Prisma } from '@prisma/client';

export function buildUnitScopeFilter(scopeCompanyIds: string[]): Prisma.UnitWhereInput {
  if (!scopeCompanyIds || scopeCompanyIds.length === 0) {
    return { id: '__no_scope__' }; // ningún resultado
  }

  return {
    OR: [
      { ownerCompanyId: { in: scopeCompanyIds } },
      {
        AND: [
          { ownerCompanyId: null },
          { building: { companyId: { in: scopeCompanyIds } } },
        ],
      },
    ],
  };
}

/**
 * Filtro de Unit para una sola empresa específica (estricto).
 * Útil para reports/contabilidad donde queremos solo lo de UNA sociedad
 * concreta del grupo.
 */
export function buildUnitOwnerFilter(companyId: string): Prisma.UnitWhereInput {
  return {
    OR: [
      { ownerCompanyId: companyId },
      {
        AND: [
          { ownerCompanyId: null },
          { building: { companyId } },
        ],
      },
    ],
  };
}

/**
 * Determina la empresa propietaria efectiva de una unit.
 */
export function getEffectiveOwnerCompanyId(unit: {
  ownerCompanyId?: string | null;
  building?: { companyId?: string | null } | null;
}): string | null {
  return unit.ownerCompanyId || unit.building?.companyId || null;
}
