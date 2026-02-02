import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModuleQuickGuide } from '@/components/ui/module-quick-guide';

describe('ModuleQuickGuide', () => {
  const baseProps = {
    moduleId: 'mod-1',
    moduleName: 'Propiedades',
    steps: [
      {
        title: 'Paso 1',
        description: 'Completa la configuracion inicial',
      },
      {
        title: 'Paso 2',
        description: 'Crea tu primera propiedad',
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza titulo y pasos', () => {
    render(<ModuleQuickGuide {...baseProps} />);

    expect(screen.getByText('Guía rápida: Propiedades')).toBeInTheDocument();
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Paso 2')).toBeInTheDocument();
    expect(screen.getByText('0 de 2 pasos completados (0%)')).toBeInTheDocument();
  });

  it('permite marcar un paso como completado', () => {
    render(<ModuleQuickGuide {...baseProps} />);

    const toggle = screen.getByLabelText('Marcar paso 1 como completado');
    fireEvent.click(toggle);

    expect(screen.getByText('1 de 2 pasos completados (50%)')).toBeInTheDocument();
  });

  it('permite cerrar y reabrir la guia', () => {
    render(<ModuleQuickGuide {...baseProps} />);

    fireEvent.click(screen.getByLabelText('Cerrar guía'));
    expect(screen.getByText('Mostrar guía rápida')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Mostrar guía rápida nuevamente'));
    expect(screen.getByText('Guía rápida: Propiedades')).toBeInTheDocument();
  });
});
