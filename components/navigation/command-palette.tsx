'use client';

/**
 * COMMAND PALETTE - Cmd/Ctrl + K
 * Navegación rápida estilo VS Code / Raycast
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  Building2,
  Users,
  FileText,
  DollarSign,
  Wrench,
  Calendar,
  MessageSquare,
  Plus,
  Search,
  Clock,
  TrendingUp,
  Settings,
  HelpCircle,
  File,
  Package,
  BarChart2,
  AlertCircle,
  UserPlus,
  FileSignature,
  Upload,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';

interface CommandAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  group: 'navigation' | 'actions' | 'search' | 'recent' | 'help';
  badge?: string;
  shortcut?: string[];
}

interface RecentPage {
  url: string;
  title: string;
  timestamp: number;
}

export function CommandPalette() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  // Cargar historial reciente desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent-pages');
      if (stored) {
        setRecentPages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent pages:', error);
    }
  }, []);

  // Guardar página visitada
  const saveRecentPage = useCallback((url: string, title: string) => {
    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p.url !== url);
      const updated = [
        { url, title, timestamp: Date.now() },
        ...filtered,
      ].slice(0, 10); // Máximo 10 recientes

      try {
        localStorage.setItem('recent-pages', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent pages:', error);
      }

      return updated;
    });
  }, []);

  // Toggle con Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Atajo alternativo: Cmd/Ctrl + P
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Ayuda con ?
      if (e.key === '?' && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  // Acciones disponibles
  const actions: CommandAction[] = [
    // NAVEGACIÓN
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => {
        router.push('/dashboard');
        saveRecentPage('/dashboard', 'Dashboard');
      },
      keywords: ['inicio', 'home', 'principal'],
      group: 'navigation',
      shortcut: ['Ctrl', 'H'],
    },
    {
      id: 'nav-properties',
      label: 'Propiedades',
      icon: Building2,
      action: () => {
        router.push('/propiedades');
        saveRecentPage('/propiedades', 'Propiedades');
      },
      keywords: ['properties', 'inmuebles', 'units'],
      group: 'navigation',
      shortcut: ['G', 'P'],
    },
    {
      id: 'nav-tenants',
      label: 'Inquilinos',
      icon: Users,
      action: () => {
        router.push('/inquilinos');
        saveRecentPage('/inquilinos', 'Inquilinos');
      },
      keywords: ['tenants', 'renters', 'arrendatarios'],
      group: 'navigation',
      shortcut: ['G', 'T'],
    },
    {
      id: 'nav-contracts',
      label: 'Contratos',
      icon: FileText,
      action: () => {
        router.push('/contratos');
        saveRecentPage('/contratos', 'Contratos');
      },
      keywords: ['contracts', 'agreements'],
      group: 'navigation',
      shortcut: ['G', 'C'],
    },
    {
      id: 'nav-payments',
      label: 'Pagos',
      icon: DollarSign,
      action: () => {
        router.push('/pagos');
        saveRecentPage('/pagos', 'Pagos');
      },
      keywords: ['payments', 'invoices', 'facturas'],
      group: 'navigation',
      badge: '3 pendientes',
      shortcut: ['G', '$'],
    },
    {
      id: 'nav-maintenance',
      label: 'Mantenimiento',
      icon: Wrench,
      action: () => {
        router.push('/mantenimiento');
        saveRecentPage('/mantenimiento', 'Mantenimiento');
      },
      keywords: ['maintenance', 'repairs', 'incidencias'],
      group: 'navigation',
    },
    {
      id: 'nav-calendar',
      label: 'Calendario',
      icon: Calendar,
      action: () => {
        router.push('/calendario');
        saveRecentPage('/calendario', 'Calendario');
      },
      keywords: ['calendar', 'events', 'citas'],
      group: 'navigation',
    },
    {
      id: 'nav-documents',
      label: 'Documentos',
      icon: File,
      action: () => {
        router.push('/documentos');
        saveRecentPage('/documentos', 'Documentos');
      },
      keywords: ['documents', 'files', 'archivos'],
      group: 'navigation',
    },
    {
      id: 'nav-analytics',
      label: 'Analytics',
      icon: BarChart2,
      action: () => {
        router.push('/analytics');
        saveRecentPage('/analytics', 'Analytics');
      },
      keywords: ['analytics', 'reportes', 'reports'],
      group: 'navigation',
    },

    // ACCIONES RÁPIDAS
    {
      id: 'action-new-property',
      label: 'Nueva Propiedad',
      icon: Plus,
      action: () => {
        router.push('/propiedades/crear');
      },
      keywords: ['create', 'add', 'nueva', 'agregar'],
      group: 'actions',
      shortcut: ['Shift', 'P'],
    },
    {
      id: 'action-new-tenant',
      label: 'Nuevo Inquilino',
      icon: UserPlus,
      action: () => {
        router.push('/inquilinos/nuevo');
      },
      keywords: ['create', 'add', 'nuevo', 'agregar'],
      group: 'actions',
      shortcut: ['Shift', 'T'],
    },
    {
      id: 'action-new-contract',
      label: 'Nuevo Contrato',
      icon: FileText,
      action: () => {
        router.push('/contratos/nuevo');
      },
      keywords: ['create', 'add', 'nuevo', 'agregar'],
      group: 'actions',
      shortcut: ['Shift', 'C'],
    },
    {
      id: 'action-register-payment',
      label: 'Registrar Pago',
      icon: DollarSign,
      action: () => {
        router.push('/pagos/nuevo');
      },
      keywords: ['payment', 'pago', 'factura'],
      group: 'actions',
      shortcut: ['Shift', '$'],
    },
    {
      id: 'action-report-incident',
      label: 'Reportar Incidencia',
      icon: AlertCircle,
      action: () => {
        router.push('/incidencias/nueva');
      },
      keywords: ['incident', 'incidencia', 'problema'],
      group: 'actions',
    },
    {
      id: 'action-sign-document',
      label: 'Firma Digital',
      icon: FileSignature,
      action: () => {
        router.push('/firma-digital');
      },
      keywords: ['sign', 'firma', 'signature'],
      group: 'actions',
    },
    {
      id: 'action-upload-document',
      label: 'Subir Documento',
      icon: Upload,
      action: () => {
        router.push('/documentos?action=upload');
      },
      keywords: ['upload', 'subir', 'file'],
      group: 'actions',
    },

    // BÚSQUEDA
    {
      id: 'search-properties',
      label: 'Buscar Propiedades',
      icon: Search,
      action: () => {
        router.push('/propiedades?focus=search');
      },
      keywords: ['search', 'buscar', 'find'],
      group: 'search',
    },
    {
      id: 'search-tenants',
      label: 'Buscar Inquilinos',
      icon: Search,
      action: () => {
        router.push('/inquilinos?focus=search');
      },
      keywords: ['search', 'buscar', 'find'],
      group: 'search',
    },

    // AYUDA
    {
      id: 'help-shortcuts',
      label: 'Ver Shortcuts',
      icon: HelpCircle,
      action: () => {
        // Abrir modal de shortcuts
        console.log('Show shortcuts modal');
      },
      keywords: ['help', 'ayuda', 'shortcuts', 'atajos'],
      group: 'help',
    },
    {
      id: 'help-docs',
      label: 'Documentación',
      icon: HelpCircle,
      action: () => {
        router.push('/knowledge-base');
      },
      keywords: ['help', 'ayuda', 'docs', 'documentation'],
      group: 'help',
    },
  ];

  const handleAction = useCallback(
    (action: CommandAction) => {
      setOpen(false);
      action.action();
    },
    []
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar página o acción..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        {/* Recientes */}
        {recentPages.length > 0 && (
          <>
            <CommandGroup heading="📍 Visitados Recientemente">
              {recentPages.slice(0, 5).map((page) => (
                <CommandItem
                  key={page.url}
                  onSelect={() => {
                    setOpen(false);
                    router.push(page.url);
                  }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{page.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navegación */}
        <CommandGroup heading="🧭 Ir a...">
          {actions
            .filter((a) => a.group === 'navigation')
            .map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => handleAction(action)}
                keywords={action.keywords}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <span className="flex-1">{action.label}</span>
                {action.badge && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {action.badge}
                  </Badge>
                )}
                {action.shortcut && (
                  <div className="ml-auto flex gap-1">
                    {action.shortcut.map((key, i) => (
                      <kbd
                        key={i}
                        className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                )}
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Acciones Rápidas */}
        <CommandGroup heading="⚡ Acciones Rápidas">
          {actions
            .filter((a) => a.group === 'actions')
            .map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => handleAction(action)}
                keywords={action.keywords}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <span className="flex-1">{action.label}</span>
                {action.shortcut && (
                  <div className="ml-auto flex gap-1">
                    {action.shortcut.map((key, i) => (
                      <kbd
                        key={i}
                        className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                )}
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Búsqueda */}
        <CommandGroup heading="🔍 Buscar">
          {actions
            .filter((a) => a.group === 'search')
            .map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => handleAction(action)}
                keywords={action.keywords}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <span>{action.label}</span>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Ayuda */}
        <CommandGroup heading="❓ Ayuda">
          {actions
            .filter((a) => a.group === 'help')
            .map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => handleAction(action)}
                keywords={action.keywords}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <span>{action.label}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
