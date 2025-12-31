'use client';

/**
 * Focus Trap Component
 * 
 * Atrapa el foco dentro de un elemento (útil para modales y diálogos)
 * Mejora accesibilidad para usuarios de teclado
 */

import { useEffect, useRef, ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Guardar elemento con foco anterior
    const previousActiveElement = document.activeElement as HTMLElement;

    // Obtener todos los elementos focusables
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    // Handler para Tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(getFocusableElements());
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Si no hay elemento activo o está fuera del contenedor, enfocar el primero
      if (!document.activeElement || !container.contains(document.activeElement)) {
        e.preventDefault();
        firstElement.focus();
        return;
      }

      // Tab normal
      if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }

      // Shift+Tab (hacia atrás)
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    };

    // Enfocar primer elemento focusable
    const firstFocusable = getFocusableElements()[0];
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Agregar listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restaurar foco anterior
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

/**
 * Uso en Modal:
 * 
 * <Modal open={isOpen}>
 *   <FocusTrap active={isOpen}>
 *     <ModalContent>
 *       ...
 *     </ModalContent>
 *   </FocusTrap>
 * </Modal>
 */
