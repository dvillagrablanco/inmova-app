import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractiveTooltip } from '@/components/ui/interactive-tooltip';

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

describe('InteractiveTooltip', () => {
  it('renderiza título y descripción', () => {
    render(
      <InteractiveTooltip title="Ayuda" description="Detalle">
        <button>Trigger</button>
      </InteractiveTooltip>
    );

    expect(screen.getByText('Ayuda')).toBeInTheDocument();
    expect(screen.getByText('Detalle')).toBeInTheDocument();
  });

  it('ejecuta acción cuando se pulsa el botón', () => {
    const onClick = vi.fn();
    render(
      <InteractiveTooltip description="Detalle" action={{ label: 'Aplicar', onClick }}>
        <button>Trigger</button>
      </InteractiveTooltip>
    );

    fireEvent.click(screen.getByRole('button', { name: /aplicar/i }));
    expect(onClick).toHaveBeenCalled();
  });
});
