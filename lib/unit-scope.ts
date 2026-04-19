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

/**
 * Filtros equivalentes para Payment, Expense, Contract.
 *
 * IMPORTANTE: estos filtros recorren la cadena
 *   Payment → contract → unit → ownerCompanyId / building.companyId
 *   Expense → unit → ownerCompanyId / building.companyId
 *   Expense → building → companyId  (gastos sin unit asociada, p. ej. comunidad/IBI edificio)
 *   Contract → unit → ownerCompanyId / building.companyId
 *
 * Reglas:
 *  - Si la entidad está vinculada a una unidad CON ownerCompanyId, ese owner manda.
 *  - Si está vinculada a una unidad SIN ownerCompanyId, hereda Building.companyId.
 *  - Si está vinculada solo a un Building (Expense de zonas comunes), filtra por
 *    Building.companyId.
 */

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

/**
 * Filtro Payment: imputa ingresos a la sociedad PROPIETARIA real de la unidad
 * vinculada al contrato. Si la unidad no tiene owner explícito, hereda del
 * building.
 */
export function buildPaymentScopeFilter(
  scopeCompanyIds: string[]
): Prisma.PaymentWhereInput {
  if (!scopeCompanyIds || scopeCompanyIds.length === 0) {
    return { id: '__no_scope__' };
  }
  return {
    contract: {
      unit: {
        OR: [
          { ownerCompanyId: { in: scopeCompanyIds } },
          {
            AND: [
              { ownerCompanyId: null },
              { building: { companyId: { in: scopeCompanyIds } } },
            ],
          },
        ],
      },
    },
  };
}

/**
 * Filtro Expense:
 *  - Gastos vinculados a una unidad → propietaria de la unidad (con fallback)
 *  - Gastos vinculados solo a un edificio → empresa gestora del edificio
 */
export function buildExpenseScopeFilter(
  scopeCompanyIds: string[]
): Prisma.ExpenseWhereInput {
  if (!scopeCompanyIds || scopeCompanyIds.length === 0) {
    return { id: '__no_scope__' };
  }
  return {
    OR: [
      // Caso 1: gasto a nivel unidad → owner de la unidad
      {
        unit: {
          OR: [
            { ownerCompanyId: { in: scopeCompanyIds } },
            {
              AND: [
                { ownerCompanyId: null },
                { building: { companyId: { in: scopeCompanyIds } } },
              ],
            },
          ],
        },
      },
      // Caso 2: gasto solo a nivel edificio (zonas comunes, IBI edificio) →
      // empresa gestora del edificio
      {
        AND: [
          { unitId: null },
          { building: { companyId: { in: scopeCompanyIds } } },
        ],
      },
    ],
  };
}

/**
 * Filtro Contract: el contrato pertenece a la sociedad propietaria real de
 * la unidad asociada.
 */
export function buildContractScopeFilter(
  scopeCompanyIds: string[]
): Prisma.ContractWhereInput {
  if (!scopeCompanyIds || scopeCompanyIds.length === 0) {
    return { id: '__no_scope__' };
  }
  return {
    unit: {
      OR: [
        { ownerCompanyId: { in: scopeCompanyIds } },
        {
          AND: [
            { ownerCompanyId: null },
            { building: { companyId: { in: scopeCompanyIds } } },
          ],
        },
      ],
    },
  };
}

/**
 * Filtros estrictos para una sola sociedad (ej: P&L oficial de Rovida sin
 * mezclar Viroda).
 */
export function buildPaymentOwnerFilter(companyId: string): Prisma.PaymentWhereInput {
  return {
    contract: {
      unit: {
        OR: [
          { ownerCompanyId: companyId },
          {
            AND: [
              { ownerCompanyId: null },
              { building: { companyId } },
            ],
          },
        ],
      },
    },
  };
}

export function buildExpenseOwnerFilter(companyId: string): Prisma.ExpenseWhereInput {
  return {
    OR: [
      {
        unit: {
          OR: [
            { ownerCompanyId: companyId },
            {
              AND: [
                { ownerCompanyId: null },
                { building: { companyId } },
              ],
            },
          ],
        },
      },
      {
        AND: [{ unitId: null }, { building: { companyId } }],
      },
    ],
  };
}
