import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from '@/components/ui/progress-indicator';

describe('ProgressIndicator', () => {
  const steps = [
    { id: 'step-1', label: 'Paso 1', status: 'completed' as const },
    { id: 'step-2', label: 'Paso 2', status: 'in_progress' as const },
    { id: 'step-3', label: 'Paso 3', status: 'pending' as const },
  ];

  it('renderiza los pasos y el resumen', () => {
    render(<ProgressIndicator steps={steps} />);

    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Paso 2')).toBeInTheDocument();
    expect(screen.getByText('Paso 3')).toBeInTheDocument();
    expect(screen.getByText(/1 de 3 completados/i)).toBeInTheDocument();
  });
});
