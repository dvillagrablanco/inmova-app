import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ClientResponsiveContainer } from '@/components/ui/client-responsive-container';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('ClientResponsiveContainer', () => {
  it('renderiza el contenedor y sus hijos', () => {
    render(
      <ClientResponsiveContainer width={320} height={200}>
        <div>Grafica</div>
      </ClientResponsiveContainer>
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByText('Grafica')).toBeInTheDocument();
  });

  it('acepta dimensiones en porcentaje', () => {
    render(
      <ClientResponsiveContainer width="100%" height="50%">
        <div>Contenido</div>
      </ClientResponsiveContainer>
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });
});
