import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import type { Payment } from '@/types/prisma-types';

interface PaymentFilters {
  status?: string;
  unitId?: string;
  startDate?: string;
  endDate?: string;
}

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(JSON.stringify(filters)),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.unitId) params.append('unitId', filters.unitId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/payments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json() as Promise<Payment[]>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for financial data
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/payments/${id}`);
      if (!response.ok) throw new Error('Failed to fetch payment');
      return response.json() as Promise<Payment>;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePendingPayments() {
  return useQuery({
    queryKey: queryKeys.payments.pending(),
    queryFn: async () => {
      const response = await fetch('/api/payments?status=pending');
      if (!response.ok) throw new Error('Failed to fetch pending payments');
      return response.json() as Promise<Payment[]>;
    },
    staleTime: 1 * 60 * 1000, // 1 minute for pending payments
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdatePayment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useProcessPayment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/payments/${id}/process`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to process payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
