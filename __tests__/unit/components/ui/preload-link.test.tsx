import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreloadLink } from '@/components/ui/preload-link';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/hooks/useRoutePreloader', () => ({
  useHoverPreload: () => ({}),
}));

describe('PreloadLink', () => {
  it('renderiza el enlace con href', () => {
    render(<PreloadLink href="/dashboard">Ir al Dashboard</PreloadLink>);

    const link = screen.getByRole('link', { name: /ir al dashboard/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renderiza un span cuando está deshabilitado', () => {
    render(
      <PreloadLink href="/dashboard" disabled>
        Ir al Dashboard
      </PreloadLink>
    );

    expect(screen.getByText('Ir al Dashboard').tagName).toBe('SPAN');
  });
});
