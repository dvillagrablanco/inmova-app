import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const push = vi.fn();
const back = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    back,
    replace: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

import { BackButton } from '@/components/ui/back-button';

describe('BackButton', () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
  });

  it('renderiza el texto por defecto', () => {
    render(<BackButton />);

    expect(screen.getByRole('button', { name: /atrás/i })).toBeInTheDocument();
  });

  it('ejecuta router.back cuando no hay href', () => {
    render(<BackButton />);

    fireEvent.click(screen.getByRole('button', { name: /atrás/i }));
    expect(back).toHaveBeenCalled();
  });

  it('ejecuta router.push cuando hay href', () => {
    render(<BackButton href="/dashboard" label="Volver" />);

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('renderiza solo icono cuando iconOnly=true', () => {
    render(<BackButton iconOnly label="Volver atrás" />);

    expect(screen.getByRole('button', { name: /volver atrás/i })).toBeInTheDocument();
    expect(screen.queryByText(/volver atrás/i)).not.toBeInTheDocument();
  });
});
