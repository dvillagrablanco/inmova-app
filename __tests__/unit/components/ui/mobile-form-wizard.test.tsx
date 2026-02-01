import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileFormWizard } from '@/components/ui/mobile-form-wizard';

describe('MobileFormWizard', () => {
  const steps = [
    {
      id: 'step-1',
      title: 'Paso 1',
      description: 'Descripción 1',
      fields: <div>Contenido 1</div>,
    },
    {
      id: 'step-2',
      title: 'Paso 2',
      fields: <div>Contenido 2</div>,
    },
  ];

  const setViewport = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    setViewport(1024);
  });

  it('should render without crashing', () => {
    render(<MobileFormWizard steps={steps} />);

    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Paso 2')).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(
      <MobileFormWizard
        steps={steps}
        submitButton={<button type="button">Enviar</button>}
      />
    );

    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    setViewport(375);
    render(<MobileFormWizard steps={steps} />);

    await waitFor(() => {
      expect(screen.getByText(/Paso 1 de 2/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Paso 2 de 2/i)).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    const onComplete = vi.fn();

    setViewport(375);
    render(
      <MobileFormWizard
        steps={[
          {
            id: 'only',
            title: 'Paso único',
            fields: <div>Contenido único</div>,
          },
        ]}
        onComplete={onComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Paso 1 de 1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Finalizar/i }));
    expect(onComplete).toHaveBeenCalled();
  });

  it('should execute side effects', async () => {
    const onStepChange = vi.fn();
    setViewport(375);
    render(<MobileFormWizard steps={steps} onStepChange={onStepChange} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Ir al paso 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Ir al paso 2'));
    expect(onStepChange).toHaveBeenCalledWith(1);
  });

  it('should be accessible', () => {
    setViewport(375);
    render(<MobileFormWizard steps={steps} />);

    expect(screen.getByLabelText('Ir al paso 1')).toBeInTheDocument();
  });
});
