/**
 * Demo Data Filter - Filtros centralizados para excluir datos de demostración
 * 
 * IMPORTANTE: Según cursorrules, los datos de demo NO deben influir en
 * las estadísticas o métricas de la aplicación.
 * 
 * Este módulo proporciona filtros reutilizables para todas las consultas
 * que calculan métricas o estadísticas.
 */

import { Prisma } from '@prisma/client';

/**
 * Filtro base para excluir empresas de prueba/demo
 * Usar en todas las consultas de Company
 */
export const excludeDemoCompany: Prisma.CompanyWhereInput = {
  esEmpresaPrueba: false,
};

/**
 * Filtro para excluir edificios demo
 * Usar en todas las consultas de Building
 */
export const excludeDemoBuilding: Prisma.BuildingWhereInput = {
  isDemo: false,
  company: excludeDemoCompany,
};

/**
 * Filtro para excluir unidades demo
 * Usar en todas las consultas de Unit
 */
export const excludeDemoUnit: Prisma.UnitWhereInput = {
  isDemo: false,
  building: excludeDemoBuilding,
};

/**
 * Filtro para excluir inquilinos demo
 * Usar en todas las consultas de Tenant
 */
export const excludeDemoTenant: Prisma.TenantWhereInput = {
  isDemo: false,
  company: excludeDemoCompany,
};

/**
 * Filtro para excluir contratos demo
 * Usar en todas las consultas de Contract
 */
export const excludeDemoContract: Prisma.ContractWhereInput = {
  isDemo: false,
  unit: excludeDemoUnit,
};

/**
 * Filtro para excluir pagos demo
 * Usar en todas las consultas de Payment
 */
export const excludeDemoPayment: Prisma.PaymentWhereInput = {
  isDemo: false,
  contract: excludeDemoContract,
};

/**
 * Filtro para excluir gastos demo
 * Usar en todas las consultas de Expense
 */
export const excludeDemoExpense: Prisma.ExpenseWhereInput = {
  isDemo: false,
  OR: [
    { building: excludeDemoBuilding },
    { unit: excludeDemoUnit },
  ],
};

/**
 * Filtro para excluir solicitudes de mantenimiento demo
 * Usar en todas las consultas de MaintenanceRequest
 */
export const excludeDemoMaintenanceRequest: Prisma.MaintenanceRequestWhereInput = {
  isDemo: false,
  unit: excludeDemoUnit,
};

/**
 * Helper para combinar filtros existentes con exclusión de demo
 * @param existingFilter - Filtro existente
 * @param demoFilter - Filtro de exclusión de demo
 * @returns Filtro combinado con AND
 */
export function withDemoExclusion<T>(
  existingFilter: T | undefined,
  demoFilter: Partial<T>
): T {
  if (!existingFilter) {
    return demoFilter as T;
  }
  return {
    AND: [existingFilter, demoFilter],
  } as T;
}

/**
 * Helper para crear filtros de companyId excluyendo demos
 * @param companyId - ID de la empresa
 * @returns Filtro para Building
 */
export function buildingFilterWithCompany(companyId: string): Prisma.BuildingWhereInput {
  return {
    companyId,
    isDemo: false,
    company: excludeDemoCompany,
  };
}

/**
 * Helper para crear filtros de companyId para unidades excluyendo demos
 * @param companyId - ID de la empresa
 * @returns Filtro para Unit
 */
export function unitFilterWithCompany(companyId: string): Prisma.UnitWhereInput {
  return {
    building: {
      companyId,
      isDemo: false,
      company: excludeDemoCompany,
    },
    isDemo: false,
  };
}

/**
 * Helper para crear filtros de companyId para inquilinos excluyendo demos
 * @param companyId - ID de la empresa
 * @returns Filtro para Tenant
 */
export function tenantFilterWithCompany(companyId: string): Prisma.TenantWhereInput {
  return {
    companyId,
    isDemo: false,
    company: excludeDemoCompany,
  };
}

/**
 * Helper para crear filtros de companyId para contratos excluyendo demos
 * @param companyId - ID de la empresa
 * @returns Filtro para Contract
 */
export function contractFilterWithCompany(companyId: string): Prisma.ContractWhereInput {
  return {
    unit: {
      building: {
        companyId,
        isDemo: false,
        company: excludeDemoCompany,
      },
      isDemo: false,
    },
    isDemo: false,
  };
}

/**
 * Helper para crear filtros de companyId para pagos excluyendo demos
 * @param companyId - ID de la empresa
 * @returns Filtro para Payment
 */
export function paymentFilterWithCompany(companyId: string): Prisma.PaymentWhereInput {
  return {
    contract: {
      unit: {
        building: {
          companyId,
          isDemo: false,
          company: excludeDemoCompany,
        },
        isDemo: false,
      },
      isDemo: false,
    },
    isDemo: false,
  };
}

/**
 * Helper para crear filtros de companyId para gastos excluyendo demos
 * @param companyId - ID de la empresa
 * @returns Filtro para Expense
 */
export function expenseFilterWithCompany(companyId: string): Prisma.ExpenseWhereInput {
  return {
    OR: [
      {
        building: {
          companyId,
          isDemo: false,
          company: excludeDemoCompany,
        },
      },
      {
        unit: {
          building: {
            companyId,
            isDemo: false,
            company: excludeDemoCompany,
          },
          isDemo: false,
        },
      },
    ],
    isDemo: false,
  };
}
