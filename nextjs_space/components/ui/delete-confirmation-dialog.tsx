/**
 * Reusable confirmation dialog for destructive actions
 * Ensures users don't accidentally delete important data
 */

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ButtonWithLoading } from '@/components/ui/button-with-loading';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  itemName?: string;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = '¿Estás seguro?',
  description,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isLoading = false,
  itemName,
}: DeleteConfirmationDialogProps) {
  const defaultDescription = itemName
    ? `Esta acción no se puede deshacer. Se eliminará permanentemente "${itemName}".`
    : 'Esta acción no se puede deshacer. Los datos se eliminarán permanentemente.';

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <ButtonWithLoading
            variant="destructive"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {confirmText}
          </ButtonWithLoading>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
