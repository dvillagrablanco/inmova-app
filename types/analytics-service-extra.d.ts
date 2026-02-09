// Tipos adicionales para analytics-service
declare module '@/lib/analytics-service' {
  export function getAIMetrics(
    companyId: string,
    period?: 'today' | 'week' | 'month' | 'year'
  ): Promise<any>;
  export function getPerformanceMetrics(
    companyId: string,
    period?: 'today' | 'week' | 'month'
  ): Promise<any>;
  export function generateBuildingMetrics(buildingId: string): Promise<{ buildingId: string; metrics: any }>;
  export function generateAnalyticsSnapshot(userId: string): Promise<{ userId: string; snapshot: any }>;
  export function analyzeTenantBehavior(tenantId: string): Promise<{ tenantId: string; behavior: any }>;
  export function getAnalyticsTrends(companyId: string, months?: number): Promise<{ companyId: string; trends: any[]; months: number }>;
}
