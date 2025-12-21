'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  type: 'search' | 'select' | 'range' | 'date-range' | 'price-range';
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface FilterValues {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset?: () => void;
  className?: string;
  showActiveCount?: boolean;
}

export function AdvancedFilters({
  filters,
  values,
  onChange,
  onReset,
  className,
  showActiveCount = true,
}: AdvancedFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(values.search || '');
  const [isOpen, setIsOpen] = useState(false);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== values.search) {
        onChange({ ...values, search: searchTerm });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFilterChange = (filterId: string, value: any) => {
    onChange({ ...values, [filterId]: value });
  };

  const handleReset = () => {
    const resetValues: FilterValues = {};
    filters.forEach((filter) => {
      resetValues[filter.id] = filter.type === 'search' ? '' : 'all';
    });
    setSearchTerm('');
    onChange(resetValues);
    if (onReset) onReset();
  };

  const activeFiltersCount = Object.values(values).filter(
    (value) => value && value !== 'all' && value !== ''
  ).length;

  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.id} className="w-full">
            <Label htmlFor={filter.id} className="text-sm font-medium mb-2 block">
              {filter.label}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={filter.id}
                type="text"
                placeholder={filter.placeholder || `Buscar ${filter.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.id} className="w-full">
            <Label htmlFor={filter.id} className="text-sm font-medium mb-2 block">
              {filter.label}
            </Label>
            <Select
              value={values[filter.id] || 'all'}
              onValueChange={(value) => handleFilterChange(filter.id, value)}
            >
              <SelectTrigger id={filter.id}>
                <SelectValue placeholder={filter.placeholder || 'Seleccionar'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'price-range':
        return (
          <div key={filter.id} className="w-full">
            <Label className="text-sm font-medium mb-2 block">
              {filter.label}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`${filter.id}-min`} className="text-xs text-muted-foreground">
                  Mínimo
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    id={`${filter.id}-min`}
                    type="number"
                    placeholder="Min"
                    min={filter.min}
                    max={filter.max}
                    step={filter.step || 100}
                    value={values[`${filter.id}_min`] || ''}
                    onChange={(e) =>
                      handleFilterChange(`${filter.id}_min`, e.target.value)
                    }
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`${filter.id}-max`} className="text-xs text-muted-foreground">
                  Máximo
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    id={`${filter.id}-max`}
                    type="number"
                    placeholder="Max"
                    min={filter.min}
                    max={filter.max}
                    step={filter.step || 100}
                    value={values[`${filter.id}_max`] || ''}
                    onChange={(e) =>
                      handleFilterChange(`${filter.id}_max`, e.target.value)
                    }
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'date-range':
        return (
          <div key={filter.id} className="w-full">
            <Label className="text-sm font-medium mb-2 block">
              {filter.label}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`${filter.id}-from`} className="text-xs text-muted-foreground">
                  Desde
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    id={`${filter.id}-from`}
                    type="date"
                    value={values[`${filter.id}_from`] || ''}
                    onChange={(e) =>
                      handleFilterChange(`${filter.id}_from`, e.target.value)
                    }
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`${filter.id}-to`} className="text-xs text-muted-foreground">
                  Hasta
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    id={`${filter.id}-to`}
                    type="date"
                    value={values[`${filter.id}_to`] || ''}
                    onChange={(e) =>
                      handleFilterChange(`${filter.id}_to`, e.target.value)
                    }
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'range':
        return (
          <div key={filter.id} className="w-full">
            <Label className="text-sm font-medium mb-2 block">
              {filter.label}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`${filter.id}-min`} className="text-xs text-muted-foreground">
                  Mínimo
                </Label>
                <Input
                  id={`${filter.id}-min`}
                  type="number"
                  placeholder="Min"
                  min={filter.min}
                  max={filter.max}
                  step={filter.step || 1}
                  value={values[`${filter.id}_min`] || ''}
                  onChange={(e) =>
                    handleFilterChange(`${filter.id}_min`, e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor={`${filter.id}-max`} className="text-xs text-muted-foreground">
                  Máximo
                </Label>
                <Input
                  id={`${filter.id}-max`}
                  type="number"
                  placeholder="Max"
                  min={filter.min}
                  max={filter.max}
                  step={filter.step || 1}
                  value={values[`${filter.id}_max`] || ''}
                  onChange={(e) =>
                    handleFilterChange(`${filter.id}_max`, e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Separar filtro de búsqueda de los demás
  const searchFilter = filters.find((f) => f.type === 'search');
  const otherFilters = filters.filter((f) => f.type !== 'search');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra de búsqueda principal */}
      {searchFilter && (
        <div className="w-full">
          {renderFilterInput(searchFilter)}
        </div>
      )}

      {/* Filtros avanzados en popover */}
      {otherFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtros
                {showActiveCount && activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-[500px] overflow-y-auto" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Filtros Avanzados</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="h-8 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
                <Separator />
                <div className="space-y-4">
                  {otherFilters.map((filter) => renderFilterInput(filter))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botón para limpiar todos los filtros */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-9"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          )}

          {/* Badges de filtros activos */}
          {showActiveCount && (
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(values).map(([key, value]) => {
                if (!value || value === 'all' || value === '') return null;
                const filter = filters.find((f) => f.id === key || key.startsWith(f.id));
                if (!filter) return null;

                let displayValue = value;
                if (filter.type === 'select') {
                  const option = filter.options?.find((o) => o.value === value);
                  displayValue = option?.label || value;
                }

                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {displayValue}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleFilterChange(key, filter.type === 'search' ? '' : 'all')}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default AdvancedFilters;
