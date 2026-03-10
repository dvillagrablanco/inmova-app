'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HelpSearchProps {
  defaultValue?: string;
  placeholder?: string;
  size?: 'sm' | 'lg';
}

export function HelpSearch({
  defaultValue = '',
  placeholder = 'Buscar en la ayuda...',
  size,
}: HelpSearchProps) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input');
    const query = input?.value?.trim();
    if (query) {
      router.push(`/ayuda/buscar?q=${encodeURIComponent(query)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      const query = input?.value?.trim();
      if (query) {
        router.push(`/ayuda/buscar?q=${encodeURIComponent(query)}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Search
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
            size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
          )}
        />
        <Input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className={cn(
            'pl-10',
            size === 'lg' && 'h-14 text-lg',
            size === 'sm' && 'h-8 text-sm'
          )}
        />
      </div>
    </form>
  );
}
