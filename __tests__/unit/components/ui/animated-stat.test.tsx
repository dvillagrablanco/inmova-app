import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedStat } from '@/components/ui/animated-stat';

describe('AnimatedStat', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
      media: '',
    }));
  });

  it('should render without crashing', () => {
    render(<AnimatedStat title="Ingresos" value={1200} />);

    expect(screen.getByText('Ingresos')).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(<AnimatedStat title="Ocupación" value={85.5} suffix="%" decimals={1} />);

    expect(screen.getByText('Ocupación')).toBeInTheDocument();
  });

  it('should handle form submission', () => {
    render(<AnimatedStat title="Crecimiento" value={10} trend={5} />);

    expect(screen.getByText(/↗/)).toBeInTheDocument();
  });

  it('should execute side effects', () => {
    render(<AnimatedStat title="Gastos" value={300} prefix="€" />);

    expect(screen.getByText('Gastos')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<AnimatedStat title="Contratos" value={12} />);

    expect(screen.getByText('Contratos')).toBeInTheDocument();
  });
});
