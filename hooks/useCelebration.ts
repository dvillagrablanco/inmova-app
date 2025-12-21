"use client";

/**
 * 🎉 HOOK: useCelebration
 * 
 * Custom hook para gestionar celebraciones en la aplicación.
 * Permite mostrar celebraciones de forma programada y controlada.
 * 
 * Uso:
 * ```tsx
 * const { showCelebration, CelebrationComponent } = useCelebration();
 * 
 * // En algún evento:
 * showCelebration({
 *   title: '¡Felicitaciones!',
 *   message: 'Has completado la tarea',
 *   emoji: '🎉',
 * });
 * 
 * // En el JSX:
 * return (
 *   <div>
 *     {CelebrationComponent}
 *     ...
 *   </div>
 * );
 * ```
 */

import { useState, useCallback } from 'react';
import CelebrationModal from '@/components/CelebrationModal';

interface CelebrationConfig {
  title: string;
  message: string;
  emoji?: string;
  autoCloseDuration?: number;
}

export function useCelebration() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<CelebrationConfig>({
    title: '',
    message: '',
    emoji: '🎉',
    autoCloseDuration: 5000,
  });

  const showCelebration = useCallback((celebrationConfig: CelebrationConfig) => {
    setConfig({
      emoji: '🎉',
      autoCloseDuration: 5000,
      ...celebrationConfig,
    });
    setIsOpen(true);
  }, []);

  const hideCelebration = useCallback(() => {
    setIsOpen(false);
  }, []);

  const CelebrationComponent = (
    <CelebrationModal
      isOpen={isOpen}
      onClose={hideCelebration}
      title={config.title}
      message={config.message}
      emoji={config.emoji}
      autoCloseDuration={config.autoCloseDuration}
    />
  );

  return {
    showCelebration,
    hideCelebration,
    CelebrationComponent,
    isOpen,
  };
}
