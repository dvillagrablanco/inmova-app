'use client';

/**
 * GLOBAL SHORTCUTS SYSTEM
 * Sistema de atajos de teclado globales para toda la app
 * Funciona en conjunto con Command Palette
 */

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface ShortcutAction {
  keys: string[];
  description: string;
  action: () => void;
  condition?: () => boolean; // Condición opcional para habilitar el shortcut
}

export function GlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  // Verificar si estamos en un input/textarea (no ejecutar shortcuts)
  const isInputFocused = useCallback(() => {
    const activeElement = document.activeElement;
    return (
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.hasAttribute('contenteditable')
    );
  }, []);

  // Manejar secuencias de teclas (ej: G + P)
  const handleSequence = useCallback(
    (sequence: string[]) => {
      let currentIndex = 0;
      let timeoutId: NodeJS.Timeout;

      return (key: string) => {
        if (sequence[currentIndex] === key.toLowerCase()) {
          currentIndex++;

          if (currentIndex === sequence.length) {
            // Secuencia completa
            currentIndex = 0;
            clearTimeout(timeoutId);
            return true;
          }

          // Resetear después de 1 segundo si no completa la secuencia
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            currentIndex = 0;
          }, 1000);
        } else {
          currentIndex = 0;
        }

        return false;
      };
    },
    []
  );

  // Definir shortcuts globales
  useEffect(() => {
    // Handlers para secuencias
    const goPropiedades = handleSequence(['g', 'p']);
    const goInquilinos = handleSequence(['g', 't']);
    const goContratos = handleSequence(['g', 'c']);
    const goPagos = handleSequence(['g', '$']);
    const goDashboard = handleSequence(['g', 'd']);
    const goMantenimiento = handleSequence(['g', 'm']);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si hay un input/textarea enfocado (excepto Cmd/Ctrl shortcuts)
      if (isInputFocused() && !e.metaKey && !e.ctrlKey) {
        return;
      }

      // ========================================
      // NAVEGACIÓN: Cmd/Ctrl + Letter
      // ========================================

      // Cmd/Ctrl + H → Dashboard (Home)
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && pathname !== '/dashboard') {
        e.preventDefault();
        router.push('/dashboard');
        toast.success('Navegando a Dashboard');
        return;
      }

      // Cmd/Ctrl + B → Toggle Sidebar (ya manejado por el sidebar)
      // Cmd/Ctrl + K → Command Palette (ya manejado por command-palette)
      // Cmd/Ctrl + / → Focus búsqueda global
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          toast.success('Búsqueda activada');
        }
        return;
      }

      // ========================================
      // SECUENCIAS: G + Letter (estilo Gmail/Linear)
      // ========================================

      // G + D → Dashboard
      if (goDashboard(e.key)) {
        e.preventDefault();
        router.push('/dashboard');
        toast.success('Ir a Dashboard');
        return;
      }

      // G + P → Propiedades
      if (goPropiedades(e.key)) {
        e.preventDefault();
        router.push('/propiedades');
        toast.success('Ir a Propiedades');
        return;
      }

      // G + T → Inquilinos (Tenants)
      if (goInquilinos(e.key)) {
        e.preventDefault();
        router.push('/inquilinos');
        toast.success('Ir a Inquilinos');
        return;
      }

      // G + C → Contratos
      if (goContratos(e.key)) {
        e.preventDefault();
        router.push('/contratos');
        toast.success('Ir a Contratos');
        return;
      }

      // G + $ → Pagos
      if (goPagos(e.key)) {
        e.preventDefault();
        router.push('/pagos');
        toast.success('Ir a Pagos');
        return;
      }

      // G + M → Mantenimiento
      if (goMantenimiento(e.key)) {
        e.preventDefault();
        router.push('/mantenimiento');
        toast.success('Ir a Mantenimiento');
        return;
      }

      // ========================================
      // ACCIONES RÁPIDAS POR PÁGINA
      // ========================================

      // Propiedades
      if (pathname === '/propiedades') {
        // N → Nueva Propiedad
        if (e.key === 'n' && !isInputFocused()) {
          e.preventDefault();
          router.push('/propiedades/crear');
          toast.success('Creando nueva propiedad');
          return;
        }

        // F → Focus en búsqueda
        if (e.key === 'f' && !isInputFocused()) {
          e.preventDefault();
          const searchInput = document.querySelector(
            'input[placeholder*="Buscar"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            toast.success('Búsqueda activada');
          }
          return;
        }

        // G → Grid view
        if (e.key === 'g' && !isInputFocused()) {
          e.preventDefault();
          const gridButton = document.querySelector('[data-view-mode="grid"]') as HTMLButtonElement;
          if (gridButton) {
            gridButton.click();
            toast.success('Vista Grid activada');
          }
          return;
        }

        // L → List view
        if (e.key === 'l' && !isInputFocused()) {
          e.preventDefault();
          const listButton = document.querySelector('[data-view-mode="list"]') as HTMLButtonElement;
          if (listButton) {
            listButton.click();
            toast.success('Vista Lista activada');
          }
          return;
        }
      }

      // Inquilinos
      if (pathname === '/inquilinos') {
        // N → Nuevo Inquilino
        if (e.key === 'n' && !isInputFocused()) {
          e.preventDefault();
          router.push('/inquilinos/nuevo');
          toast.success('Creando nuevo inquilino');
          return;
        }

        // F → Focus en búsqueda
        if (e.key === 'f' && !isInputFocused()) {
          e.preventDefault();
          const searchInput = document.querySelector(
            'input[placeholder*="Buscar"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            toast.success('Búsqueda activada');
          }
          return;
        }
      }

      // Contratos
      if (pathname === '/contratos') {
        // N → Nuevo Contrato
        if (e.key === 'n' && !isInputFocused()) {
          e.preventDefault();
          router.push('/contratos/nuevo');
          toast.success('Creando nuevo contrato');
          return;
        }
      }

      // Pagos
      if (pathname === '/pagos') {
        // N → Registrar Pago
        if (e.key === 'n' && !isInputFocused()) {
          e.preventDefault();
          router.push('/pagos/nuevo');
          toast.success('Registrando pago');
          return;
        }
      }

      // ========================================
      // NAVEGACIÓN POR TABS: 1-9
      // ========================================
      if (!isInputFocused() && /^[1-9]$/.test(e.key)) {
        const tabIndex = parseInt(e.key) - 1;
        const tabTriggers = document.querySelectorAll('[role="tab"]');
        
        if (tabTriggers.length > tabIndex) {
          e.preventDefault();
          const targetTab = tabTriggers[tabIndex] as HTMLButtonElement;
          targetTab.click();
          toast.success(`Tab ${e.key} activado`);
          return;
        }
      }

      // ========================================
      // NAVEGACIÓN EN LISTAS: J/K (estilo Vim)
      // ========================================
      
      // J → Siguiente elemento
      if (e.key === 'j' && !isInputFocused()) {
        e.preventDefault();
        const focusableItems = document.querySelectorAll(
          '[data-list-item], [role="listitem"], [data-card], .property-card, .tenant-card, .contract-card'
        );
        
        if (focusableItems.length > 0) {
          const currentFocused = document.activeElement;
          const currentIndex = Array.from(focusableItems).findIndex(
            (item) => item === currentFocused || item.contains(currentFocused)
          );
          
          const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, focusableItems.length - 1);
          const nextItem = focusableItems[nextIndex] as HTMLElement;
          
          // Si el elemento no es focusable, buscar el primer link/button dentro
          const focusableChild = nextItem.querySelector('a, button') as HTMLElement;
          if (focusableChild) {
            focusableChild.focus();
            // Scroll into view suavemente
            nextItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            nextItem.focus();
            nextItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }

      // K → Elemento anterior
      if (e.key === 'k' && !isInputFocused()) {
        e.preventDefault();
        const focusableItems = document.querySelectorAll(
          '[data-list-item], [role="listitem"], [data-card], .property-card, .tenant-card, .contract-card'
        );
        
        if (focusableItems.length > 0) {
          const currentFocused = document.activeElement;
          const currentIndex = Array.from(focusableItems).findIndex(
            (item) => item === currentFocused || item.contains(currentFocused)
          );
          
          const prevIndex = currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0);
          const prevItem = focusableItems[prevIndex] as HTMLElement;
          
          // Si el elemento no es focusable, buscar el primer link/button dentro
          const focusableChild = prevItem.querySelector('a, button') as HTMLElement;
          if (focusableChild) {
            focusableChild.focus();
            // Scroll into view suavemente
            prevItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            prevItem.focus();
            prevItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }

      // ENTER → Abrir elemento seleccionado
      if (e.key === 'Enter' && !isInputFocused()) {
        const focusedElement = document.activeElement;
        
        // Si el elemento enfocado es un card/list-item, buscar el link principal
        if (
          focusedElement?.hasAttribute('data-list-item') ||
          focusedElement?.hasAttribute('data-card') ||
          focusedElement?.classList.contains('property-card') ||
          focusedElement?.classList.contains('tenant-card') ||
          focusedElement?.classList.contains('contract-card')
        ) {
          e.preventDefault();
          const primaryLink = focusedElement.querySelector('a[href]') as HTMLAnchorElement;
          if (primaryLink) {
            primaryLink.click();
          }
          return;
        }
      }

      // ========================================
      // NAVEGACIÓN: Backspace → Volver
      // ========================================
      if (e.key === 'Backspace' && !isInputFocused() && pathname !== '/dashboard') {
        e.preventDefault();
        router.back();
        return;
      }

      // ========================================
      // AYUDA: ? → Mostrar shortcuts
      // ========================================
      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault();
        // Disparar evento para abrir modal de ayuda
        window.dispatchEvent(new CustomEvent('open-shortcuts-help'));
        return;
      }

      // ========================================
      // ESC → Cerrar modales/dialogs
      // ========================================
      if (e.key === 'Escape') {
        // Ya manejado por los componentes de UI, pero podemos añadir lógica adicional
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, pathname, isInputFocused, handleSequence]);

  // Este componente no renderiza nada, solo maneja eventos
  return null;
}

/**
 * Hook para usar shortcuts programáticamente en componentes
 */
export function useShortcut(
  keys: string[],
  callback: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMatch = keys.every((key) => {
        if (key === 'Ctrl') return e.ctrlKey;
        if (key === 'Cmd') return e.metaKey;
        if (key === 'Shift') return e.shiftKey;
        if (key === 'Alt') return e.altKey;
        return e.key.toLowerCase() === key.toLowerCase();
      });

      if (isMatch) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [...deps, callback]);
}
