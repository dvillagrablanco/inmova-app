import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tenant } from '@prisma/client';

/**
 * Hook para obtener lista de inquilinos
 */
export function useTenants(companyId: string) {
  return useQuery({
    queryKey: ['tenants', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/tenants?companyId=${companyId}`);
      if (!response.ok) throw new Error('Error al cargar inquilinos');
      return response.json() as Promise<Tenant[]>;
    },
    enabled: !!companyId,
  });
}

/**
 * Hook para obtener un inquilino específico
 */
export function useTenant(tenantId: string) {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}`);
      if (!response.ok) throw new Error('Error al cargar inquilino');
      return response.json() as Promise<Tenant>;
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook para crear un nuevo inquilino
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Tenant>) => {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Error al crear inquilino');
      return response.json() as Promise<Tenant>;
    },
    onSuccess: (newTenant) => {
      queryClient.setQueryData(
        ['tenants', newTenant.companyId],
        (old: Tenant[] = []) => [...old, newTenant]
      );
      
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

/**
 * Hook para actualizar un inquilino
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tenant> }) => {
      const response = await fetch(`/api/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Error al actualizar inquilino');
      return response.json() as Promise<Tenant>;
    },
    onSuccess: (updatedTenant) => {
      queryClient.setQueryData(['tenant', updatedTenant.id], updatedTenant);
      
      queryClient.setQueryData(
        ['tenants', updatedTenant.companyId],
        (old: Tenant[] = []) =>
          old.map((t) => (t.id === updatedTenant.id ? updatedTenant : t))
      );
    },
  });
}

/**
 * Hook para eliminar un inquilino
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tenants/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Error al eliminar inquilino');
      return { id };
    },
    onSuccess: ({ id }) => {
      queryClient.setQueriesData(
        { queryKey: ['tenants'] },
        (old: Tenant[] | undefined) => old?.filter((t) => t.id !== id)
      );
      
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
