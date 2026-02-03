import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CouponInput } from '@/components/ui/coupon-input';

describe('CouponInput', () => {
  const baseProps = {
    amount: 100,
    onCouponApplied: vi.fn(),
    onCouponRemoved: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          valido: true,
          codigo: 'TEST',
          tipo: 'PERCENTAGE',
          valor: 10,
          descuento: 10,
          montoFinal: 90,
        }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render without crashing', () => {
    render(<CouponInput {...baseProps} />);

    expect(screen.getByText('¿Tienes un cupón?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aplicar/i })).toBeDisabled();
  });

  it('should apply coupon when valid', async () => {
    const onCouponApplied = vi.fn();
    render(<CouponInput {...baseProps} onCouponApplied={onCouponApplied} />);

    const input = screen.getByPlaceholderText('Ingresa el código');
    fireEvent.change(input, { target: { value: 'TEST' } });

    const applyButton = screen.getByRole('button', { name: /aplicar/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(onCouponApplied).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: 'TEST',
          descuento: 10,
          montoFinal: 90,
        })
      );
    });
  });
});
