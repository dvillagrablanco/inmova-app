'use client';

/**
 * AUTO-INICIADOR DE TOURS
 * Detecta cuando el usuario entra a una página y lanza el tour correspondiente
 */

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useVirtualTour } from '@/hooks/useVirtualTour';
import { VirtualTourPlayer } from './VirtualTourPlayer';

// Mapeo de rutas a IDs de tours
const ROUTE_TO_TOUR_MAP: Record<string, string> = {
  '/dashboard': 'tour-dashboard',
  '/edificios': 'tour-edificios',
  '/unidades': 'tour-unidades',
  '/contratos': 'tour-contratos',
  '/mantenimiento': 'tour-mantenimiento',
  '/coliving': 'tour-coliving'
};

// Key para persistir tours saltados en sessionStorage
const SKIPPED_TOURS_KEY = 'inmova-skipped-tours';

// Obtener tours saltados de sessionStorage
function getSkippedTours(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = sessionStorage.getItem(SKIPPED_TOURS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Guardar tour saltado en sessionStorage
function markTourAsSkipped(tourId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const skipped = getSkippedTours();
    if (!skipped.includes(tourId)) {
      skipped.push(tourId);
      sessionStorage.setItem(SKIPPED_TOURS_KEY, JSON.stringify(skipped));
    }
  } catch {
    // Ignorar errores de storage
  }
}

export function TourAutoStarter() {
  const pathname = usePathname();
  const { availableTours, completeTour, isTourCompleted } = useVirtualTour();
  const [activeTour, setActiveTour] = useState<any>(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  
  // Ref para evitar mostrar el mismo tour múltiples veces
  const shownToursRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Verificar si autoplay está habilitado en preferencias
    const checkAutoplay = async () => {
      try {
        const response = await fetch('/api/preferences');
        const data = await response.json();
        if (data.success) {
          setAutoplayEnabled(data.preferences?.autoplayTours ?? true);
        }
      } catch (error) {
        console.error('Error checking autoplay:', error);
      }
    };

    checkAutoplay();
  }, []);

  useEffect(() => {
    if (!autoplayEnabled) return;

    // Obtener el tour correspondiente a esta ruta
    const tourId = ROUTE_TO_TOUR_MAP[pathname || ''];
    if (!tourId) return;

    // Verificar si ya fue completado o mostrado en esta sesión
    if (isTourCompleted(tourId)) return;
    if (shownToursRef.current.has(tourId)) return;
    
    // Verificar si fue saltado en esta sesión
    const skippedTours = getSkippedTours();
    if (skippedTours.includes(tourId)) return;

    // Buscar el tour en la lista de disponibles
    const tour = availableTours.find(t => t.id === tourId);
    if (!tour) return;

    // Verificar si tiene autoStart habilitado
    if (!tour.autoStart) return;

    // Marcar como mostrado para evitar repeticiones
    shownToursRef.current.add(tourId);

    // Esperar un poco antes de iniciar (para que la página cargue)
    const timer = setTimeout(() => {
      setActiveTour(tour);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname, availableTours, autoplayEnabled, isTourCompleted]);

  const handleTourComplete = async () => {
    if (activeTour) {
      await completeTour(activeTour.id);
    }
    setActiveTour(null);
  };

  // CORREGIDO: Marcar el tour como completado también cuando se salta
  const handleTourSkip = async () => {
    if (activeTour) {
      // Marcar como saltado en sessionStorage (para esta sesión)
      markTourAsSkipped(activeTour.id);
      // También marcar como completado en el backend
      await completeTour(activeTour.id);
    }
    setActiveTour(null);
  };

  if (!activeTour) return null;

  return (
    <VirtualTourPlayer
      tour={activeTour}
      onComplete={handleTourComplete}
      onSkip={handleTourSkip}
    />
  );
}
