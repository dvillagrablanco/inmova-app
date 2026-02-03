import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileFormWizard, type FormStep } from '@/components/ui/mobile-form-wizard';

describe('MobileFormWizard', () => {
  const steps: FormStep[] = [
    {
      id: 'step-1',
      title: 'Paso 1',
      description: 'Descripción 1',
      fields: <div>Contenido 1</div>,
    },
    {
      id: 'step-2',
      title: 'Paso 2',
      description: 'Descripción 2',
      fields: <div>Contenido 2</div>,
    },
  ];

  const renderMobileWizard = (props: Partial<ComponentProps<typeof MobileFormWizard>> = {}) =>
    render(<MobileFormWizard steps={steps} enableOnMobile mobileBreakpoint={10000} {...props} />);

  it('should render without crashing', () => {
    render(<MobileFormWizard steps={steps} enableOnMobile={false} />);

    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Paso 2')).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(
      <MobileFormWizard
        steps={steps}
        enableOnMobile={false}
        submitButton={<button type="submit">Enviar</button>}
      />
    );

    expect(screen.getByText('Descripción 1')).toBeInTheDocument();
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    renderMobileWizard();

    await waitFor(() => {
      expect(screen.getByText('Paso 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText('Paso 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const onComplete = vi.fn();

    renderMobileWizard({ onComplete });

    await waitFor(() => {
      expect(screen.getByText('Paso 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    fireEvent.click(screen.getByRole('button', { name: /finalizar/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should execute side effects', async () => {
    const onStepChange = vi.fn();
    renderMobileWizard({ onStepChange });

    await waitFor(() => {
      expect(screen.getByText('Paso 1')).toBeInTheDocument();
    });

    const stepButtons = screen.getAllByLabelText(/Ir al paso/i);
    fireEvent.click(stepButtons[1]);
    expect(onStepChange).toHaveBeenCalledWith(1);
  });

  it('should be accessible', () => {
    renderMobileWizard();

    const stepButtons = screen.getAllByLabelText(/Ir al paso/i);
    expect(stepButtons.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
  });
});
