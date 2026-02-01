import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormError } from '@/components/ui/form-error';

describe('FormError', () => {
  it('no renderiza nada si no hay error', () => {
    const { container } = render(<FormError />);

    expect(container.firstChild).toBeNull();
  });

  it('renderiza un error simple con rol alert', () => {
    render(<FormError error="Campo requerido" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('renderiza multiples errores', () => {
    render(<FormError error={['Error 1', 'Error 2']} />);

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });
});
