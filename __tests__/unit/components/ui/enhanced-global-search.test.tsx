import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedGlobalSearch } from '@/components/ui/enhanced-global-search';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('EnhancedGlobalSearch', () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
  });

  it('should render without crashing', () => {
    render(<EnhancedGlobalSearch />);

    expect(screen.getByText('Buscar...')).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(<EnhancedGlobalSearch open />);

    expect(
      screen.getByPlaceholderText('Buscar en INMOVA... (Usa @, #, $, / para filtrar)')
    ).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<EnhancedGlobalSearch />);

    fireEvent.click(screen.getByRole('button', { name: /Buscar\.\.\./i }));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Buscar en INMOVA... (Usa @, #, $, / para filtrar)')
      ).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    const onOpenChange = vi.fn();
    render(<EnhancedGlobalSearch open={false} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Buscar\.\.\./i }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it('should execute side effects', async () => {
    localStorage.setItem('recentSearches', JSON.stringify(['alquiler']));
    render(<EnhancedGlobalSearch open />);

    await waitFor(() => {
      expect(screen.getByText('Búsquedas Recientes')).toBeInTheDocument();
    });
  });

  it('should be accessible', () => {
    render(<EnhancedGlobalSearch />);

    expect(screen.getByRole('button', { name: /Buscar\.\.\./i })).toBeInTheDocument();
  });
});
