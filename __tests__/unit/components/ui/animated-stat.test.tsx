import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedStat } from '@/components/ui/animated-stat';

vi.mock('framer-motion', () => {
  const React = require('react');

  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    useMotionValue: (initial = 0) => {
      let value = initial;
      return {
        get: () => value,
        set: (next: number) => {
          value = next;
        },
      };
    },
    useTransform: (motionValue: any, transformer: (value: number) => string) => {
      const current = motionValue?.get ? motionValue.get() : 0;
      return transformer(current);
    },
    animate: (motionValue: any, to: number) => {
      if (motionValue?.set) {
        motionValue.set(to);
      }
      return { stop: vi.fn() };
    },
  };
});

describe('AnimatedStat', () => {
  it('renderiza titulo, prefijo/sufijo y tendencia', () => {
    render(<AnimatedStat title="Ingresos" value={1200} prefix="€" suffix="k" trend={12} />);

    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText(/€/)).toBeInTheDocument();
    expect(screen.getByText(/k/)).toBeInTheDocument();
    expect(screen.getByText(/12%/)).toBeInTheDocument();
  });

  it('oculta la tendencia cuando no se proporciona', () => {
    render(<AnimatedStat title="Ocupación" value={0} />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
