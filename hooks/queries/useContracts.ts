import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ContractsResponse, ContractsFilters } from '@/types/contracts';

async function fetchContracts(filters: ContractsFilters): Promise<ContractsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.companyId) params.append('companyId', filters.companyId);

  const response = await fetch(`/api/contracts?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Error fetching contracts');
  }

  const data = await response.json();
  // Handle case where API returns array instead of object
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

export function useContracts(filters: ContractsFilters = {}) {
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => fetchContracts(filters),
    placeholderData: keepPreviousData,
  });
}
