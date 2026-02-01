import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickAccessMenu } from '@/components/ui/quick-access-menu';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('QuickAccessMenu', () => {
  it('should render without crashing', () => {
    render(<QuickAccessMenu />);

    expect(screen.getByText(/Búsqueda rápida/i)).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<QuickAccessMenu />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Buscar acciones, páginas, módulos...')
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dashboard'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle form submission', async () => {
    render(<QuickAccessMenu />);

    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Buscar acciones, páginas, módulos...')
      ).toBeInTheDocument();
    });
  });

  it('should execute side effects', async () => {
    render(<QuickAccessMenu />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Crear nuevo edificio')).toBeInTheDocument();
    });
  });

  it('should be accessible', () => {
    render(<QuickAccessMenu />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
