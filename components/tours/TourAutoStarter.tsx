'use client';

/**
 * AUTO-INICIADOR DE TOURS
 * Detecta cuando el usuario entra a una página y lanza el tour correspondiente
 */

import { useEffect, useState } from 'react';
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

export function TourAutoStarter() {
  const pathname = usePathname();
  const { availableTours, completeTour, isTourCompleted } = useVirtualTour();
  const [activeTour, setActiveTour] = useState<any>(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  useEffect(() => {
    // Verificar si autoplay está habilitado en preferencias
    const checkAutoplay = async () => {
      try {
        const response = await fetch('/api/preferences');
        const data = await response.json();
        if (data.success) {
          setAutoplayEnabled(data.preferences.autoplayTours);
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
    const tourId = ROUTE_TO_TOUR_MAP[pathname];
    if (!tourId) return;

    // Verificar si ya fue completado
    if (isTourCompleted(tourId)) return;

    // Buscar el tour en la lista de disponibles
    const tour = availableTours.find(t => t.id === tourId);
    if (!tour) return;

    // Verificar si tiene autoStart habilitado
    if (!tour.autoStart) return;

    // Esperar un poco antes de iniciar (para que la página cargue)
    const timer = setTimeout(() => {
      setActiveTour(tour);
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname, availableTours, autoplayEnabled, isTourCompleted]);

  const handleTourComplete = async () => {
    if (activeTour) {
      await completeTour(activeTour.id);
    }
    setActiveTour(null);
  };

  const handleTourSkip = () => {
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
