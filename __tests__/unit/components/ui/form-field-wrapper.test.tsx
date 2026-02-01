import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';

describe('FormFieldWrapper', () => {
  const renderField = (props?: Partial<Parameters<typeof FormFieldWrapper>[0]>) =>
    render(
      <FormFieldWrapper label="Email" htmlFor="email" {...props}>
        <input id="email" type="email" />
      </FormFieldWrapper>
    );

  it('renderiza etiqueta y campo', () => {
    renderField();

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('muestra indicador requerido y opcional', () => {
    renderField({ required: true, optional: true });

    expect(screen.getByLabelText('requerido')).toBeInTheDocument();
    expect(screen.getByText('(Opcional)')).toBeInTheDocument();
  });

  it('muestra hint cuando no hay error', () => {
    renderField({ hint: 'Ayuda contextual' });

    expect(screen.getByText('Ayuda contextual')).toBeInTheDocument();
  });

  it('muestra error y oculta hint', () => {
    renderField({ error: 'Campo requerido', hint: 'Ayuda contextual' });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
    expect(screen.queryByText('Ayuda contextual')).not.toBeInTheDocument();
  });
});
