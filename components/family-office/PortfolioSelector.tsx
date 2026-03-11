'use client';

import { cn } from '@/lib/utils';

interface Portfolio {
  code: string;
  label: string;
  shortLabel: string;
}

const PORTFOLIOS: Portfolio[] = [
  { code: 'all', label: 'Master (Consolidado)', shortLabel: 'Master' },
  { code: '1149.01', label: 'AF Grupo', shortLabel: 'AF' },
  { code: '1149.02', label: 'PE Grupo', shortLabel: 'PE' },
  { code: '1149.03', label: 'AR Grupo', shortLabel: 'AR' },
  { code: '1142.09', label: 'Amper', shortLabel: 'Amper' },
];

interface Props {
  selected: string;
  onChange: (code: string) => void;
  className?: string;
}

export function PortfolioSelector({ selected, onChange, className }: Props) {
  return (
    <div className={cn('flex gap-1 p-0.5 bg-gray-100 rounded-lg', className)}>
      {PORTFOLIOS.map((p) => (
        <button
          key={p.code}
          onClick={() => onChange(p.code)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            selected === p.code
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <span className="hidden md:inline">{p.label}</span>
          <span className="md:hidden">{p.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
