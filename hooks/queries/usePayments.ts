import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PaymentsResponse, PaymentFilters } from '@/types/payments';

async function fetchPayments(filters: PaymentFilters): Promise<PaymentsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.estado && filters.estado !== 'all') params.append('estado', filters.estado);
  if (filters.contractId) params.append('contractId', filters.contractId);

  const response = await fetch(`/api/payments?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Error fetching payments');
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

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => fetchPayments(filters),
    placeholderData: keepPreviousData,
  });
}
