/**
 * UI COMPONENTS - COMPREHENSIVE UNIT TESTS
 * Tests para Button, Input y componentes UI básicos
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

describe('🎨 UI Components - Button', () => {
  test('✅ Debe renderizar button por defecto', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test('✅ Debe aplicar variant default', () => {
    render(<Button variant="default">Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('✅ Debe aplicar variant destructive', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('✅ Debe aplicar variant outline', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('✅ Debe aplicar size sm', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('✅ Debe aplicar size lg', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('✅ Debe manejar onClick', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('✅ Debe estar disabled cuando disabled=true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('❌ No debe llamar onClick cuando disabled', async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  test('✅ Debe renderizar children correctamente', () => {
    render(
      <Button>
        <span>Custom Content</span>
      </Button>
    );
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  test('⚠️ Debe aplicar className personalizado', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  test('⚠️ Debe pasar props HTML nativos', () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );
    const button = screen.getByTestId('submit-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
});

describe('🎨 UI Components - Input', () => {
  test('✅ Debe renderizar input', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  test('✅ Debe manejar type text', () => {
    render(<Input type="text" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  test('✅ Debe manejar type email', () => {
    render(<Input type="email" placeholder="Email" />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  test('✅ Debe manejar type password', () => {
    render(<Input type="password" placeholder="Password" />);
    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  test('✅ Debe manejar onChange', async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} placeholder="Type here" />);

    const input = screen.getByPlaceholderText('Type here');
    await userEvent.type(input, 'Hello');

    expect(handleChange).toHaveBeenCalled();
  });

  test('✅ Debe actualizar value', async () => {
    render(<Input placeholder="Type here" />);

    const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
    await userEvent.type(input, 'Test value');

    expect(input.value).toBe('Test value');
  });

  test('✅ Debe estar disabled cuando disabled=true', () => {
    render(<Input disabled placeholder="Disabled" />);
    const input = screen.getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
  });

  test('✅ Debe manejar required', () => {
    render(<Input required placeholder="Required" />);
    const input = screen.getByPlaceholderText('Required');
    expect(input).toBeRequired();
  });

  test('✅ Debe manejar maxLength', () => {
    render(<Input maxLength={10} placeholder="Max 10" />);
    const input = screen.getByPlaceholderText('Max 10');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  test('⚠️ Debe aplicar className personalizado', () => {
    render(<Input className="custom-input" placeholder="Custom" />);
    const input = screen.getByPlaceholderText('Custom');
    expect(input).toHaveClass('custom-input');
  });

  test('⚠️ Debe manejar type number', () => {
    render(<Input type="number" placeholder="Number" />);
    const input = screen.getByPlaceholderText('Number');
    expect(input).toHaveAttribute('type', 'number');
  });

  test('⚠️ Debe manejar value controlado', () => {
    const { rerender } = render(<Input value="Initial" onChange={() => {}} />);
    const input = screen.getByDisplayValue('Initial') as HTMLInputElement;

    expect(input.value).toBe('Initial');

    rerender(<Input value="Updated" onChange={() => {}} />);
    expect(input.value).toBe('Updated');
  });
});

describe('🎨 UI Components - Edge Cases', () => {
  test('⚠️ Button debe manejar múltiples clicks rápidos', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click fast</Button>);

    const button = screen.getByRole('button');
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  test('⚠️ Input debe manejar paste', async () => {
    render(<Input placeholder="Paste here" />);

    const input = screen.getByPlaceholderText('Paste here') as HTMLInputElement;
    input.focus();
    await userEvent.paste('Pasted text');

    expect(input.value).toContain('Pasted text');
  });

  test('⚠️ Input debe limpiar valor', async () => {
    render(<Input placeholder="Clear me" />);

    const input = screen.getByPlaceholderText('Clear me') as HTMLInputElement;
    await userEvent.type(input, 'Text to clear');
    await userEvent.clear(input);

    expect(input.value).toBe('');
  });

  test('⚠️ Button con asChild debe renderizar custom element', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
  });
});
