'use client';

import { useState, useCallback, useRef } from 'react';

interface UseUndoRedoOptions<T> {
  initialState: T;
  maxHistory?: number;
}

/**
 * Hook for managing undo/redo functionality
 */
export function useUndoRedo<T>({ initialState, maxHistory = 50 }: UseUndoRedoOptions<T>) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

  const currentState = history[currentIndex];

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      // Don't add to history if this is an undo/redo operation
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return;
      }

      setHistory((prev) => {
        const nextState =
          typeof newState === 'function'
            ? (newState as (prev: T) => T)(prev[currentIndex])
            : newState;

        // Remove any future history
        const newHistory = prev.slice(0, currentIndex + 1);

        // Add new state
        newHistory.push(nextState);

        // Limit history size
        if (newHistory.length > maxHistory) {
          newHistory.shift();
          setCurrentIndex(maxHistory - 1);
        } else {
          setCurrentIndex(newHistory.length - 1);
        }

        return newHistory;
      });
    },
    [currentIndex, maxHistory]
  );

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoRef.current = true;
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const reset = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  return {
    state: currentState,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    history,
    currentIndex,
  };
}

/**
 * Keyboard shortcuts for undo/redo
 */
export function useUndoRedoShortcuts(
  undo: () => void,
  redo: () => void,
  canUndo: boolean,
  canRedo: boolean
) {
  useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        if (canUndo) {
          e.preventDefault();
          undo();
        }
      } else if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
