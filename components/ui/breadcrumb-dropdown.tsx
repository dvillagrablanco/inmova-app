'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbDropdownItem {
  label: string;
  href: string;
}

interface BreadcrumbDropdownProps {
  label: string;
  items: BreadcrumbDropdownItem[];
  className?: string;
}

/**
 * Breadcrumb segment con dropdown para saltar directo a entidades.
 * Ej: click en "Edificios" → dropdown con lista de edificios.
 */
export function BreadcrumbDropdown({ label, items, className = '' }: BreadcrumbDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && items.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] max-h-[300px] overflow-y-auto bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg py-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors truncate"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {items.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin elementos</p>
          )}
        </div>
      )}
    </div>
  );
}
