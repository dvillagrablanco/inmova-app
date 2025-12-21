/**
 * CUSTOM HOOK: useNotifications
 * Hook para gestionar notificaciones in-app desde componentes cliente
 * 
 * Funcionalidades:
 * - Obtener lista de notificaciones
 * - Contador de no leídas
 * - Marcar como leída
 * - Marcar todas como leídas
 * - Auto-refresh periódico
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  actionRoute?: string;
  read: boolean;
  createdAt: string;
}

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setError(null);
      } else {
        setError('Error al cargar notificaciones');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error al cargar notificaciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(
          `/api/notifications/${notificationId}/read`,
          {
            method: 'PATCH',
          }
        );

        if (response.ok) {
          // Actualizar estado local
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error marking notification as read:', err);
        return false;
      }
    },
    []
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (response.ok) {
        // Actualizar estado local
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error marking all as read:', err);
      return false;
    }
  }, []);

  // Refresh (fetch both notifications and unread count)
  const refresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchUnreadCount(); // Solo el contador para no recargar toda la lista constantemente
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
