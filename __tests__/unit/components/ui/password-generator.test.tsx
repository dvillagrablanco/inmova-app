import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordGenerator } from '@/components/ui/password-generator';

describe('PasswordGenerator', () => {
  it('should render without crashing', () => {
    const onChange = vi.fn();
    render(<PasswordGenerator value="" onChange={onChange} />);

    expect(screen.getByText('Contraseña')).toBeInTheDocument();
  });

  it('should render with props', () => {
    const onChange = vi.fn();
    render(<PasswordGenerator value="" onChange={onChange} label="Clave" required />);

    expect(screen.getByText('Clave')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const onChange = vi.fn();
    render(<PasswordGenerator value="" onChange={onChange} />);

    fireEvent.click(screen.getByTitle('Generar contraseña segura'));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      const [generated] = onChange.mock.calls[0];
      expect(typeof generated).toBe('string');
      expect(generated.length).toBe(16);
    });
  });

  it('should handle form submission', async () => {
    const onChange = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<PasswordGenerator value="Abc123!@#" onChange={onChange} />);

    fireEvent.click(screen.getByTitle('Copiar contraseña'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('Abc123!@#');
    });
  });

  it('should be accessible', () => {
    const onChange = vi.fn();
    render(<PasswordGenerator value="" onChange={onChange} />);

    expect(
      screen.getByPlaceholderText('Introduce o genera una contraseña segura')
    ).toBeInTheDocument();
  });
});
