import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordGenerator } from '@/components/ui/password-generator';

describe('PasswordGenerator', () => {
  const baseProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    render(<PasswordGenerator {...baseProps} />);

    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Introduce o genera una contraseña segura')).toBeInTheDocument();
  });

  it('should generate a password', () => {
    const onChange = vi.fn();
    render(<PasswordGenerator value="" onChange={onChange} />);

    const generateButton = screen.getByRole('button', { name: /generar contraseña segura/i });
    fireEvent.click(generateButton);

    expect(onChange).toHaveBeenCalled();
    const generated = onChange.mock.calls[0][0];
    expect(typeof generated).toBe('string');
    expect(generated.length).toBe(16);
  });

  it('should toggle password visibility', () => {
    render(<PasswordGenerator value="Secret123!" onChange={vi.fn()} />);

    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggle = input.parentElement?.querySelector('button');
    expect(toggle).toBeTruthy();
    if (toggle) {
      fireEvent.click(toggle);
    }

    expect(input.type).toBe('text');
  });

  it('should copy password to clipboard', async () => {
    const onChange = vi.fn();
    render(<PasswordGenerator value="Secret123!" onChange={onChange} />);

    const copyButton = screen.getByRole('button', { name: /copiar contraseña/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Secret123!');
  });
});
