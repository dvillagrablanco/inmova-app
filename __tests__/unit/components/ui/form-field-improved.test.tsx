import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormFieldImproved } from '@/components/ui/form-field-improved';

describe('FormFieldImproved', () => {
  const baseProps = {
    label: 'Nombre',
    name: 'nombre',
    value: '',
    onChange: () => {},
  };

  it('renderiza etiqueta, input y placeholder', () => {
    render(
      <FormFieldImproved {...baseProps} placeholder="Tu nombre" />
    );

    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument();
  });

  it('propaga cambios del input', () => {
    const onChange = vi.fn();

    render(<FormFieldImproved {...baseProps} onChange={onChange} />);

    const input = screen.getByLabelText('Nombre');
    fireEvent.change(input, { target: { value: 'Ana' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('muestra error y oculta hint', () => {
    render(
      <FormFieldImproved
        {...baseProps}
        error="Campo requerido"
        hint="Ayuda contextual"
      />
    );

    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
    expect(screen.queryByText('Ayuda contextual')).not.toBeInTheDocument();
  });

  it('muestra contador de caracteres', () => {
    render(
      <FormFieldImproved
        {...baseProps}
        value="abcd"
        showCharCount
        maxLength={10}
      />
    );

    expect(screen.getByText('4 / 10')).toBeInTheDocument();
  });

  it('renderiza textarea cuando type=textarea', () => {
    render(
      <FormFieldImproved {...baseProps} type="textarea" value="Texto" />
    );

    const textarea = screen.getByLabelText('Nombre');
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('respeta required en la etiqueta', () => {
    render(<FormFieldImproved {...baseProps} required />);

    const requiredMarker = screen.getByText('*');
    expect(requiredMarker).toBeInTheDocument();
  });

  it('renderiza con estado de exito', () => {
    render(<FormFieldImproved {...baseProps} success="Correcto" />);

    expect(screen.getByText('Correcto')).toBeInTheDocument();
  });

  it('renderiza hint cuando no hay error ni exito', () => {
    render(<FormFieldImproved {...baseProps} hint="Ayuda contextual" />);

    expect(screen.getByText('Ayuda contextual')).toBeInTheDocument();
  });

  it('soporta icono en el input', () => {
    render(
      <FormFieldImproved
        {...baseProps}
        icon={<span data-testid="input-icon">i</span>}
      />
    );

    expect(screen.getByTestId('input-icon')).toBeInTheDocument();
  });

  it('permite props de tipo number', () => {
    const onSubmit = vi.fn();

    render(
      <FormFieldImproved
        {...baseProps}
        type="number"
        min={1}
        max={10}
        step={1}
        value={5}
        onChange={onSubmit}
      />
    );

    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('step', '1');
  });
});
