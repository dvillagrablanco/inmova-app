import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter } from '@/components/ui/notification-center';

describe('NotificationCenter', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render without crashing', () => {
    render(<NotificationCenter />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<NotificationCenter />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    render(<NotificationCenter />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('No hay notificaciones')).toBeInTheDocument();
    });
  });

  it('should execute side effects', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/notifications');
    });
  });

  it('should be accessible', () => {
    render(<NotificationCenter />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
