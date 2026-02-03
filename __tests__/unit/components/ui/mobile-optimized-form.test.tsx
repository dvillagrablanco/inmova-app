import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileOptimizedForm } from '@/components/ui/mobile-optimized-form';

vi.mock('@/lib/hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}));

describe('MobileOptimizedForm', () => {
  it('renderiza titulo, descripción y contenido', () => {
    render(
      <MobileOptimizedForm
        title="Nuevo inmueble"
        description="Completa los datos"
        onSubmit={vi.fn()}
      >
        <div>Campos</div>
      </MobileOptimizedForm>
    );

    expect(screen.getByText('Nuevo inmueble')).toBeInTheDocument();
    expect(screen.getByText('Completa los datos')).toBeInTheDocument();
    expect(screen.getByText('Campos')).toBeInTheDocument();
  });

  it('ejecuta onSubmit al enviar', () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    const { container } = render(
      <MobileOptimizedForm onSubmit={onSubmit}>
        <div>Campos</div>
      </MobileOptimizedForm>
    );

    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('ejecuta onCancel cuando existe', () => {
    const onCancel = vi.fn();
    render(
      <MobileOptimizedForm onSubmit={vi.fn()} onCancel={onCancel}>
        <div>Campos</div>
      </MobileOptimizedForm>
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
