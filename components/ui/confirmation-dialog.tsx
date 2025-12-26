'use client';

import { ReactNode, useState } from 'react';
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
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: ReactNode;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = '¿Estás seguro?',
  description = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  icon,
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <CheckCircle className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing || isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing || isLoading}
            className={cn(
              variant === 'destructive' && 'bg-destructive hover:bg-destructive/90',
              variant === 'warning' && 'bg-yellow-500 hover:bg-yellow-600'
            )}
          >
            {isProcessing || isLoading ? 'Procesando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook para usar el diálogo de confirmación fácilmente
export function useConfirmation() {
  const [state, setState] = useState<{
    open: boolean;
    options: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>;
  }>({
    open: false,
    options: {
      onConfirm: () => {},
    },
  });

  const confirm = (options: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        options: {
          ...options,
          onConfirm: async () => {
            await options.onConfirm();
            resolve(true);
          },
        },
      });
    });
  };

  const dialog = (
    <ConfirmationDialog
      {...state.options}
      open={state.open}
      onOpenChange={(open) => {
        setState((prev) => ({ ...prev, open }));
        if (!open) {
          // Si se cierra sin confirmar, resolvemos false
        }
      }}
    />
  );

  return { confirm, dialog };
}
