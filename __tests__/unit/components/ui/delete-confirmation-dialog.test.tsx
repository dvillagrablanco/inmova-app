import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
}));

describe('DeleteConfirmationDialog', () => {
  it('renderiza título y descripción', () => {
    render(
      <DeleteConfirmationDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        itemName="el documento"
      />
    );

    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
    expect(screen.getByText(/eliminará permanentemente el documento/i)).toBeInTheDocument();
  });

  it('ejecuta onConfirm al eliminar', () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmationDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
