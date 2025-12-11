import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import type { Contract } from '@prisma/client';

interface ContractFilters {
  status?: string;
  buildingId?: string;
  tenantId?: string;
  unitId?: string;
}

export function useContracts(filters: ContractFilters = {}) {
  return useQuery({
    queryKey: queryKeys.contracts.list(JSON.stringify(filters)),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.buildingId) params.append('buildingId', filters.buildingId);
      if (filters.tenantId) params.append('tenantId', filters.tenantId);
      if (filters.unitId) params.append('unitId', filters.unitId);

      const response = await fetch(`/api/contracts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      return response.json() as Promise<Contract[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: queryKeys.contracts.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch contract');
      return response.json() as Promise<Contract>;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContractsByTenant(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.contracts.byTenant(tenantId),
    queryFn: async () => {
      const response = await fetch(`/api/contracts?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch tenant contracts');
      return response.json() as Promise<Contract[]>;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Contract>) => {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create contract');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateContract(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Contract>) => {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update contract');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useDeleteContract(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contract');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
