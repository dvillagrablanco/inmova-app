import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  prioridad: 'bajo' | 'medio' | 'alto' | 'urgente';
  fechaLimite: string | null;
  entityId: string | null;
  entityType: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
  tipo?: string;
  autoRefresh?: number;
}): UseNotificationsReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      if (options?.tipo) params.append('tipo', options.tipo);

      const response = await fetch(`/api/notifications?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [session?.user, options?.limit, options?.unreadOnly, options?.tipo]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Error al marcar como leída');
      }

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, leida: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas');
      }

      // Actualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
      throw err;
    }
  }, []);

  // Cargar notificaciones al montar
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh opcional
  useEffect(() => {
    if (options?.autoRefresh && options.autoRefresh > 0) {
      const interval = setInterval(refresh, options.autoRefresh);
      return () => clearInterval(interval);
    }
  }, [refresh, options?.autoRefresh]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead
  };
}
