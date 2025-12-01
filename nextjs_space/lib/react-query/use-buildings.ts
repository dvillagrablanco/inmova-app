import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building } from '@prisma/client';

/**
 * Hook para obtener lista de edificios
 */
export function useBuildings(companyId: string) {
  return useQuery({
    queryKey: ['buildings', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/buildings?companyId=${companyId}`);
      if (!response.ok) throw new Error('Error al cargar edificios');
      return response.json() as Promise<Building[]>;
    },
    enabled: !!companyId,
  });
}

/**
 * Hook para obtener un edificio específico
 */
export function useBuilding(buildingId: string) {
  return useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const response = await fetch(`/api/buildings/${buildingId}`);
      if (!response.ok) throw new Error('Error al cargar edificio');
      return response.json() as Promise<Building>;
    },
    enabled: !!buildingId,
  });
}

/**
 * Hook para crear un nuevo edificio
 */
export function useCreateBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Building>) => {
      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Error al crear edificio');
      return response.json() as Promise<Building>;
    },
    onSuccess: (newBuilding) => {
      // Actualizar cache optimistamente
      queryClient.setQueryData(
        ['buildings', newBuilding.companyId],
        (old: Building[] = []) => [...old, newBuilding]
      );
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });
}

/**
 * Hook para actualizar un edificio
 */
export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Building> }) => {
      const response = await fetch(`/api/buildings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Error al actualizar edificio');
      return response.json() as Promise<Building>;
    },
    onSuccess: (updatedBuilding) => {
      // Actualizar cache del edificio individual
      queryClient.setQueryData(['building', updatedBuilding.id], updatedBuilding);
      
      // Actualizar en la lista
      queryClient.setQueryData(
        ['buildings', updatedBuilding.companyId],
        (old: Building[] = []) =>
          old.map((b) => (b.id === updatedBuilding.id ? updatedBuilding : b))
      );
    },
  });
}

/**
 * Hook para eliminar un edificio
 */
export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/buildings/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Error al eliminar edificio');
      return { id };
    },
    onSuccess: ({ id }) => {
      // Remover de todas las queries de buildings
      queryClient.setQueriesData(
        { queryKey: ['buildings'] },
        (old: Building[] | undefined) => old?.filter((b) => b.id !== id)
      );
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

/**
 * Hook para prefetch de un edificio
 * Útil al hacer hover sobre una tarjeta
 */
export function usePrefetchBuilding() {
  const queryClient = useQueryClient();
  
  return (buildingId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['building', buildingId],
      queryFn: async () => {
        const response = await fetch(`/api/buildings/${buildingId}`);
        if (!response.ok) throw new Error('Error al cargar edificio');
        return response.json();
      },
    });
  };
}
