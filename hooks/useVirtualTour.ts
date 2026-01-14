'use client';

/**
 * HOOK: useVirtualTour
 * Gestión de tours virtuales en componentes
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Tour {
  id: string;
  name: string;
  description: string;
  steps: any[];
  estimatedDuration: number;
}

export function useVirtualTour() {
  const { data: session } = useSession();
  const [availableTours, setAvailableTours] = useState<Tour[]>([]);
  const [nextTour, setNextTour] = useState<Tour | null>(null);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTours = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      
      // Obtener tours disponibles
      const availableResponse = await fetch('/api/tours?view=available');
      const availableData = await availableResponse.json();

      if (availableData.success) {
        setAvailableTours(availableData.tours || []);
        setProgress(availableData.progress || 0);
        // FIX: Usar array vacío en lugar de 0 para evitar 'includes is not a function'
        setCompletedTours(Array.isArray(availableData.completedTours) ? availableData.completedTours : []);
      }

      // Obtener siguiente tour
      const nextResponse = await fetch('/api/tours?view=next');
      const nextData = await nextResponse.json();

      if (nextData.success && nextData.tour) {
        setNextTour(nextData.tour);
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const completeTour = async (tourId: string) => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          tourId
        })
      });

      const data = await response.json();

      if (data.success) {
        // FIX: Asegurar que siempre sea un array
        setCompletedTours(Array.isArray(data.completedTours) ? data.completedTours : []);
        await fetchTours(); // Refrescar
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error completing tour:', error);
      return false;
    }
  };

  const resetTour = async (tourId: string) => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          tourId
        })
      });

      const data = await response.json();

      if (data.success) {
        // FIX: Asegurar que siempre sea un array
        setCompletedTours(Array.isArray(data.completedTours) ? data.completedTours : []);
        await fetchTours();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error resetting tour:', error);
      return false;
    }
  };

  const isTourCompleted = (tourId: string) => {
    return completedTours.includes(tourId);
  };

  return {
    availableTours,
    nextTour,
    completedTours,
    progress,
    loading,
    completeTour,
    resetTour,
    isTourCompleted,
    refetch: fetchTours
  };
}
