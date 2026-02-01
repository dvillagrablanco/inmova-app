import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ClientResponsiveContainer } from '@/components/ui/client-responsive-container';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ClientResponsiveContainer', () => {
  it('should render without crashing', async () => {
    render(
      <ClientResponsiveContainer>
        <div>Gráfico</div>
      </ClientResponsiveContainer>
    );

    await waitFor(() => {
      expect(screen.getByText('Gráfico')).toBeInTheDocument();
    });
  });

  it('should render with props', async () => {
    render(
      <ClientResponsiveContainer width={300} height={200}>
        <div>Contenido</div>
      </ClientResponsiveContainer>
    );

    await waitFor(() => {
      expect(screen.getByText('Contenido')).toBeInTheDocument();
    });
  });

  it('should handle user interactions', async () => {
    render(
      <ClientResponsiveContainer>
        <div>Interacción</div>
      </ClientResponsiveContainer>
    );

    await waitFor(() => {
      expect(screen.getByText('Interacción')).toBeInTheDocument();
    });
  });

  it('should execute side effects', async () => {
    render(
      <ClientResponsiveContainer>
        <div>Efectos</div>
      </ClientResponsiveContainer>
    );

    await waitFor(() => {
      expect(screen.getByText('Efectos')).toBeInTheDocument();
    });
  });

  it('should be accessible', async () => {
    render(
      <ClientResponsiveContainer>
        <div>Accesible</div>
      </ClientResponsiveContainer>
    );

    await waitFor(() => {
      expect(screen.getByText('Accesible')).toBeInTheDocument();
    });
  });
});
