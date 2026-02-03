import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormFieldImproved } from '@/components/ui/form-field-improved';

describe('FormFieldImproved', () => {
  const baseProps = {
    label: 'Nombre',
    name: 'nombre',
    value: '',
    onChange: vi.fn(),
  };

  it('renderiza label e input', () => {
    render(<FormFieldImproved {...baseProps} />);

    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('muestra error cuando se proporciona', () => {
    render(<FormFieldImproved {...baseProps} error="Campo requerido" />);

    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('ejecuta onChange al escribir', () => {
    const onChange = vi.fn();
    render(<FormFieldImproved {...baseProps} onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('renderiza textarea cuando type=textarea', () => {
    render(<FormFieldImproved {...baseProps} type="textarea" value="Texto" />);

    expect(screen.getByRole('textbox')).toHaveValue('Texto');
  });
});
