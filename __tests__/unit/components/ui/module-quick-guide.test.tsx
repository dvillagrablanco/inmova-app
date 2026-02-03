import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModuleQuickGuide } from '@/components/ui/module-quick-guide';

const steps = [
  { title: 'Paso 1', description: 'Descripción 1' },
  { title: 'Paso 2', description: 'Descripción 2' },
];

describe('ModuleQuickGuide', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza el nombre del módulo y los pasos', () => {
    render(<ModuleQuickGuide moduleId="propiedades" moduleName="Propiedades" steps={steps} />);

    expect(screen.getByText(/guía rápida: propiedades/i)).toBeInTheDocument();
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Paso 2')).toBeInTheDocument();
  });

  it('permite marcar un paso como completado', () => {
    render(<ModuleQuickGuide moduleId="propiedades" moduleName="Propiedades" steps={steps} />);

    const toggle = screen.getByRole('button', { name: /marcar paso 1 como completado/i });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});
