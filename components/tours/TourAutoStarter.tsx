'use client';

/**
 * AUTO-INICIADOR DE TOURS
 * Detecta cuando el usuario entra a una página y lanza el tour correspondiente
 */

import { useEffect, useState, useRef, useCallback } from 'react';
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

// Clave para sessionStorage - evita mostrar tours cerrados en esta sesión
const SESSION_CLOSED_TOURS_KEY = 'inmova_closed_tours_session';

export function TourAutoStarter() {
  const pathname = usePathname();
  const { availableTours, completeTour, isTourCompleted, loading } = useVirtualTour();
  const [activeTour, setActiveTour] = useState<any>(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  
  // Ref para evitar múltiples inicios del mismo tour
  const closedToursRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef(false);

  // Cargar tours cerrados de sessionStorage al montar
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_CLOSED_TOURS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          closedToursRef.current = new Set(parsed);
        }
      }
    } catch (e) {
      // Ignorar errores de sessionStorage
    }
  }, []);

  // Guardar tour cerrado en sessionStorage
  const markTourAsClosed = useCallback((tourId: string) => {
    closedToursRef.current.add(tourId);
    try {
      sessionStorage.setItem(
        SESSION_CLOSED_TOURS_KEY, 
        JSON.stringify([...closedToursRef.current])
      );
    } catch (e) {
      // Ignorar errores de sessionStorage
    }
  }, []);

  useEffect(() => {
    // Verificar si autoplay está habilitado en preferencias
    const checkAutoplay = async () => {
      try {
        const response = await fetch('/api/preferences');
        const data = await response.json();
        if (data.success && data.preferences) {
          setAutoplayEnabled(data.preferences.autoplayTours !== false);
        }
      } catch (error) {
        console.error('Error checking autoplay:', error);
      }
    };

    checkAutoplay();
  }, []);

  useEffect(() => {
    // No hacer nada si está cargando, no hay autoplay, o ya hay un tour activo
    if (loading || !autoplayEnabled || activeTour || isProcessingRef.current) return;

    // Obtener el tour correspondiente a esta ruta
    const tourId = ROUTE_TO_TOUR_MAP[pathname];
    if (!tourId) return;

    // Verificar si ya fue cerrado en esta sesión (previene bucle)
    if (closedToursRef.current.has(tourId)) return;

    // Verificar si ya fue completado en el backend
    if (isTourCompleted(tourId)) return;

    // Buscar el tour en la lista de disponibles
    const tour = availableTours.find(t => t.id === tourId);
    if (!tour) return;

    // Verificar si tiene autoStart habilitado
    if (!tour.autoStart) return;

    // Marcar que estamos procesando para evitar múltiples llamadas
    isProcessingRef.current = true;

    // Esperar un poco antes de iniciar (para que la página cargue)
    const timer = setTimeout(() => {
      // Verificar de nuevo antes de mostrar
      if (!closedToursRef.current.has(tourId) && !activeTour) {
        setActiveTour(tour);
      }
      isProcessingRef.current = false;
    }, 1500);

    return () => {
      clearTimeout(timer);
      isProcessingRef.current = false;
    };
  }, [pathname, availableTours, autoplayEnabled, isTourCompleted, loading, activeTour]);

  const handleTourComplete = async () => {
    if (activeTour) {
      // Marcar como cerrado localmente PRIMERO (evita bucle)
      markTourAsClosed(activeTour.id);
      // Luego persistir en el backend
      await completeTour(activeTour.id);
    }
    setActiveTour(null);
  };

  const handleTourSkip = async () => {
    if (activeTour) {
      // Marcar como cerrado localmente PRIMERO (evita bucle)
      markTourAsClosed(activeTour.id);
      // Luego persistir en el backend
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
