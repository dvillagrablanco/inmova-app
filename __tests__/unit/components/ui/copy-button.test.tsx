import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyButton } from '@/components/ui/copy-button';
import { copyToClipboard } from '@/lib/utils';

vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils')>('@/lib/utils');
  return {
    ...actual,
    copyToClipboard: vi.fn(),
  };
});

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('@/components/ui/toast-manager', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
  }),
}));

describe('CopyButton', () => {
  beforeEach(() => {
    vi.mocked(copyToClipboard).mockResolvedValue(true);
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it('renderiza el botón con label', () => {
    render(<CopyButton text="ABC123" label="Copiar" />);

    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
  });

  it('copia el texto y muestra toast de éxito', async () => {
    render(<CopyButton text="ABC123" label="Copiar" />);

    fireEvent.click(screen.getByRole('button', { name: /copiar/i }));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith('ABC123');
      expect(toastSuccess).toHaveBeenCalled();
    });
  });
});
