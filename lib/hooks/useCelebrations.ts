/**
 * CUSTOM HOOK: useCelebrations
 * Hook para gestionar celebraciones desde componentes cliente
 *
 * Funcionalidades:
 * - Obtener celebraciones pendientes
 * - Mostrar celebraciones automáticamente
 * - Marcar como mostradas
 * - Auto-polling para nuevas celebraciones
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Celebration {
  id: string;
  type: string;
  title: string;
  message: string;
  badgeText?: string;
  badgeColor?: string;
  actionLabel?: string;
  actionRoute?: string;
  shown: boolean;
  createdAt: string;
}

interface UseCelebrationsOptions {
  autoShow?: boolean; // Mostrar automáticamente
  pollInterval?: number; // Intervalo de polling en ms (0 = sin polling)
}

export function useCelebrations(options: UseCelebrationsOptions = {}) {
  const { autoShow = true, pollInterval = 10000 } = options;

  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<Celebration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch celebrations
  const fetchCelebrations = useCallback(async () => {
    try {
      const response = await fetch('/api/celebrations');
      if (response.ok) {
        const data = await response.json();
        const pending = data.celebrations || [];
        setCelebrations(pending);

        // Si autoShow está habilitado y hay celebraciones pendientes, mostrar la primera
        if (autoShow && pending.length > 0 && !currentCelebration) {
          setCurrentCelebration(pending[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching celebrations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [autoShow, currentCelebration]);

  // Mark as shown
  const markAsShown = useCallback(
    async (celebrationId: string) => {
      try {
        const response = await fetch(`/api/celebrations/${celebrationId}/shown`, {
          method: 'PATCH',
        });

        if (response.ok) {
          // Remover de la lista de pendientes
          setCelebrations((prev) => prev.filter((c) => c.id !== celebrationId));

          // Si hay más celebraciones pendientes, mostrar la siguiente
          const remaining = celebrations.filter((c) => c.id !== celebrationId);
          if (remaining.length > 0 && autoShow) {
            // Esperar 1 segundo antes de mostrar la siguiente
            setTimeout(() => {
              setCurrentCelebration(remaining[0]);
            }, 1000);
          } else {
            setCurrentCelebration(null);
          }

          return true;
        }
        return false;
      } catch (error) {
        console.error('Error marking celebration as shown:', error);
        return false;
      }
    },
    [celebrations, autoShow]
  );

  // Close current celebration
  const closeCelebration = useCallback(() => {
    if (currentCelebration) {
      markAsShown(currentCelebration.id);
    }
  }, [currentCelebration, markAsShown]);

  // Initial fetch
  useEffect(() => {
    fetchCelebrations();
  }, []);

  // Polling
  useEffect(() => {
    if (pollInterval > 0) {
      const interval = setInterval(fetchCelebrations, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval, fetchCelebrations]);

  return {
    celebrations,
    currentCelebration,
    isLoading,
    closeCelebration,
    markAsShown,
    refresh: fetchCelebrations,
  };
}
