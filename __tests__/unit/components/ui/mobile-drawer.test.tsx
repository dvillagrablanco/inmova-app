import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileDrawer } from '@/components/ui/mobile-drawer';

vi.mock('@headlessui/react', () => {
  const Dialog = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  Dialog.Panel = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  Dialog.Title = ({ children }: { children: ReactNode }) => <h2>{children}</h2>;

  const Transition = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  Transition.Child = ({ children }: { children: ReactNode }) => <div>{children}</div>;

  return { Dialog, Transition };
});

describe('MobileDrawer', () => {
  it('renderiza titulo y contenido cuando esta abierto', () => {
    render(
      <MobileDrawer isOpen onClose={vi.fn()} title="Filtros">
        <div>Contenido</div>
      </MobileDrawer>
    );

    expect(screen.getByText('Filtros')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('ejecuta onClose al hacer click en cerrar', () => {
    const onClose = vi.fn();

    render(
      <MobileDrawer isOpen onClose={onClose} title="Filtros">
        <div>Contenido</div>
      </MobileDrawer>
    );

    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
