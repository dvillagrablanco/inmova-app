/**
 * Hook for improved keyboard navigation
 * Implements WCAG 2.1 keyboard accessibility standards
 */

import { useEffect, useCallback, RefObject } from 'react';
import logger from '@/lib/logger';

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shiftKey: boolean) => void;
  containerRef?: RefObject<HTMLElement>;
  enabled?: boolean;
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    containerRef,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
            logger.info('Keyboard navigation: Escape pressed');
          }
          break;
        case 'Enter':
          if (onEnter && !event.shiftKey) {
            event.preventDefault();
            onEnter();
            logger.info('Keyboard navigation: Enter pressed');
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Tab':
          if (onTab) {
            onTab(event.shiftKey);
          }
          break;
        default:
          break;
      }
    },
    [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]
  );

  useEffect(() => {
    const element = containerRef?.current || document;
    if (!enabled) return;

    element.addEventListener('keydown', handleKeyDown as any);

    return () => {
      element.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [handleKeyDown, containerRef, enabled]);

  return { handleKeyDown };
}
