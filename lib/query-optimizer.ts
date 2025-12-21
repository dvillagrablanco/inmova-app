/**
 * Query Optimizer Utilities
 * Provides helpers for optimizing Prisma queries
 */

import { Prisma } from '@prisma/client';

/**
 * Common field selections for optimized queries
 * Only select necessary fields to reduce payload size
 */

export const selectUserMinimal = {
  id: true,
  email: true,
  name: true,
  role: true,
} satisfies Prisma.UserSelect;

export const selectCompanyMinimal = {
  id: true,
  nombre: true,
  logoUrl: true,
} satisfies Prisma.CompanySelect;

export const selectBuildingMinimal = {
  id: true,
  nombre: true,
  direccion: true,
  tipo: true,
  numeroUnidades: true,
} satisfies Prisma.BuildingSelect;

export const selectUnitMinimal = {
  id: true,
  numero: true,
  tipo: true,
  estado: true,
  superficie: true,
  rentaMensual: true,
} satisfies Prisma.UnitSelect;

export const selectTenantMinimal = {
  id: true,
  nombreCompleto: true,
  email: true,
  telefono: true,
} satisfies Prisma.TenantSelect;

export const selectContractMinimal = {
  id: true,
  fechaInicio: true,
  fechaFin: true,
  rentaMensual: true,
  estado: true,
} satisfies Prisma.ContractSelect;

export const selectPaymentMinimal = {
  id: true,
  monto: true,
  fechaVencimiento: true,
  estado: true,
} satisfies Prisma.PaymentSelect;

/**
 * Room Rental Optimized Selects
 * Added: Semana 2, Query Optimization
 */
export const selectRoomMinimal = {
  id: true,
  numero: true,
  superficie: true,
  rentaMensual: true,
  estado: true,
  capacidadMaxima: true,
} satisfies Prisma.RoomSelect;

export const selectRoomContractMinimal = {
  id: true,
  fechaInicio: true,
  fechaFin: true,
  rentaMensual: true,
  estado: true,
  depositoSeguridad: true,
} satisfies Prisma.RoomContractSelect;

export const selectRoomPaymentMinimal = {
  id: true,
  monto: true,
  fechaVencimiento: true,
  estado: true,
  concepto: true,
} satisfies Prisma.RoomPaymentSelect;

// TODO: Implement UtilityProration model in schema.prisma
// export const selectUtilityProrationMinimal = {
//   id: true,
//   mesReferencia: true,
//   metodoProrrateado: true,
//   totalElectricidad: true,
//   totalAgua: true,
//   totalGas: true,
//   totalInternet: true,
//   createdAt: true,
// };

/**
 * Build optimized include object
 */
export function buildOptimizedInclude<T extends Record<string, any>>(
  relations: (keyof T)[],
  selectMap: Partial<Record<keyof T, any>>
): any {
  const include: any = {};
  relations.forEach((rel) => {
    if (selectMap[rel]) {
      include[rel] = { select: selectMap[rel] };
    } else {
      include[rel] = true;
    }
  });
  return include;
}

/**
 * Add date range filter
 */
export function addDateRangeFilter(
  startDate?: string,
  endDate?: string,
  field: string = 'createdAt'
): any {
  const filter: any = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].gte = new Date(startDate);
    if (endDate) filter[field].lte = new Date(endDate);
  }
  return filter;
}

/**
 * Build search filter for multiple fields
 */
export function buildSearchFilter(
  searchTerm: string,
  fields: string[]
): Prisma.StringFilter[] {
  return fields.map(() => ({
    contains: searchTerm,
    mode: 'insensitive' as Prisma.QueryMode,
  }));
}
