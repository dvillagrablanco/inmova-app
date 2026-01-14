import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { MaintenanceResponse, MaintenanceFilters } from '@/types/maintenance';

async function fetchMaintenanceRequests(filters: MaintenanceFilters): Promise<MaintenanceResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.estado && filters.estado !== 'all') params.append('estado', filters.estado);
  if (filters.prioridad && filters.prioridad !== 'all') params.append('prioridad', filters.prioridad);

  const response = await fetch(`/api/maintenance?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Error fetching maintenance requests');
  }

  const data = await response.json();
  
  if (Array.isArray(data)) {
      return {
          data: data,
          pagination: {
              total: data.length,
              page: 1,
              limit: data.length,
              totalPages: 1,
              hasMore: false
          }
      };
  }
  return data;
}

export function useMaintenance(filters: MaintenanceFilters = {}) {
  return useQuery({
    queryKey: ['maintenance', filters],
    queryFn: () => fetchMaintenanceRequests(filters),
    placeholderData: keepPreviousData,
  });
}
