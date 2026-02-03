import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextualHelp } from '@/components/ui/contextual-help';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

describe('ContextualHelp', () => {
  const sections = [
    { title: 'Introducción', content: 'Contenido inicial' },
    { title: 'Siguiente paso', content: 'Contenido adicional', tips: ['Tip 1'] },
  ];

  it('renderiza título, descripción y secciones', () => {
    render(
      <ContextualHelp
        module="Propiedades"
        title="Ayuda de Propiedades"
        description="Guía rápida"
        sections={sections}
      />
    );

    expect(screen.getByText('Ayuda de Propiedades')).toBeInTheDocument();
    expect(screen.getByText('Guía rápida')).toBeInTheDocument();
    expect(screen.getByText('Introducción')).toBeInTheDocument();
    expect(screen.getByText('Contenido inicial')).toBeInTheDocument();
    expect(screen.getByText('Tip 1')).toBeInTheDocument();
  });

  it('ejecuta una acción rápida', () => {
    const action = vi.fn();
    render(
      <ContextualHelp
        module="Contratos"
        title="Ayuda de Contratos"
        description="Guía"
        sections={sections}
        quickActions={[{ label: 'Crear', action }]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /crear/i }));
    expect(action).toHaveBeenCalled();
  });
});
