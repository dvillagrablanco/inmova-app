"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Command {
  id: string;
  title: string;
  path: string;
  icon?: string;
  keywords?: string[];
}

const commands: Command[] = [
  { id: 'dashboard', title: 'Dashboard', path: '/dashboard', keywords: ['inicio', 'home'] },
  { id: 'edificios', title: 'Edificios', path: '/edificios', keywords: ['buildings', 'propiedades'] },
  { id: 'unidades', title: 'Unidades', path: '/unidades', keywords: ['units', 'apartamentos'] },
  { id: 'inquilinos', title: 'Inquilinos', path: '/inquilinos', keywords: ['tenants', 'arrendatarios'] },
  { id: 'contratos', title: 'Contratos', path: '/contratos', keywords: ['contracts', 'leases'] },
  { id: 'pagos', title: 'Pagos', path: '/pagos', keywords: ['payments', 'cobros'] },
  { id: 'mantenimiento', title: 'Mantenimiento', path: '/mantenimiento', keywords: ['maintenance', 'reparaciones'] },
  { id: 'proveedores', title: 'Proveedores', path: '/proveedores', keywords: ['suppliers', 'vendors'] },
  { id: 'documentos', title: 'Documentos', path: '/documentos', keywords: ['documents', 'archivos'] },
  { id: 'reportes', title: 'Reportes', path: '/reportes', keywords: ['reports', 'informes'] },
  { id: 'gastos', title: 'Gastos', path: '/gastos', keywords: ['expenses', 'costos'] },
  { id: 'candidatos', title: 'Candidatos', path: '/candidatos', keywords: ['applicants'] },
  { id: 'tareas', title: 'Tareas', path: '/tareas', keywords: ['tasks', 'pendientes'] },
  { id: 'calendario', title: 'Calendario', path: '/calendario', keywords: ['calendar', 'agenda'] },
  { id: 'perfil', title: 'Perfil', path: '/perfil', keywords: ['profile', 'usuario'] },
  { id: 'admin-dashboard', title: 'Admin Dashboard', path: '/admin/dashboard', keywords: ['administracion'] },
  { id: 'usuarios', title: 'Gestión de Usuarios', path: '/admin/usuarios', keywords: ['users', 'equipo'] },
  { id: 'configuracion', title: 'Configuración', path: '/admin/configuracion', keywords: ['settings', 'config'] },
];

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredCommands, setFilteredCommands] = useState(commands);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Listen for the custom event to open the palette
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Filter commands based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredCommands(commands);
      setSelectedIndex(0);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower))
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  const handleSelect = (command: Command) => {
    router.push(command.path);
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearch('');
    setSelectedIndex(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="flex flex-col">
          {/* Search input */}
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground mr-2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar páginas o acciones..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded-sm transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron resultados
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => handleSelect(command)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="font-medium">{command.title}</div>
                    <div className="text-sm text-muted-foreground">{command.path}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-1">↓</kbd>
              <span className="ml-2">navegar</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
              <span className="ml-2">seleccionar</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
              <span className="ml-2">cerrar</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
