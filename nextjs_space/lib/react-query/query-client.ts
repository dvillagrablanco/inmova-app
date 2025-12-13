import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración del QueryClient con valores optimizados
 * para el rendimiento de INMOVA
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Datos se consideran frescos por 5 minutos
        staleTime: 5 * 60 * 1000,
        // Cache por 30 minutos
        gcTime: 30 * 60 * 1000, // anteriormente cacheTime
        // Refetch al re-enfocar ventana
        refetchOnWindowFocus: true,
        // No refetch automático al remontar
        refetchOnMount: false,
        // Reintentar en caso de error
        retry: 1,
        // Retrasar retries exponencialmente
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Reintentar mutaciones fallidas
        retry: 0,
      },
    },
  });
}
