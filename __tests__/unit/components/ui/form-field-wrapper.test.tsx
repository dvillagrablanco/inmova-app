import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';

describe('FormFieldWrapper', () => {
  it('renderiza label y contenido', () => {
    render(
      <FormFieldWrapper label="Email" htmlFor="email">
        <input id="email" />
      </FormFieldWrapper>
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('muestra requerido y opcional cuando aplica', () => {
    render(
      <FormFieldWrapper label="Nombre" required optional>
        <input />
      </FormFieldWrapper>
    );

    expect(screen.getByLabelText(/requerido/i)).toBeInTheDocument();
    expect(screen.getByText('(Opcional)')).toBeInTheDocument();
  });

  it('muestra hint y error', () => {
    const { rerender } = render(
      <FormFieldWrapper label="Campo" hint="Ayuda">
        <input />
      </FormFieldWrapper>
    );

    expect(screen.getByText('Ayuda')).toBeInTheDocument();

    rerender(
      <FormFieldWrapper label="Campo" error="Error">
        <input />
      </FormFieldWrapper>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
