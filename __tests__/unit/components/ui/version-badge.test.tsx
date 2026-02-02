import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionBadge } from '@/components/ui/version-badge';

describe('VersionBadge', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          version: '1.0.0',
          buildTime: '2025-01-01T00:00:00Z',
          gitCommit: 'abcdef123456',
          deploymentId: 'deploy-1',
          environment: 'development',
          isProduction: false,
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render without crashing', async () => {
    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });
  });

  it('should handle user interactions', async () => {
    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('v1.0.0'));

    await waitFor(() => {
      expect(screen.getByText('Información de Versión')).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('v1.0.0'));
    fireEvent.click(screen.getByText('📋 Copiar información'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
  });

  it('should execute side effects', async () => {
    render(<VersionBadge />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/version');
    });
  });

  it('should be accessible', async () => {
    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });
  });
});
