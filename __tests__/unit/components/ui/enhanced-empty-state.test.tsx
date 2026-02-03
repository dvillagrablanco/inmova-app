import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnhancedEmptyState } from '@/components/ui/enhanced-empty-state';

describe('EnhancedEmptyState', () => {
  it('renderiza preset por defecto', () => {
    render(<EnhancedEmptyState preset="noData" />);

    expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
  });

  it('permite sobrescribir título y descripción', () => {
    render(
      <EnhancedEmptyState
        preset="noData"
        customTitle="Sin registros"
        customDescription="Agrega nuevos elementos"
      />
    );

    expect(screen.getByText('Sin registros')).toBeInTheDocument();
    expect(screen.getByText('Agrega nuevos elementos')).toBeInTheDocument();
  });
});
