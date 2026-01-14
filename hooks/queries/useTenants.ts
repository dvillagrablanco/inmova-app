import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { TenantsResponse, TenantsFilters } from '@/types/tenants';

async function fetchTenants(filters: TenantsFilters): Promise<TenantsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.companyId) params.append('companyId', filters.companyId);

  const response = await fetch(`/api/tenants?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Error fetching tenants');
  }

  const data = await response.json();
  // Handle case where API returns array instead of object (if no pagination)
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

export function useTenants(filters: TenantsFilters = {}) {
  return useQuery({
    queryKey: ['tenants', filters],
    queryFn: () => fetchTenants(filters),
    placeholderData: keepPreviousData,
  });
}
