'use client';

import { useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Home,
  Users,
  FileText,
  CreditCard,
  Wrench,
  Settings,
  HelpCircle,
  Plus,
  Search,
  Zap,
} from 'lucide-react';
import { useEffect } from 'react';

/**
 * Menú de acceso rápido con búsqueda (Cmd+K / Ctrl+K)
 * Mejora la navegación y productividad
 */
export function QuickAccessMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Búsqueda rápida</span>
        <kbd className="hidden sm:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar acciones, páginas, módulos..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>

          <CommandGroup heading="Acciones Rápidas">
            <CommandItem onSelect={() => navigate('/edificios?action=new')}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Crear nuevo edificio</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/unidades?action=new')}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Agregar unidad</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/inquilinos?action=new')}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Registrar inquilino</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/contratos?action=new')}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Crear contrato</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navegación">
            <CommandItem onSelect={() => navigate('/dashboard')}>
              <Zap className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/edificios')}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Edificios</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/unidades')}>
              <Home className="mr-2 h-4 w-4" />
              <span>Unidades</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/inquilinos')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Inquilinos</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/contratos')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Contratos</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/pagos')}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Pagos</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/mantenimiento')}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Mantenimiento</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Sistema">
            <CommandItem onSelect={() => navigate('/ajustes')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/knowledge-base')}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Centro de ayuda</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
