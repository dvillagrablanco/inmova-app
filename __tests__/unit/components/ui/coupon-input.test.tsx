import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CouponInput } from '@/components/ui/coupon-input';

describe('CouponInput', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render without crashing', () => {
    render(
      <CouponInput
        amount={100}
        onCouponApplied={vi.fn()}
        onCouponRemoved={vi.fn()}
      />
    );

    expect(screen.getByText('¿Tienes un cupón?')).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(
      <CouponInput
        amount={100}
        userId="user-1"
        onCouponApplied={vi.fn()}
        onCouponRemoved={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Ingresa el código')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const onCouponApplied = vi.fn();
    const onCouponRemoved = vi.fn();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        valido: true,
        codigo: 'PROMO10',
        tipo: 'PERCENTAGE',
        valor: 10,
        descuento: 10,
        montoFinal: 90,
      }),
    });

    render(
      <CouponInput
        amount={100}
        onCouponApplied={onCouponApplied}
        onCouponRemoved={onCouponRemoved}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Ingresa el código'), {
      target: { value: 'promo10' },
    });
    fireEvent.click(screen.getByText('Aplicar'));

    await waitFor(() => {
      expect(onCouponApplied).toHaveBeenCalled();
    });
  });

  it('should handle form submission', async () => {
    const onCouponApplied = vi.fn();
    const onCouponRemoved = vi.fn();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ valido: false, message: 'Cupón inválido' }),
    });

    render(
      <CouponInput
        amount={100}
        onCouponApplied={onCouponApplied}
        onCouponRemoved={onCouponRemoved}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Ingresa el código'), {
      target: { value: 'invalid' },
    });
    fireEvent.click(screen.getByText('Aplicar'));

    await waitFor(() => {
      expect(onCouponApplied).not.toHaveBeenCalled();
    });
  });

  it('should be accessible', () => {
    render(
      <CouponInput
        amount={100}
        onCouponApplied={vi.fn()}
        onCouponRemoved={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();
  });
});
