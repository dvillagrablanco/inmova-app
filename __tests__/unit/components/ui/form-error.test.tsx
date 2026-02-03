import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormError } from '@/components/ui/form-error';

describe('FormError', () => {
  it('no renderiza nada cuando no hay error', () => {
    render(<FormError />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renderiza un error único', () => {
    render(<FormError error="Campo requerido" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('renderiza múltiples errores', () => {
    render(<FormError error={['Error 1', 'Error 2']} />);

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  it('aplica id y className cuando se proporcionan', () => {
    render(<FormError error="Fallo" id="form-error" className="custom-class" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('id', 'form-error');
    expect(alert).toHaveClass('custom-class');
  });
});
