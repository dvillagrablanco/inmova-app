import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileFilterPanel } from '@/components/ui/mobile-filter-panel';

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
  SheetClose: ({ children }: any) => <div>{children}</div>,
}));

describe('MobileFilterPanel', () => {
  const filters = [
    {
      id: 'status',
      label: 'Estado',
      value: '',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
      ],
    },
  ];

  it('renderiza título y filtros', () => {
    render(<MobileFilterPanel filters={filters} activeFilters={[]} onFilterChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /^filtros$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /filtros/i })).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('ejecuta onFilterChange al seleccionar opción', () => {
    const onFilterChange = vi.fn();
    render(
      <MobileFilterPanel filters={filters} activeFilters={[]} onFilterChange={onFilterChange} />
    );

    fireEvent.click(screen.getByText('Estado'));
    fireEvent.click(screen.getAllByRole('button', { name: /activo/i })[0]);
    expect(onFilterChange).toHaveBeenCalledWith('status', 'active');
  });
});
