/**
 * Centralized query keys for React Query
 * Helps with cache invalidation and organization
 */

export const queryKeys = {
  // Buildings
  buildings: {
    all: ['buildings'] as const,
    lists: () => [...queryKeys.buildings.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.buildings.lists(), { filters }] as const,
    details: () => [...queryKeys.buildings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.buildings.details(), id] as const,
  },

  // Units
  units: {
    all: ['units'] as const,
    lists: () => [...queryKeys.units.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.units.lists(), { filters }] as const,
    details: () => [...queryKeys.units.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.units.details(), id] as const,
    byBuilding: (buildingId: string) => [...queryKeys.units.all, 'building', buildingId] as const,
  },

  // Tenants
  tenants: {
    all: ['tenants'] as const,
    lists: () => [...queryKeys.tenants.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.tenants.lists(), { filters }] as const,
    details: () => [...queryKeys.tenants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
    search: (query: string) => [...queryKeys.tenants.all, 'search', query] as const,
  },

  // Contracts
  contracts: {
    all: ['contracts'] as const,
    lists: () => [...queryKeys.contracts.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.contracts.lists(), { filters }] as const,
    details: () => [...queryKeys.contracts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contracts.details(), id] as const,
    byTenant: (tenantId: string) => [...queryKeys.contracts.all, 'tenant', tenantId] as const,
    byUnit: (unitId: string) => [...queryKeys.contracts.all, 'unit', unitId] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.payments.lists(), { filters }] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    byUnit: (unitId: string) => [...queryKeys.payments.all, 'unit', unitId] as const,
    pending: () => [...queryKeys.payments.all, 'pending'] as const,
  },

  // Maintenance
  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.maintenance.lists(), { filters }] as const,
    details: () => [...queryKeys.maintenance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.maintenance.details(), id] as const,
    byBuilding: (buildingId: string) =>
      [...queryKeys.maintenance.all, 'building', buildingId] as const,
    byUnit: (unitId: string) => [...queryKeys.maintenance.all, 'unit', unitId] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    kpis: () => [...queryKeys.dashboard.all, 'kpis'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'recent-activity'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    count: () => [...queryKeys.notifications.all, 'count'] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.documents.lists(), { filters }] as const,
    byBuilding: (buildingId: string) =>
      [...queryKeys.documents.all, 'building', buildingId] as const,
    byUnit: (unitId: string) => [...queryKeys.documents.all, 'unit', unitId] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    financial: () => [...queryKeys.reports.all, 'financial'] as const,
    occupancy: () => [...queryKeys.reports.all, 'occupancy'] as const,
    maintenance: () => [...queryKeys.reports.all, 'maintenance'] as const,
  },
} as const;
