import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PropertiesResponse, PropertiesFilters } from '@/types/properties';

async function fetchProperties(filters: PropertiesFilters): Promise<PropertiesResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.city) params.append('city', filters.city);
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`/api/v1/properties?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Error fetching properties');
  }

  return response.json();
}

export function useProperties(filters: PropertiesFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => fetchProperties(filters),
    placeholderData: keepPreviousData,
  });
}
