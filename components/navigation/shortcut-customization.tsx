'use client';

/**
 * SHORTCUT CUSTOMIZATION
 * Sistema de personalización de atajos de teclado por usuario
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Keyboard, Save, RotateCcw, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

// Tipos
interface ShortcutConfig {
  id: string;
  action: string;
  description: string;
  defaultKeys: string;
  customKeys?: string;
  category: 'global' | 'navigation' | 'actions' | 'sequences';
  editable: boolean;
}

// Configuración por defecto de shortcuts
const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  // Globales
  {
    id: 'command-palette',
    action: 'Abrir Command Palette',
    description: 'Búsqueda y acciones rápidas',
    defaultKeys: 'Cmd+K',
    category: 'global',
    editable: true,
  },
  {
    id: 'go-home',
    action: 'Ir a Dashboard',
    description: 'Volver al inicio',
    defaultKeys: 'Cmd+H',
    category: 'global',
    editable: true,
  },
  {
    id: 'search',
    action: 'Buscar',
    description: 'Focus en campo de búsqueda',
    defaultKeys: 'Cmd+/',
    category: 'global',
    editable: true,
  },
  {
    id: 'help',
    action: 'Ayuda de Shortcuts',
    description: 'Ver lista de atajos',
    defaultKeys: '?',
    category: 'global',
    editable: true,
  },
  
  // Navegación
  {
    id: 'go-properties',
    action: 'Ir a Propiedades',
    description: 'Navegar a propiedades',
    defaultKeys: 'G+P',
    category: 'navigation',
    editable: true,
  },
  {
    id: 'go-tenants',
    action: 'Ir a Inquilinos',
    description: 'Navegar a inquilinos',
    defaultKeys: 'G+T',
    category: 'navigation',
    editable: true,
  },
  {
    id: 'go-contracts',
    action: 'Ir a Contratos',
    description: 'Navegar a contratos',
    defaultKeys: 'G+C',
    category: 'navigation',
    editable: true,
  },
  {
    id: 'go-payments',
    action: 'Ir a Pagos',
    description: 'Navegar a pagos',
    defaultKeys: 'G+B',
    category: 'navigation',
    editable: true,
  },
  
  // Acciones
  {
    id: 'create-new',
    action: 'Crear Nuevo',
    description: 'Crear nuevo elemento en listas',
    defaultKeys: 'N',
    category: 'actions',
    editable: true,
  },
  {
    id: 'focus-search',
    action: 'Focus Búsqueda',
    description: 'Focus en campo de búsqueda',
    defaultKeys: 'F',
    category: 'actions',
    editable: true,
  },
];

// Storage key
const STORAGE_KEY = 'inmova_custom_shortcuts';

export function ShortcutCustomization() {
  const [open, setOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(DEFAULT_SHORTCUTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [recordingKeys, setRecordingKeys] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar shortcuts personalizados
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const customShortcuts = JSON.parse(stored);
        const merged = DEFAULT_SHORTCUTS.map((def) => {
          const custom = customShortcuts.find((c: any) => c.id === def.id);
          return custom ? { ...def, customKeys: custom.customKeys } : def;
        });
        setShortcuts(merged);
      }
    } catch (error) {
      console.warn('[Shortcut Customization] Error loading shortcuts:', error);
    }
  }, []);

  // Guardar shortcuts personalizados
  const saveShortcuts = () => {
    try {
      const customized = shortcuts
        .filter((s) => s.customKeys && s.customKeys !== s.defaultKeys)
        .map((s) => ({ id: s.id, customKeys: s.customKeys }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customized));
      setHasChanges(false);
      toast.success('Shortcuts guardados correctamente');
      
      // Recargar página para aplicar cambios
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Error guardando shortcuts');
    }
  };

  // Resetear a valores por defecto
  const resetToDefaults = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    localStorage.removeItem(STORAGE_KEY);
    setHasChanges(true);
    toast.success('Shortcuts reseteados a valores por defecto');
  };

  // Iniciar edición
  const startEdit = (shortcut: ShortcutConfig) => {
    setEditingId(shortcut.id);
    setEditValue(shortcut.customKeys || shortcut.defaultKeys);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setRecordingKeys(false);
  };

  // Guardar edición
  const saveEdit = (shortcutId: string) => {
    if (!editValue.trim()) {
      toast.error('El shortcut no puede estar vacío');
      return;
    }

    // Verificar si ya existe
    const duplicate = shortcuts.find(
      (s) => s.id !== shortcutId && 
      (s.customKeys || s.defaultKeys) === editValue
    );

    if (duplicate) {
      toast.error(`Este shortcut ya está asignado a "${duplicate.action}"`);
      return;
    }

    setShortcuts((prev) =>
      prev.map((s) =>
        s.id === shortcutId ? { ...s, customKeys: editValue } : s
      )
    );

    setEditingId(null);
    setEditValue('');
    setHasChanges(true);
    toast.success('Shortcut actualizado');
  };

  // Grabar teclas presionadas
  const startRecording = () => {
    setRecordingKeys(true);
    setEditValue('Presiona las teclas...');

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      const keys: string[] = [];
      if (e.ctrlKey || e.metaKey) keys.push('Cmd');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');
      
      if (!['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)) {
        keys.push(e.key.toUpperCase());
      }

      setEditValue(keys.join('+'));
      setRecordingKeys(false);
      document.removeEventListener('keydown', handleKeyDown);
    };

    document.addEventListener('keydown', handleKeyDown);

    // Timeout para cancelar
    setTimeout(() => {
      if (recordingKeys) {
        setRecordingKeys(false);
        document.removeEventListener('keydown', handleKeyDown);
        toast.error('Tiempo de grabación excedido');
      }
    }, 5000);
  };

  const categoryLabels = {
    global: 'Globales',
    navigation: 'Navegación',
    actions: 'Acciones',
    sequences: 'Secuencias',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Personalizar Shortcuts
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Personalizar Atajos de Teclado
          </DialogTitle>
          <DialogDescription>
            Personaliza los atajos de teclado según tus preferencias
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="global">Globales</TabsTrigger>
            <TabsTrigger value="navigation">Navegación</TabsTrigger>
            <TabsTrigger value="actions">Acciones</TabsTrigger>
            <TabsTrigger value="sequences">Secuencias</TabsTrigger>
          </TabsList>

          {['global', 'navigation', 'actions', 'sequences'].map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut) => (
                      <Card key={shortcut.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-medium">{shortcut.action}</div>
                              <div className="text-sm text-muted-foreground">
                                {shortcut.description}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {editingId === shortcut.id ? (
                                <>
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEdit(shortcut.id);
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                    className="w-32"
                                    placeholder="Ej: Cmd+K"
                                    disabled={recordingKeys}
                                  />
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={startRecording}
                                    disabled={recordingKeys}
                                  >
                                    <Keyboard className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => saveEdit(shortcut.id)}
                                    disabled={recordingKeys}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Badge variant="secondary" className="font-mono">
                                    {shortcut.customKeys || shortcut.defaultKeys}
                                  </Badge>
                                  
                                  {shortcut.customKeys && (
                                    <Badge variant="outline" className="text-xs">
                                      Default: {shortcut.defaultKeys}
                                    </Badge>
                                  )}
                                  
                                  {shortcut.editable && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEdit(shortcut)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer con botones de acción */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Resetear a Defaults
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveShortcuts}
              disabled={!hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
