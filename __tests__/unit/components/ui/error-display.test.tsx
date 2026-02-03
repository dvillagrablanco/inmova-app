import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from '@/components/ui/error-display';

describe('ErrorDisplay', () => {
  it('renderiza título y mensaje por defecto', () => {
    render(<ErrorDisplay />);

    expect(screen.getByText('Ha ocurrido un error')).toBeInTheDocument();
    expect(screen.getByText(/algo salió mal/i)).toBeInTheDocument();
  });

  it('renderiza título y mensaje personalizados', () => {
    render(<ErrorDisplay title="Error de carga" message="No se pudo cargar la información" />);

    expect(screen.getByText('Error de carga')).toBeInTheDocument();
    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument();
  });

  it('ejecuta retry cuando está disponible', () => {
    const retry = vi.fn();
    render(<ErrorDisplay retry={retry} />);

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(retry).toHaveBeenCalled();
  });
});
