import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Default shortcuts for the app
export function useDefaultKeyboardShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Open command palette (we'll implement this)
        const event = new CustomEvent('open-command-palette');
        window.dispatchEvent(event);
      },
      description: 'Abrir paleta de comandos',
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => router.push('/dashboard'),
      description: 'Ir al inicio (Home)',
    },
    {
      key: 'u',
      ctrlKey: true,
      action: () => router.push('/usuarios'),
      description: 'Ir a usuarios',
    },
    {
      key: 'b',
      ctrlKey: true,
      action: () => router.push('/edificios'),
      description: 'Ir a edificios (Buildings)',
    },
    {
      key: 't',
      ctrlKey: true,
      action: () => router.push('/inquilinos'),
      description: 'Ir a inquilinos (Tenants)',
    },
    {
      key: 'c',
      ctrlKey: true,
      action: () => router.push('/contratos'),
      description: 'Ir a contratos',
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => router.push('/pagos'),
      description: 'Ir a pagos',
    },
    {
      key: 'm',
      ctrlKey: true,
      action: () => router.push('/mantenimiento'),
      description: 'Ir a mantenimiento',
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        // Toggle shortcuts help modal
        const event = new CustomEvent('toggle-shortcuts-help');
        window.dispatchEvent(event);
      },
      description: 'Mostrar ayuda de atajos',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
