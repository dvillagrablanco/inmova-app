import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('ConfirmationDialog', () => {
  it('renderiza título y descripción cuando está abierto', () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Eliminar"
        description="Esta acción no se puede deshacer."
      />
    );

    expect(screen.getByText('Eliminar')).toBeInTheDocument();
    expect(screen.getByText(/no se puede deshacer/i)).toBeInTheDocument();
  });

  it('ejecuta confirmación y cierra', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmationDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('muestra botones con textos personalizados', () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        confirmText="Aceptar"
        cancelText="Volver"
      />
    );

    expect(screen.getByRole('button', { name: /aceptar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });
});
