import type { InputHTMLAttributes, ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickAccessMenu } from '@/components/ui/quick-access-menu';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/components/ui/command', () => ({
  CommandDialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: ReactNode;
  }) => (open ? <div>{children}</div> : null),
  CommandInput: (props: InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
  CommandList: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  CommandEmpty: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  CommandGroup: ({
    children,
    heading,
  }: {
    children: ReactNode;
    heading?: string;
  }) => (
    <div>
      {heading ? <div>{heading}</div> : null}
      {children}
    </div>
  ),
  CommandItem: ({
    children,
    onSelect,
  }: {
    children: ReactNode;
    onSelect?: () => void;
  }) => (
    <button type="button" onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
  CommandSeparator: () => <hr />,
}));

describe('QuickAccessMenu', () => {
  it('should render without crashing', () => {
    render(<QuickAccessMenu />);

    expect(screen.getByText(/Búsqueda rápida/i)).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<QuickAccessMenu />);

    fireEvent.click(screen.getByRole('button', { name: /Búsqueda rápida/i }));

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

    fireEvent.click(screen.getByRole('button', { name: /Búsqueda rápida/i }));

    await waitFor(() => {
      expect(screen.getByText('Crear nuevo edificio')).toBeInTheDocument();
    });
  });

  it('should be accessible', () => {
    render(<QuickAccessMenu />);

    expect(
      screen.getByRole('button', { name: /Búsqueda rápida/i })
    ).toBeInTheDocument();
  });
});
