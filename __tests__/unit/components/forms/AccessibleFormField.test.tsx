import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const onChange = vi.fn();
    render(<AccessibleInputField {...baseProps} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Juan' } });

    expect(onChange).toHaveBeenCalledWith('Juan');
  });

  it('should render required indicator and error message', () => {
    render(<AccessibleInputField {...baseProps} required error="Campo obligatorio" value="test" />);

    expect(screen.getByLabelText('requerido')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Campo obligatorio');
  });
});
