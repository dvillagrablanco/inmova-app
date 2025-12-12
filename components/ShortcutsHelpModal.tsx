"use client";

import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navegación
  { keys: ['Ctrl', 'K'], description: 'Abrir paleta de comandos', category: 'Navegación' },
  { keys: ['Ctrl', 'H'], description: 'Ir al dashboard', category: 'Navegación' },
  { keys: ['Ctrl', 'U'], description: 'Ir a usuarios', category: 'Navegación' },
  { keys: ['Ctrl', 'B'], description: 'Ir a edificios', category: 'Navegación' },
  { keys: ['Ctrl', 'T'], description: 'Ir a inquilinos', category: 'Navegación' },
  { keys: ['Ctrl', 'C'], description: 'Ir a contratos', category: 'Navegación' },
  { keys: ['Ctrl', 'P'], description: 'Ir a pagos', category: 'Navegación' },
  { keys: ['Ctrl', 'M'], description: 'Ir a mantenimiento', category: 'Navegación' },
  
  // Ayuda
  { keys: ['Ctrl', '/'], description: 'Mostrar/ocultar ayuda de atajos', category: 'Ayuda' },
];

const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

export function ShortcutsHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggle-shortcuts-help', handleToggle);
    return () => window.removeEventListener('toggle-shortcuts-help', handleToggle);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atajos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <span key={i} className="flex items-center">
                            <kbd className="px-2 py-1 bg-muted rounded text-xs font-semibold">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-muted-foreground">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 text-sm text-muted-foreground">
          <p>
            💡 <strong>Tip:</strong> Los atajos no funcionan cuando estás escribiendo en un campo de
            texto.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
