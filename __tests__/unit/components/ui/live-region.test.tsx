import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion } from '@/components/ui/live-region';

describe('LiveRegion', () => {
  it('renderiza el mensaje con rol status', () => {
    render(<LiveRegion message="Actualizado" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Actualizado')).toBeInTheDocument();
  });

  it('permite rol alert y aria-live assertive', () => {
    render(<LiveRegion message="Error" role="alert" aria-live="assertive" />);

    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });
});
