'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Home,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Settings,
  Search,
  Clock,
  TrendingUp,
  Loader2,
  Hash,
  AtSign,
  MapPin,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'building' | 'unit' | 'tenant' | 'contract' | 'payment' | 'page';
  title: string;
  subtitle?: string;
  route: string;
  metadata?: Record<string, any>;
  score?: number;
}

interface EnhancedGlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SEARCH_SHORTCUTS = [
  { prefix: '@', description: 'Buscar por nombre', example: '@Juan' },
  { prefix: '#', description: 'Buscar por ID', example: '#12345' },
  { prefix: '$', description: 'Buscar por importe', example: '$500' },
  { prefix: '/', description: 'Navegar directo', example: '/edificios' },
  { prefix: '*', description: 'Buscar en todo', example: '*pendiente' },
];

const TYPE_ICONS: Record<string, any> = {
  building: Building2,
  unit: Home,
  tenant: Users,
  contract: FileText,
  payment: DollarSign,
  page: MapPin,
};

const TYPE_LABELS: Record<string, string> = {
  building: 'Edificio',
  unit: 'Unidad',
  tenant: 'Inquilino',
  contract: 'Contrato',
  payment: 'Pago',
  page: 'Página',
};

const TYPE_COLORS: Record<string, string> = {
  building: 'bg-blue-500',
  unit: 'bg-green-500',
  tenant: 'bg-purple-500',
  contract: 'bg-orange-500',
  payment: 'bg-red-500',
  page: 'bg-gray-500',
};

export function EnhancedGlobalSearch({
  open: externalOpen,
  onOpenChange,
}: EnhancedGlobalSearchProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchScope, setSearchScope] = useState<'all' | 'buildings' | 'tenants' | 'contracts'>(
    'all'
  );

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Save to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((q) => q !== query)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Process query for special prefixes
  const processQuery = useCallback(
    (q: string) => {
      const trimmed = q.trim();

      if (trimmed.startsWith('/')) {
        // Direct navigation
        const path = trimmed.slice(1);
        router.push(`/${path}`);
        setOpen(false);
        return null;
      }

      let searchType = 'general';
      let searchQuery = trimmed;

      if (trimmed.startsWith('@')) {
        searchType = 'name';
        searchQuery = trimmed.slice(1);
      } else if (trimmed.startsWith('#')) {
        searchType = 'id';
        searchQuery = trimmed.slice(1);
      } else if (trimmed.startsWith('$')) {
        searchType = 'amount';
        searchQuery = trimmed.slice(1);
      } else if (trimmed.startsWith('*')) {
        searchType = 'wildcard';
        searchQuery = trimmed.slice(1);
      }

      return { type: searchType, query: searchQuery };
    },
    [router, setOpen]
  );

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      const processed = processQuery(searchQuery);
      if (!processed) return; // Direct navigation handled

      setIsSearching(true);

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: processed.query,
            type: processed.type,
            scope: searchScope,
          }),
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Error al buscar');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [processQuery, searchScope]
  );

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, performSearch]);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // ESC to close
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};

    results.forEach((result) => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });

    return groups;
  }, [results]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      addToRecentSearches(query);
      router.push(result.route);
      setOpen(false);
      setQuery('');
    },
    [query, router, setOpen, addToRecentSearches]
  );

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-96"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar en INMOVA... (Usa @, #, $, / para filtrar)"
          value={query}
          onValueChange={setQuery}
        />

        <CommandList>
          {/* Show shortcuts when no query */}
          {!query && (
            <CommandGroup heading="Atajos de Búsqueda">
              {SEARCH_SHORTCUTS.map((shortcut) => (
                <CommandItem
                  key={shortcut.prefix}
                  onSelect={() => setQuery(shortcut.prefix)}
                  className="cursor-pointer"
                >
                  <kbd className="mr-2 rounded bg-muted px-2 py-1 font-mono text-xs">
                    {shortcut.prefix}
                  </kbd>
                  <div>
                    <p className="text-sm">{shortcut.description}</p>
                    <p className="text-xs text-muted-foreground">{shortcut.example}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Búsquedas Recientes">
                {recentSearches.map((search) => (
                  <CommandItem
                    key={search}
                    onSelect={() => setQuery(search)}
                    className="cursor-pointer"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {search}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Loading State */}
          {isSearching && query && (
            <CommandGroup>
              <CommandItem disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </CommandItem>
            </CommandGroup>
          )}

          {/* Results */}
          {!isSearching && query && results.length === 0 && (
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <p className="text-muted-foreground">No se encontraron resultados para "{query}"</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Prueba con otros términos o usa los atajos de búsqueda
                </p>
              </div>
            </CommandEmpty>
          )}

          {!isSearching &&
            Object.keys(groupedResults).map((type) => (
              <div key={type}>
                <CommandSeparator />
                <CommandGroup heading={`${TYPE_LABELS[type]}s (${groupedResults[type].length})`}>
                  {groupedResults[type].map((result) => {
                    const Icon = TYPE_ICONS[result.type];
                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={cn(
                              'w-8 h-8 rounded flex items-center justify-center',
                              TYPE_COLORS[result.type],
                              'text-white'
                            )}
                          >
                            {Icon && <Icon className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {TYPE_LABELS[result.type]}
                          </Badge>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            ))}

          {/* Quick Actions */}
          {!query && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Acciones Rápidas">
                <CommandItem
                  onSelect={() => router.push('/edificios/nuevo-wizard')}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Crear Nueva Propiedad
                </CommandItem>
                <CommandItem
                  onSelect={() => router.push('/inquilinos/nuevo')}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Añadir Inquilino
                </CommandItem>
                <CommandItem
                  onSelect={() => router.push('/contratos/nuevo')}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Nuevo Contrato
                </CommandItem>
                <CommandItem onSelect={() => router.push('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer with tips */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Tip: Usa ⌘K para abrir/cerrar</span>
            <div className="flex gap-2">
              <kbd className="rounded bg-muted px-1">↑↓</kbd>
              <span>navegar</span>
              <kbd className="rounded bg-muted px-1">↵</kbd>
              <span>seleccionar</span>
            </div>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
