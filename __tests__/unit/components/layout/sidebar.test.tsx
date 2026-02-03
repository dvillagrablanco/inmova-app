import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';

describe('Sidebar', () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/company/vertical')) {
      return {
        ok: true,
        json: async () => ({ vertical: null }),
      };
    }
    if (url.includes('/api/modules/active')) {
      return {
        ok: true,
        json: async () => ({ activeModules: [] }),
      };
    }
    return {
      ok: true,
      json: async () => ({}),
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render without crashing', async () => {
    render(<Sidebar />);

    expect(
      screen.getByRole('complementary', { name: /navegación principal/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle mobile menu/i })).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it('should allow searching in sidebar', async () => {
    render(<Sidebar />);

    const searchInput = screen.getByPlaceholderText('Buscar página...');
    fireEvent.change(searchInput, { target: { value: 'contratos' } });

    expect(searchInput).toHaveValue('contratos');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it('should toggle mobile menu visibility', async () => {
    render(<Sidebar />);

    const toggleButton = screen.getByRole('button', { name: /toggle mobile menu/i });
    const sidebar = screen.getByRole('complementary', { name: /navegación principal/i });

    expect(sidebar.className).toContain('-translate-x-full');
    fireEvent.click(toggleButton);

    expect(sidebar.className).not.toContain('-translate-x-full');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it('should be accessible', () => {
    render(<Sidebar />);

    expect(
      screen.getByRole('complementary', { name: /navegación principal/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle mobile menu/i })).toBeInTheDocument();
  });
});
