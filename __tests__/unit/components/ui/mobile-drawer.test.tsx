import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MobileDrawer } from '@/components/ui/mobile-drawer';

vi.mock('@headlessui/react', () => {
  const Dialog = function DialogMock({ children }: any) {
    return <div>{children}</div>;
  };
  Dialog.displayName = 'Dialog';
  Dialog.Panel = function DialogPanelMock({ children }: any) {
    return <div>{children}</div>;
  };
  Dialog.Panel.displayName = 'Dialog.Panel';
  Dialog.Title = function DialogTitleMock({ children }: any) {
    return <h2>{children}</h2>;
  };
  Dialog.Title.displayName = 'Dialog.Title';

  const Transition = function TransitionMock({ children }: any) {
    return <div>{children}</div>;
  };
  Transition.displayName = 'Transition';
  Transition.Child = function TransitionChildMock({ children }: any) {
    return <div>{children}</div>;
  };
  Transition.Child.displayName = 'Transition.Child';

  return { Dialog, Transition };
});

describe('MobileDrawer', () => {
  const renderDrawer = (overrides: Partial<ComponentProps<typeof MobileDrawer>> = {}) => {
    const onClose = vi.fn();
    render(
      <MobileDrawer isOpen onClose={onClose} title="Detalles" {...overrides}>
        <div>Contenido del drawer</div>
      </MobileDrawer>
    );

    return { onClose };
  };

  it('renderiza titulo y contenido cuando está abierto', () => {
    renderDrawer();

    expect(screen.getByText('Detalles')).toBeInTheDocument();
    expect(screen.getByText('Contenido del drawer')).toBeInTheDocument();
  });

  it('ejecuta onClose al pulsar cerrar', () => {
    const { onClose } = renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('no muestra contenido cuando está cerrado', () => {
    renderDrawer({ isOpen: false });

    expect(screen.queryByText('Contenido del drawer')).not.toBeInTheDocument();
  });
});
