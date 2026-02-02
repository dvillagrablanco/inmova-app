import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchInput } from '@/components/ui/search-input';

describe('SearchInput', () => {
  it('should render without crashing', () => {
    const onChange = vi.fn();

    render(<SearchInput value="" onChange={onChange} />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('should render with props', () => {
    const onChange = vi.fn();
    render(
      <SearchInput
        value=""
        onChange={onChange}
        placeholder="Buscar contratos"
        aria-label="Buscar contratos"
      />
    );

    expect(screen.getByPlaceholderText('Buscar contratos')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} debounceMs={0} />);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'test' },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('test');
    });
  });

  it('should handle form submission', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();

    render(<SearchInput value="hola" onChange={onChange} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('');
      expect(onClear).toHaveBeenCalled();
    });
  });

  it('should execute side effects', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchInput value="uno" onChange={onChange} />);

    rerender(<SearchInput value="dos" onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toHaveValue('dos');
    });
  });

  it('should be accessible', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} aria-label="Buscar elementos" />);

    expect(screen.getByRole('searchbox', { name: 'Buscar elementos' })).toBeInTheDocument();
  });
});
