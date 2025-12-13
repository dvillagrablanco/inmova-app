/**
 * Hook for confirmation dialogs before destructive actions
 * Improves UX by preventing accidental deletions
 */

import { useState, useCallback } from 'react';
import logger from '@/lib/logger';

interface UseConfirmDialogOptions {
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

interface UseConfirmDialogResult {
  isOpen: boolean;
  title: string;
  description: string;
  openDialog: () => void;
  closeDialog: () => void;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
}

export function useConfirmDialog(
  options: UseConfirmDialogOptions
): UseConfirmDialogResult {
  const {
    onConfirm,
    onCancel,
    title = '¿Estás seguro?',
    description = 'Esta acción no se puede deshacer.',
  } = options;

  const [isOpen, setIsOpen] = useState(false);

  const openDialog = useCallback(() => {
    setIsOpen(true);
    logger.info(`Confirmation dialog opened: ${title}`);
  }, [title]);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    logger.info('Confirmation dialog closed');
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      logger.info('User confirmed action');
      await onConfirm();
      closeDialog();
    } catch (error) {
      logger.error('Error during confirmation action', { error });
      // Keep dialog open on error so user can see the error
    }
  }, [onConfirm, closeDialog]);

  const handleCancel = useCallback(() => {
    logger.info('User cancelled action');
    onCancel?.();
    closeDialog();
  }, [onCancel, closeDialog]);

  return {
    isOpen,
    title,
    description,
    openDialog,
    closeDialog,
    handleConfirm,
    handleCancel,
  };
}
