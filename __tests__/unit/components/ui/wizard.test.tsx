import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Wizard } from '@/components/ui/wizard';

describe('Wizard', () => {
  const steps = [
    {
      id: 'step-1',
      title: 'Paso 1',
      fields: <div>Contenido 1</div>,
    },
    {
      id: 'step-2',
      title: 'Paso 2',
      fields: <div>Contenido 2</div>,
    },
  ];

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
      media: '',
    }));
  });

  it('should render without crashing', () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);

    render(<Wizard steps={steps} onComplete={onComplete} title="Asistente" />);

    expect(screen.getByText('Asistente')).toBeInTheDocument();
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
  });

  it('should render with props', () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);

    render(
      <Wizard
        steps={steps}
        onComplete={onComplete}
        title="Asistente"
        description="Descripción del asistente"
      />
    );

    expect(screen.getByText('Descripción del asistente')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<Wizard steps={steps} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText('Paso 2')).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<Wizard steps={steps} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
    fireEvent.click(screen.getByRole('button', { name: /Finalizar/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should execute side effects', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(<Wizard steps={steps} onComplete={onComplete} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalled();
    });
  });

  it('should be accessible', () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<Wizard steps={steps} onComplete={onComplete} />);

    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeInTheDocument();
  });
});
