'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Building2, 
  Home, 
  User, 
  FileText, 
  Briefcase,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

interface SearchResult {
  id: string;
  type: 'building' | 'unit' | 'tenant' | 'contract' | 'provider';
  [key: string]: any;
}

interface SearchResults {
  buildings: SearchResult[];
  units: SearchResult[];
  tenants: SearchResult[];
  contracts: SearchResult[];
  providers: SearchResult[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    buildings: [],
    units: [],
    tenants: [],
    contracts: [],
    providers: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Atajo de teclado Ctrl+K o Cmd+K
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

  // Búsqueda con debounce
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults({
          buildings: [],
          units: [],
          tenants: [],
          contracts: [],
          providers: [],
        });
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Error en búsqueda');
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      logger.error('Error searching:', error);
      toast.error('Error al buscar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    setQuery('');
    
    const routes: Record<string, string> = {
      building: '/edificios',
      unit: '/unidades',
      tenant: '/inquilinos',
      contract: '/contratos',
      provider: '/proveedores',
    };

    router.push(`${routes[type]}/${id}`);
  };

  const getIcon = (type: string) => {
    const icons = {
      building: Building2,
      unit: Home,
      tenant: User,
      contract: FileText,
      provider: Briefcase,
    };
    const Icon = icons[type as keyof typeof icons] || Search;
    return <Icon className="mr-2 h-4 w-4" />;
  };

  const getLabel = (type: string) => {
    const labels = {
      building: 'Edificios',
      unit: 'Unidades',
      tenant: 'Inquilinos',
      contract: 'Contratos',
      provider: 'Proveedores',
    };
    return labels[type as keyof typeof labels] || '';
  };

  const totalResults = 
    results.buildings.length +
    results.units.length +
    results.tenants.length +
    results.contracts.length +
    results.providers.length;

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Buscar edificios, unidades, inquilinos..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Buscando...
            </div>
          )}
          
          {!isLoading && query.length >= 2 && totalResults === 0 && (
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}

          {/* Edificios */}
          {results.buildings.length > 0 && (
            <CommandGroup heading={getLabel('building')}>
              {results.buildings.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect('building', item.id)}
                  className="cursor-pointer"
                >
                  {getIcon('building')}
                  <div className="flex flex-col">
                    <span className="font-medium">{item.nombre}</span>
                    <span className="text-xs text-muted-foreground">{item.direccion}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Unidades */}
          {results.units.length > 0 && (
            <CommandGroup heading={getLabel('unit')}>
              {results.units.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect('unit', item.id)}
                  className="cursor-pointer"
                >
                  {getIcon('unit')}
                  <div className="flex flex-col">
                    <span className="font-medium">Unidad {item.numero}</span>
                    <span className="text-xs text-muted-foreground">{item.building?.nombre}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Inquilinos */}
          {results.tenants.length > 0 && (
            <CommandGroup heading={getLabel('tenant')}>
              {results.tenants.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect('tenant', item.id)}
                  className="cursor-pointer"
                >
                  {getIcon('tenant')}
                  <div className="flex flex-col">
                    <span className="font-medium">{item.nombreCompleto}</span>
                    <span className="text-xs text-muted-foreground">{item.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Contratos */}
          {results.contracts.length > 0 && (
            <CommandGroup heading={getLabel('contract')}>
              {results.contracts.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect('contract', item.id)}
                  className="cursor-pointer"
                >
                  {getIcon('contract')}
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {item.tenant?.nombreCompleto} - {item.unit?.numero}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Proveedores */}
          {results.providers.length > 0 && (
            <CommandGroup heading={getLabel('provider')}>
              {results.providers.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect('provider', item.id)}
                  className="cursor-pointer"
                >
                  {getIcon('provider')}
                  <div className="flex flex-col">
                    <span className="font-medium">{item.nombre}</span>
                    <span className="text-xs text-muted-foreground">{item.tipo}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
