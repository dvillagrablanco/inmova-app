import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackButton } from '@/components/ui/back-button';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe('BackButton', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it('renderiza el texto por defecto', () => {
    render(<BackButton />);

    expect(screen.getByText('Atrás')).toBeInTheDocument();
  });

  it('navega a href cuando se proporciona', () => {
    render(<BackButton href="/dashboard" label="Volver" />);

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('llama router.back cuando no hay href', () => {
    render(<BackButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('soporta iconOnly con aria-label', () => {
    render(<BackButton iconOnly label="Regresar" />);

    expect(screen.getByLabelText('Regresar')).toBeInTheDocument();
  });
});
