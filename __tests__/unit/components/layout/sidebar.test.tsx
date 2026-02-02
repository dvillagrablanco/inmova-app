import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';

const { mockPush, mockSignOut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: mockPush,
    prefetch: vi.fn(),
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signOut: mockSignOut,
}));

vi.mock('@/lib/hooks/usePermissions', () => ({
  usePermissions: () => ({ role: 'administrador' }),
}));

vi.mock('@/lib/hooks/useBranding', () => ({
  useBranding: () => ({ appName: 'INMOVA', logo: '/inmova-logo-icon.jpg' }),
}));

vi.mock('@/lib/hooks/admin/useSelectedCompany', () => ({
  useSelectedCompany: () => ({ selectedCompany: null, selectCompany: vi.fn() }),
}));

describe('Sidebar', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockPush.mockClear();
    mockSignOut.mockClear();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/company/vertical')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ vertical: 'residencial' }),
        });
      }
      if (url.includes('/api/modules/active')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ activeModules: [] }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render without crashing', () => {
    render(<Sidebar />);

    expect(
      screen.getByRole('complementary', { name: 'Navegación principal' })
    ).toBeInTheDocument();
  });

  it('should render with props', () => {
    const onNavigate = vi.fn();
    render(<Sidebar onNavigate={onNavigate} />);

    expect(screen.getByPlaceholderText('Buscar página...')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<Sidebar />);

    const searchInput = screen.getByPlaceholderText('Buscar página...');
    fireEvent.change(searchInput, { target: { value: 'contratos' } });

    await waitFor(() => {
      expect(searchInput).toHaveValue('contratos');
    });
  });

  it('should handle form submission', async () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should execute side effects', async () => {
    render(<Sidebar />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/company/vertical');
      expect(mockFetch).toHaveBeenCalledWith('/api/modules/active');
    });
  });

  it('should be accessible', () => {
    render(<Sidebar />);

    expect(screen.getByRole('button', { name: 'Toggle mobile menu' })).toBeInTheDocument();
  });
});
