import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnhancedGlobalSearch } from '@/components/ui/enhanced-global-search';

vi.mock('@/components/ui/command', () => ({
  CommandDialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  CommandInput: ({ placeholder, value, onValueChange }: any) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandList: ({ children }: any) => <div>{children}</div>,
  CommandGroup: ({ children, heading }: any) => (
    <div>
      {heading && <h3>{heading}</h3>}
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect }: any) => (
    <button type="button" onClick={() => onSelect?.('')}>
      {children}
    </button>
  ),
  CommandSeparator: () => <hr />,
  CommandEmpty: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('EnhancedGlobalSearch', () => {
  it('renderiza el botón de búsqueda', () => {
    render(<EnhancedGlobalSearch />);

    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('renderiza el input cuando está abierto', () => {
    render(<EnhancedGlobalSearch open onOpenChange={vi.fn()} />);

    expect(screen.getByPlaceholderText(/buscar en inmova/i)).toBeInTheDocument();
    expect(screen.getByText(/atajos de búsqueda/i)).toBeInTheDocument();
  });
});
