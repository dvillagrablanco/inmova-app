'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastManager {
  private static instance: ToastManager;

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <CheckCircle2 className="h-5 w-5" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <XCircle className="h-5 w-5" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  warning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4500,
      icon: <AlertTriangle className="h-5 w-5" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <Info className="h-5 w-5" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  loading(message: string, options?: Omit<ToastOptions, 'action'>) {
    return toast.loading(message, {
      description: options?.description,
      duration: options?.duration || Infinity,
    });
  }

  promise<T>(promise: Promise<T>, messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }) {
    return toast.promise(promise, messages);
  }

  dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  }
}

export const toastManager = ToastManager.getInstance();

// Hook para usar toast con opciones pre-configuradas
export function useToast() {
  return {
    success: toastManager.success.bind(toastManager),
    error: toastManager.error.bind(toastManager),
    warning: toastManager.warning.bind(toastManager),
    info: toastManager.info.bind(toastManager),
    loading: toastManager.loading.bind(toastManager),
    promise: toastManager.promise.bind(toastManager),
    dismiss: toastManager.dismiss.bind(toastManager),
  };
}