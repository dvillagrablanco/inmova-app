import { toast, ExternalToast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationOptions extends ExternalToast {
  type?: 'success' | 'error' | 'warning' | 'info' | 'promise';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  persistent?: boolean;
  undoable?: boolean;
  onUndo?: () => void | Promise<void>;
  richColors?: boolean;
}

/**
 * Sistema de notificaciones mejorado con soporte para:
 * - Notificaciones con acciones
 * - Operaciones undoable (deshacer)
 * - Notificaciones persistentes
 * - Estados de promesas
 */
export const notifications = {
  /**
   * Muestra una notificación con opciones avanzadas
   */
  show(options: NotificationOptions) {
    const {
      type = 'info',
      title,
      description,
      action,
      persistent = false,
      undoable = false,
      onUndo,
      richColors = true,
      ...rest
    } = options;

    const duration = persistent ? Infinity : 5000;

    const toastOptions: ExternalToast = {
      description,
      duration,
      richColors,
      closeButton: persistent,
      ...rest,
    };

    // Añadir botón de acción si existe
    if (action) {
      toastOptions.action = {
        label: action.label,
        onClick: async () => {
          await action.onClick();
        },
      };
    }

    // Añadir botón de deshacer si la acción es undoable
    if (undoable && onUndo) {
      toastOptions.cancel = {
        label: 'Deshacer',
        onClick: async () => {
          await onUndo();
          toast.success('Acción deshecha');
        },
      };
    }

    // Mostrar notificación según tipo
    switch (type) {
      case 'success':
        return toast.success(title, toastOptions);
      case 'error':
        return toast.error(title, toastOptions);
      case 'warning':
        return toast.warning(title, toastOptions);
      case 'info':
        return toast.info(title, toastOptions);
      default:
        return toast(title, toastOptions);
    }
  },

  /**
   * Notificación de éxito
   */
  success(title: string, description?: string, options?: Partial<NotificationOptions>) {
    return this.show({
      type: 'success',
      title,
      description,
      ...options,
    });
  },

  /**
   * Notificación de error
   */
  error(title: string, description?: string, options?: Partial<NotificationOptions>) {
    return this.show({
      type: 'error',
      title,
      description,
      ...options,
    });
  },

  /**
   * Notificación de advertencia
   */
  warning(title: string, description?: string, options?: Partial<NotificationOptions>) {
    return this.show({
      type: 'warning',
      title,
      description,
      ...options,
    });
  },

  /**
   * Notificación informativa
   */
  info(title: string, description?: string, options?: Partial<NotificationOptions>) {
    return this.show({
      type: 'info',
      title,
      description,
      ...options,
    });
  },

  /**
   * Notificación para operaciones asíncronas
   * Muestra estados de carga, éxito y error automáticamente
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      }
    );
  },

  /**
   * Notificación con acción de deshacer
   * Útil para operaciones destructivas
   */
  withUndo(
    title: string,
    description: string,
    onUndo: () => void | Promise<void>,
    options?: Partial<NotificationOptions>
  ) {
    return this.show({
      type: 'success',
      title,
      description,
      undoable: true,
      onUndo,
      duration: 8000, // Más tiempo para permitir deshacer
      ...options,
    });
  },

  /**
   * Notificación persistente que requiere acción del usuario
   */
  persistent(
    title: string,
    description: string,
    action: { label: string; onClick: () => void },
    options?: Partial<NotificationOptions>
  ) {
    return this.show({
      type: 'warning',
      title,
      description,
      action,
      persistent: true,
      ...options,
    });
  },

  /**
   * Cierra todas las notificaciones
   */
  dismiss(id?: string | number) {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  },
};

/**
 * Ejemplos de uso:
 * 
 * // Notificación simple
 * notifications.success('Éxito', 'La operación se completó');
 * 
 * // Notificación con deshacer
 * notifications.withUndo(
 *   'Edificio eliminado',
 *   'Se ha eliminado "Torre Vista"',
 *   async () => {
 *     await restoreBuilding(buildingId);
 *   }
 * );
 * 
 * // Notificación de promesa
 * notifications.promise(
 *   fetch('/api/buildings', { method: 'POST', body: data }),
 *   {
 *     loading: 'Creando edificio...',
 *     success: 'Edificio creado exitosamente',
 *     error: 'Error al crear edificio',
 *   }
 * );
 * 
 * // Notificación con acción
 * notifications.show({
 *   type: 'info',
 *   title: 'Nueva actualización disponible',
 *   description: 'Hay funciones nuevas esperando por ti',
 *   action: {
 *     label: 'Ver novedades',
 *     onClick: () => router.push('/changelog'),
 *   },
 * });
 */
