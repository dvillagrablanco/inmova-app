import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SuccessToast } from '@/components/ui/success-toast';

describe('SuccessToast', () => {
  it('renderiza el mensaje', () => {
    render(<SuccessToast message="Guardado correctamente" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Guardado correctamente')).toBeInTheDocument();
  });

  it('ejecuta onClose cuando expira', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<SuccessToast message="Ok" duration={1000} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onClose).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
