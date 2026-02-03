import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AdvancedFilters,
  type FilterOption,
  type FilterValues,
} from '@/components/ui/advanced-filters';

describe('AdvancedFilters', () => {
  const filters: FilterOption[] = [
    {
      id: 'search',
      label: 'Buscar',
      type: 'search',
      placeholder: 'Buscar...',
    },
    {
      id: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
      ],
    },
  ];

  const baseValues: FilterValues = {
    search: '',
    status: 'all',
  };

  it('should render without crashing', () => {
    render(<AdvancedFilters filters={filters} values={baseValues} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(<AdvancedFilters filters={filters} values={baseValues} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<AdvancedFilters filters={filters} values={baseValues} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'casa' } });
    vi.runAllTimers();

    expect(onChange).toHaveBeenCalledWith({ ...baseValues, search: 'casa' });

    vi.useRealTimers();
  });

  it('should handle form submission', async () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    const valuesWithFilters = { search: 'casa', status: 'active' };

    render(
      <AdvancedFilters
        filters={filters}
        values={valuesWithFilters}
        onChange={onChange}
        onReset={onReset}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ search: '', status: 'all' });
      expect(onReset).toHaveBeenCalled();
    });
  });

  it('should execute side effects', async () => {
    const onChange = vi.fn();
    const valuesWithFilters = { search: 'casa', status: 'active' };
    render(<AdvancedFilters filters={filters} values={valuesWithFilters} onChange={onChange} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<AdvancedFilters filters={filters} values={baseValues} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
  });
});
