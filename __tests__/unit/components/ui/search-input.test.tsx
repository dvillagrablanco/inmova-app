import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchInput } from '@/components/ui/search-input';

describe('SearchInput', () => {
  const baseProps = {
    value: '',
    onChange: vi.fn(),
  };

  it('should render without crashing', () => {
    render(<SearchInput {...baseProps} />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('should debounce and call onChange', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    render(<SearchInput {...baseProps} onChange={onChange} debounceMs={200} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'casa' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onChange).toHaveBeenLastCalledWith('casa');
    vi.useRealTimers();
  });

  it('should clear value and call onClear', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();

    render(<SearchInput value="test" onChange={onChange} onClear={onClear} />);

    const clearButton = screen.getByRole('button', { name: /limpiar búsqueda/i });
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalled();
  });

  it('should be accessible', () => {
    render(<SearchInput {...baseProps} aria-label="Buscar contratos" />);

    expect(screen.getByRole('searchbox', { name: /buscar contratos/i })).toBeInTheDocument();
  });
});
