import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  totalEdificios: number;
  totalUnidades: number;
  totalInquilinos: number;
  ingresosMensuales: number;
  ocupacionPromedio: number;
  morosidad: number;
  proximosPagos: number;
  mantenimientosPendientes: number;
}

/**
 * Hook para obtener estadísticas del dashboard
 */
export function useDashboardStats(companyId: string) {
  return useQuery({
    queryKey: ['dashboard-stats', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?companyId=${companyId}`);
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      return response.json() as Promise<DashboardStats>;
    },
    enabled: !!companyId,
    // Refrescar cada 2 minutos en esta vista crítica
    refetchInterval: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener actividad reciente
 */
export function useRecentActivity(companyId: string, limit = 10) {
  return useQuery({
    queryKey: ['recent-activity', companyId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/activity?companyId=${companyId}&limit=${limit}`);
      if (!response.ok) throw new Error('Error al cargar actividad');
      return response.json();
    },
    enabled: !!companyId,
  });
}
