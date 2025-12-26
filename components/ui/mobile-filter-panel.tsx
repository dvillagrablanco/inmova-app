'use client';

import { ReactNode, useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  type: 'select' | 'search' | 'date' | 'custom';
  options?: Array<{ value: string; label: string }>;
  component?: ReactNode;
  placeholder?: string;
}

interface MobileFilterPanelProps {
  filters: FilterOption[];
  activeFilters: Array<{ id: string; label: string; value: string }>;
  onFilterChange: (id: string, value: string) => void;
  onClearAll?: () => void;
  className?: string;
  title?: string;
  description?: string;
}

export function MobileFilterPanel({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  className,
  title = 'Filtros',
  description = 'Refina tu búsqueda con los filtros disponibles',
}: MobileFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const activeFilterCount = activeFilters.length;

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const handleClearAll = () => {
    onClearAll?.();
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Filter Button - Visible on small screens */}
      <div className={cn('lg:hidden', className)}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto relative" size="default">
              <Filter className="mr-2 h-4 w-4" />
              {title}
              {activeFilterCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle>{title}</SheetTitle>
                  <SheetDescription className="text-sm mt-1">{description}</SheetDescription>
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-sm">
                    Limpiar todo
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-4 py-4">
              {filters.map((filter) => (
                <Card key={filter.id} className="border-0 shadow-none">
                  <CardContent className="p-4 space-y-3">
                    {/* Filter Header */}
                    <button
                      onClick={() => toggleSection(filter.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-sm">{filter.label}</span>
                      {expandedSections.has(filter.id) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Filter Content */}
                    {expandedSections.has(filter.id) && (
                      <div className="space-y-2 pt-2">
                        {filter.type === 'select' && filter.options && (
                          <div className="grid grid-cols-1 gap-2">
                            {filter.options.map((option) => {
                              const isActive = activeFilters.some(
                                (f) => f.id === filter.id && f.value === option.value
                              );
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => onFilterChange(filter.id, option.value)}
                                  className={cn(
                                    'w-full px-4 py-2 text-sm rounded-lg text-left transition-colors',
                                    isActive
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted hover:bg-muted/80'
                                  )}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {filter.type === 'custom' && filter.component && (
                          <div>{filter.component}</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 flex gap-2">
              <SheetClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </SheetClose>
              <Button onClick={handleApply} className="flex-1 gradient-primary">
                Aplicar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filter Display - Hidden on small screens */}
      <div className="hidden lg:flex lg:flex-wrap lg:gap-2">
        {filters.map((filter) => (
          <div key={filter.id} className="min-w-[200px]">
            {filter.type === 'custom' && filter.component ? (
              filter.component
            ) : filter.type === 'select' && filter.options ? (
              <select
                value={activeFilters.find((f) => f.id === filter.id)?.value || ''}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">{filter.placeholder || filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ))}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <X className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </>
  );
}
