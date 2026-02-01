import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedFilters } from '@/components/ui/advanced-filters';

describe('AdvancedFilters', () => {
  const filters = [
    {
      id: 'search',
      label: 'Nombre',
      type: 'search' as const,
      placeholder: 'Buscar nombre',
    },
    {
      id: 'estado',
      label: 'Estado',
      type: 'select' as const,
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
      ],
    },
  ];

  const baseValues = { search: '', estado: 'all' };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without crashing', () => {
    const onChange = vi.fn();
    render(<AdvancedFilters filters={filters} values={baseValues} onChange={onChange} />);

    expect(screen.getByPlaceholderText('Buscar nombre')).toBeInTheDocument();
  });

  it('should render with props', () => {
    const onChange = vi.fn();
    render(<AdvancedFilters filters={filters} values={baseValues} onChange={onChange} />);

    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const onChange = vi.fn();
    render(<AdvancedFilters filters={filters} values={baseValues} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('Buscar nombre'), {
      target: { value: 'Juan' },
    });

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ ...baseValues, search: 'Juan' });
    });
  });

  it('should handle form submission', async () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    const values = { search: 'Juan', estado: 'activo' };

    render(
      <AdvancedFilters
        filters={filters}
        values={values}
        onChange={onChange}
        onReset={onReset}
      />
    );

    fireEvent.click(screen.getByText('Limpiar filtros'));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ search: '', estado: 'all' });
      expect(onReset).toHaveBeenCalled();
    });
  });

  it('should execute side effects', async () => {
    const onChange = vi.fn();
    const values = { search: '', estado: 'activo' };
    render(<AdvancedFilters filters={filters} values={values} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });
  });

  it('should be accessible', () => {
    const onChange = vi.fn();
    render(<AdvancedFilters filters={filters} values={baseValues} onChange={onChange} />);

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });
});
