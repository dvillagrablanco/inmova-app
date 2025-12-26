'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { Badge } from './badge';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Building, Users, FileText, Home, CreditCard, Wrench, Package } from 'lucide-react';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-navigation';

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  url: string;
  icon?: React.ReactNode;
}

interface GlobalSearchEnhancedProps {
  searchData?: SearchItem[];
}

export function GlobalSearchEnhanced({ searchData = [] }: GlobalSearchEnhancedProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Default search items (can be replaced with dynamic data)
  const defaultItems: SearchItem[] = [
    {
      id: '1',
      title: 'Dashboard',
      category: 'Navigation',
      url: '/dashboard',
      icon: <Home className="h-4 w-4" />,
    },
    {
      id: '2',
      title: 'Edificios',
      category: 'Navigation',
      url: '/edificios',
      icon: <Building className="h-4 w-4" />,
    },
    {
      id: '3',
      title: 'Unidades',
      category: 'Navigation',
      url: '/unidades',
      icon: <Package className="h-4 w-4" />,
    },
    {
      id: '4',
      title: 'Inquilinos',
      category: 'Navigation',
      url: '/inquilinos',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: '5',
      title: 'Contratos',
      category: 'Navigation',
      url: '/contratos',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: '6',
      title: 'Pagos',
      category: 'Navigation',
      url: '/pagos',
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      id: '7',
      title: 'Mantenimiento',
      category: 'Navigation',
      url: '/mantenimiento',
      icon: <Wrench className="h-4 w-4" />,
    },
  ];

  const items = searchData.length > 0 ? searchData : defaultItems;

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['title', 'description', 'category'],
        threshold: 0.3,
        includeScore: true,
      }),
    [items]
  );

  // Search results
  const results = useMemo(() => {
    if (!query) return items;
    return fuse.search(query).map((result) => result.item);
  }, [query, fuse, items]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    results.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [results]);

  // Handle item selection
  const handleSelect = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      setQuery('');
      router.push(item.url);
    },
    [router]
  );

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      'meta+k': () => setOpen(true),
      'ctrl+k': () => setOpen(true),
    },
    true
  );

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md hover:bg-accent transition-colors"
      >
        <span>Buscar...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <div className="flex flex-col">
            {/* Search Input */}
            <div className="border-b p-4">
              <Input
                placeholder="Buscar páginas, contenido..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            </div>

            {/* Results */}
            <ScrollArea className="max-h-[400px]">
              {Object.keys(groupedResults).length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No se encontraron resultados
                </div>
              ) : (
                <div className="p-2">
                  {Object.entries(groupedResults).map(([category, items]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {category}
                      </div>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
                          >
                            {item.icon && (
                              <div className="flex-shrink-0 text-muted-foreground">{item.icon}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{item.title}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="flex-shrink-0 text-xs">
                              {item.category}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                    ↑↓
                  </kbd>
                  Navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                    ↵
                  </kbd>
                  Seleccionar
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                  esc
                </kbd>
                Cerrar
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
