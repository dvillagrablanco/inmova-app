'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Building2, 
  Home, 
  User, 
  FileText, 
  Briefcase,
  Search,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import logger, { logError } from '@/lib/logger';

interface SearchResult {
  id: string;
  type: 'building' | 'unit' | 'tenant' | 'contract' | 'provider';
  title: string;
  subtitle?: string;
  badge?: string;
  [key: string]: any;
}

interface SearchResults {
  buildings: SearchResult[];
  units: SearchResult[];
  tenants: SearchResult[];
  contracts: SearchResult[];
  providers: SearchResult[];
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = 'inmova-recent-searches';
const MAX_RECENT_SEARCHES = 5;

const popularSearches = [
  'Inquilinos activos',
  'Contratos por vencer',
  'Pagos pendientes',
  'Edificios',
  'Unidades disponibles'
];

export function EnhancedGlobalSearch() {
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
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Cargar búsquedas recientes desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        logger.error('Error loading recent searches:', e);
      }
    }
  }, []);

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
      
      // Guardar en búsquedas recientes
      saveRecentSearch(searchQuery);
    } catch (error) {
      logger.error('Error searching:', error);
      toast.error('Error al buscar');
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecentSearch = (searchQuery: string) => {
    const newSearch: RecentSearch = {
      query: searchQuery,
      timestamp: Date.now()
    };

    const updated = [
      newSearch,
      ...recentSearches.filter(s => s.query.toLowerCase() !== searchQuery.toLowerCase())
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
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

  const handleRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery);
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
    return <Icon className="mr-2 h-4 w-4 shrink-0" />;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      building: 'Edificio',
      unit: 'Unidad',
      tenant: 'Inquilino',
      contract: 'Contrato',
      provider: 'Proveedor',
    };
    return labels[type as keyof typeof labels] || '';
  };

  const getGroupLabel = (type: string) => {
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

  const renderSearchResult = (item: SearchResult) => (
    <CommandItem
      key={item.id}
      onSelect={() => handleSelect(item.type, item.id)}
      className="cursor-pointer flex items-center gap-3 py-3"
    >
      {getIcon(item.type)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.title}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            {getTypeLabel(item.type)}
          </Badge>
        </div>
        {item.subtitle && (
          <span className="text-xs text-muted-foreground truncate block">
            {item.subtitle}
          </span>
        )}
      </div>
    </CommandItem>
  );

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start text-sm text-muted-foreground",
          "sm:pr-12 md:w-40 lg:w-64 xl:w-80"
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        <span className="hidden lg:inline-flex truncate">Buscar en Inmova...</span>
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
          {/* Estado de carga */}
          {isLoading && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Buscando...
              </div>
            </div>
          )}
          
          {/* Sin resultados */}
          {!isLoading && query.length >= 2 && totalResults === 0 && (
            <CommandEmpty>
              <div className="py-6 text-center">
                <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No se encontraron resultados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            </CommandEmpty>
          )}

          {/* Mensaje inicial */}
          {!isLoading && query.length < 2 && (
            <>
              {/* Búsquedas recientes */}
              {recentSearches.length > 0 && (
                <>
                  <CommandGroup heading="Búsquedas recientes">
                    {recentSearches.map((search, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => handleRecentSearch(search.query)}
                        className="cursor-pointer"
                      >
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{search.query}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="mr-2 h-3 w-3" />
                      Limpiar historial
                    </Button>
                  </div>
                  <CommandSeparator />
                </>
              )}

              {/* Búsquedas populares */}
              <CommandGroup heading="Búsquedas populares">
                {popularSearches.map((search, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => handleRecentSearch(search)}
                    className="cursor-pointer"
                  >
                    <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{search}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <div className="px-4 py-3 text-center text-xs text-muted-foreground border-t mt-2">
                Escribe al menos 2 caracteres para buscar
              </div>
            </>
          )}

          {/* Resultados por categoría */}
          {!isLoading && totalResults > 0 && (
            <>
              {results.buildings.length > 0 && (
                <CommandGroup heading={getGroupLabel('building')}>
                  {results.buildings.map(renderSearchResult)}
                </CommandGroup>
              )}

              {results.units.length > 0 && (
                <CommandGroup heading={getGroupLabel('unit')}>
                  {results.units.map(renderSearchResult)}
                </CommandGroup>
              )}

              {results.tenants.length > 0 && (
                <CommandGroup heading={getGroupLabel('tenant')}>
                  {results.tenants.map(renderSearchResult)}
                </CommandGroup>
              )}

              {results.contracts.length > 0 && (
                <CommandGroup heading={getGroupLabel('contract')}>
                  {results.contracts.map(renderSearchResult)}
                </CommandGroup>
              )}

              {results.providers.length > 0 && (
                <CommandGroup heading={getGroupLabel('provider')}>
                  {results.providers.map(renderSearchResult)}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
