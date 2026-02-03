import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Wizard } from '@/components/ui/wizard';

describe('Wizard', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });
  const steps = [
    {
      id: 'step-1',
      title: 'Paso 1',
      description: 'Datos básicos',
      fields: <div>Contenido 1</div>,
    },
    {
      id: 'step-2',
      title: 'Paso 2',
      description: 'Confirmación',
      fields: <div>Contenido 2</div>,
    },
  ];

  it('should render without crashing', () => {
    render(<Wizard steps={steps} onComplete={vi.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
  });

  it('should render title and description', () => {
    render(
      <Wizard
        steps={steps}
        title="Asistente"
        description="Completa los pasos"
        onComplete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText('Asistente')).toBeInTheDocument();
    expect(screen.getByText('Completa los pasos')).toBeInTheDocument();
  });

  it('should advance to next step', async () => {
    render(<Wizard steps={steps} onComplete={vi.fn().mockResolvedValue(undefined)} />);

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText('Paso 2')).toBeInTheDocument();
      expect(screen.getByText('Contenido 2')).toBeInTheDocument();
    });
  });

  it('should call onComplete on last step', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<Wizard steps={steps} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText('Paso 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /finalizar/i }));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });
});
