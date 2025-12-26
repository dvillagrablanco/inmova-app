/**
 * Reusable search input component with debounce and accessibility features
 */

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  'aria-label'?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
  className,
  onClear,
  autoFocus = false,
  'aria-label': ariaLabel = 'Buscar',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  // Update parent when debounced value changes
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onClear?.();
  };

  return (
    <div className={cn('relative', className)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        role="searchbox"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
