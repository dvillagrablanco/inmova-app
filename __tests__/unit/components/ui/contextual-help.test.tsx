import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextualHelp } from '@/components/ui/contextual-help';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('ContextualHelp', () => {
  const baseProps = {
    module: 'CRM',
    title: 'Ayuda de CRM',
    description: 'Guia rapida para comenzar',
    sections: [
      {
        title: 'Seccion 1',
        content: 'Contenido de la seccion',
        tips: ['Tip 1'],
      },
    ],
  };

  it('renderiza titulo, descripcion y secciones', () => {
    render(<ContextualHelp {...baseProps} />);

    expect(screen.getByText('Ayuda de CRM')).toBeInTheDocument();
    expect(screen.getByText('Guia rapida para comenzar')).toBeInTheDocument();
    expect(screen.getByText('Seccion 1')).toBeInTheDocument();
    expect(screen.getByText('Contenido de la seccion')).toBeInTheDocument();
    expect(screen.getByText('Tip 1')).toBeInTheDocument();
  });

  it('ejecuta acciones rapidas', () => {
    const action = vi.fn();

    render(
      <ContextualHelp
        {...baseProps}
        quickActions={[{ label: 'Crear', action }]}
      />
    );

    fireEvent.click(screen.getByText('Crear'));
    expect(action).toHaveBeenCalledTimes(1);
  });
});
