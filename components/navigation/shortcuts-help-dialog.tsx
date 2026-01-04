'use client';

/**
 * SHORTCUTS HELP DIALOG
 * Modal que muestra todos los atajos de teclado disponibles
 * Se abre con "?" o desde el Command Palette
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  Search,
  Navigation,
  Zap,
  HelpCircle,
  Grid3x3,
  List,
  ArrowLeft,
  Plus,
  Home,
  Building2,
  Users,
  FileText,
  DollarSign,
  Wrench,
} from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  icon?: React.ElementType;
}

interface ShortcutSection {
  title: string;
  description?: string;
  shortcuts: Shortcut[];
}

const SHORTCUTS: ShortcutSection[] = [
  {
    title: 'Navegación Global',
    description: 'Funciona en cualquier página',
    shortcuts: [
      {
        keys: ['Cmd', 'K'],
        description: 'Abrir Command Palette (buscar y navegar)',
        icon: Command,
      },
      {
        keys: ['Cmd', 'H'],
        description: 'Ir a Dashboard',
        icon: Home,
      },
      {
        keys: ['Cmd', '/'],
        description: 'Focus en búsqueda global',
        icon: Search,
      },
      {
        keys: ['Cmd', 'B'],
        description: 'Toggle Sidebar',
        icon: Navigation,
      },
      {
        keys: ['Backspace'],
        description: 'Volver a página anterior',
        icon: ArrowLeft,
      },
      {
        keys: ['?'],
        description: 'Mostrar esta ayuda',
        icon: HelpCircle,
      },
      {
        keys: ['Esc'],
        description: 'Cerrar modales y dialogs',
      },
    ],
  },
  {
    title: 'Secuencias (estilo Gmail)',
    description: 'Presiona las teclas en secuencia (ej: G luego P)',
    shortcuts: [
      {
        keys: ['G', 'D'],
        description: 'Ir a Dashboard',
        icon: Home,
      },
      {
        keys: ['G', 'P'],
        description: 'Ir a Propiedades',
        icon: Building2,
      },
      {
        keys: ['G', 'T'],
        description: 'Ir a Inquilinos (Tenants)',
        icon: Users,
      },
      {
        keys: ['G', 'C'],
        description: 'Ir a Contratos',
        icon: FileText,
      },
      {
        keys: ['G', '$'],
        description: 'Ir a Pagos',
        icon: DollarSign,
      },
      {
        keys: ['G', 'M'],
        description: 'Ir a Mantenimiento',
        icon: Wrench,
      },
    ],
  },
  {
    title: 'Propiedades',
    description: 'Cuando estás en /propiedades',
    shortcuts: [
      {
        keys: ['N'],
        description: 'Nueva Propiedad',
        icon: Plus,
      },
      {
        keys: ['F'],
        description: 'Focus en búsqueda',
        icon: Search,
      },
      {
        keys: ['G'],
        description: 'Vista Grid',
        icon: Grid3x3,
      },
      {
        keys: ['L'],
        description: 'Vista Lista',
        icon: List,
      },
    ],
  },
  {
    title: 'Inquilinos',
    description: 'Cuando estás en /inquilinos',
    shortcuts: [
      {
        keys: ['N'],
        description: 'Nuevo Inquilino',
        icon: Plus,
      },
      {
        keys: ['F'],
        description: 'Focus en búsqueda',
        icon: Search,
      },
    ],
  },
  {
    title: 'Contratos',
    description: 'Cuando estás en /contratos',
    shortcuts: [
      {
        keys: ['N'],
        description: 'Nuevo Contrato',
        icon: Plus,
      },
    ],
  },
  {
    title: 'Pagos',
    description: 'Cuando estás en /pagos',
    shortcuts: [
      {
        keys: ['N'],
        description: 'Registrar Pago',
        icon: Plus,
      },
    ],
  },
];

export function ShortcutsHelpDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Escuchar evento custom para abrir el dialog
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-shortcuts-help', handleOpen);

    // También abrir con Cmd+Shift+/ (alternativo a ?)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '/') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-shortcuts-help', handleOpen);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Command className="h-6 w-6" />
            Atajos de Teclado
          </DialogTitle>
          <DialogDescription>
            Usa estos atajos para navegar más rápido por la aplicación
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-8">
            {SHORTCUTS.map((section, index) => (
              <div key={index}>
                {index > 0 && <Separator className="my-6" />}
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  {section.shortcuts.map((shortcut, shortcutIndex) => {
                    const Icon = shortcut.icon;
                    return (
                      <div
                        key={shortcutIndex}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-sm">{shortcut.description}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <div key={keyIndex} className="flex items-center gap-1">
                              <kbd className="pointer-events-none inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
                                {key === 'Cmd' ? (
                                  <span className="text-sm">⌘</span>
                                ) : key === 'Ctrl' ? (
                                  <span className="text-sm">Ctrl</span>
                                ) : key === 'Shift' ? (
                                  <span className="text-sm">⇧</span>
                                ) : key === 'Alt' ? (
                                  <span className="text-sm">⌥</span>
                                ) : key === 'Backspace' ? (
                                  <span className="text-sm">⌫</span>
                                ) : key === 'Esc' ? (
                                  <span className="text-sm">Esc</span>
                                ) : (
                                  key
                                )}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-muted-foreground text-xs mx-1">
                                  {section.title === 'Secuencias (estilo Gmail)' ? '→' : '+'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Tip final */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  💡 Tip: Combina atajos para máxima productividad
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Ejemplo: Presiona <kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded text-xs border">G</kbd> luego{' '}
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded text-xs border">P</kbd> para ir a Propiedades, luego{' '}
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded text-xs border">N</kbd> para crear una nueva propiedad.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Los atajos con <kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded text-xs border">Cmd/Ctrl</kbd> funcionan en cualquier momento, incluso dentro de inputs.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
