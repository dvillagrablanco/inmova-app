import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuccessToast } from '@/components/ui/success-toast';

describe('SuccessToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza el mensaje con rol status', () => {
    render(<SuccessToast message="Guardado correctamente" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Guardado correctamente')).toBeInTheDocument();
  });

  it('ejecuta onClose despues de la duracion', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<SuccessToast message="Listo" duration={1000} onClose={onClose} />);

    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
