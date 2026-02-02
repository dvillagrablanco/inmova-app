import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessibleInputField } from '@/components/forms/AccessibleFormField';

describe('AccessibleInputField', () => {
  const baseProps = {
    id: 'nombre',
    name: 'nombre',
    label: 'Nombre',
    value: '',
    onChange: vi.fn(),
  };

  it('should render without crashing', () => {
    render(<AccessibleInputField {...baseProps} />);

    expect(screen.getByText('Nombre')).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(
      <AccessibleInputField
        {...baseProps}
        required
        helpText="Campo obligatorio"
      />
    );

    expect(screen.getByText('Campo obligatorio')).toBeInTheDocument();
    expect(screen.getByLabelText('requerido')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const onChange = vi.fn();
    render(<AccessibleInputField {...baseProps} onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Juan' } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('Juan');
    });
  });

  it('should handle form submission', async () => {
    const onChange = vi.fn();
    render(
      <AccessibleInputField
        {...baseProps}
        onChange={onChange}
        type="password"
        value="secreto"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Mostrar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });
  });

  it('should be accessible', () => {
    render(<AccessibleInputField {...baseProps} error="Campo requerido" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Campo requerido');
  });
});
