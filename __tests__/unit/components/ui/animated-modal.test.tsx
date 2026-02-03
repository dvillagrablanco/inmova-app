import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimatedModal } from '@/components/ui/animated-modal';

vi.mock('framer-motion', () => {
  const React = require('react');

  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    },
  };
});

describe('AnimatedModal', () => {
  it('renderiza titulo y contenido cuando está abierto', () => {
    render(
      <AnimatedModal isOpen onClose={vi.fn()} title="Detalle">
        <div>Contenido del modal</div>
      </AnimatedModal>
    );

    expect(screen.getByText('Detalle')).toBeInTheDocument();
    expect(screen.getByText('Contenido del modal')).toBeInTheDocument();
  });

  it('no renderiza contenido cuando está cerrado', () => {
    render(
      <AnimatedModal isOpen={false} onClose={vi.fn()} title="Detalle">
        <div>Contenido del modal</div>
      </AnimatedModal>
    );

    expect(screen.queryByText('Contenido del modal')).not.toBeInTheDocument();
  });

  it('ejecuta onClose al pulsar cerrar', () => {
    const onClose = vi.fn();
    render(
      <AnimatedModal isOpen onClose={onClose} title="Detalle">
        <div>Contenido del modal</div>
      </AnimatedModal>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
