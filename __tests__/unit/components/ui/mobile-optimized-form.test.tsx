import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileOptimizedForm } from '@/components/ui/mobile-optimized-form';

const useIsMobileMock = vi.fn();

vi.mock('@/lib/hooks/useMediaQuery', () => ({
  useIsMobile: () => useIsMobileMock(),
}));

describe('MobileOptimizedForm', () => {
  it('should render without crashing', () => {
    useIsMobileMock.mockReturnValue(false);
    const onSubmit = vi.fn();

    render(
      <MobileOptimizedForm onSubmit={onSubmit} title="Formulario">
        <div>Contenido</div>
      </MobileOptimizedForm>
    );

    expect(screen.getByText('Formulario')).toBeInTheDocument();
  });

  it('should render with props', () => {
    useIsMobileMock.mockReturnValue(false);
    const onSubmit = vi.fn();

    render(
      <MobileOptimizedForm
        onSubmit={onSubmit}
        title="Formulario"
        description="Descripción"
        submitLabel="Enviar"
      >
        <div>Contenido</div>
      </MobileOptimizedForm>
    );

    expect(screen.getByText('Descripción')).toBeInTheDocument();
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    useIsMobileMock.mockReturnValue(false);
    const onSubmit = vi.fn((e) => e.preventDefault());

    render(
      <MobileOptimizedForm onSubmit={onSubmit}>
        <div>Contenido</div>
      </MobileOptimizedForm>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('should be accessible', () => {
    useIsMobileMock.mockReturnValue(false);
    const onSubmit = vi.fn();

    render(
      <MobileOptimizedForm onSubmit={onSubmit}>
        <div>Contenido</div>
      </MobileOptimizedForm>
    );

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });
});
