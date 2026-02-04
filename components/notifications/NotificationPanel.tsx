/**
 * NOTIFICATION PANEL
 * Panel dropdown con lista de notificaciones
 * Se muestra al hacer click en el NotificationBell
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCheck, X, Loader2 } from 'lucide-react';
import NotificationItem from './NotificationItem';
import { isIgnorableFetchError } from '@/lib/fetch-error';

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

interface NotificationPanelProps {
  onClose: () => void;
  onNotificationRead: () => void;
  onMarkAllRead: () => void;
}

export default function NotificationPanel({
  onClose,
  onNotificationRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=20');

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      if (!isIgnorableFetchError(error)) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      setIsMarkingAllRead(true);
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (!response.ok) {
        return;
      }

      // Actualizar todas las notificaciones a read: true
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      onMarkAllRead();
    } catch (error) {
      if (!isIgnorableFetchError(error)) {
        console.error('Error marking all as read:', error);
      }
    } finally {
      setIsMarkingAllRead(false);
    }
  }

  function handleNotificationRead(notificationId: string) {
    // Actualizar la notificación a read: true en el estado local
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    onNotificationRead();
  }

  const unreadNotifications = notifications.filter((n) => !n.read);
  const hasUnread = unreadNotifications.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-32px)] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Notificaciones</h3>
          {hasUnread && (
            <p className="text-indigo-100 text-xs">
              {unreadNotifications.length} sin leer
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
              className="text-white hover:bg-white/20 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              title="Marcar todas como leídas"
            >
              {isMarkingAllRead ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Marcar todas</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Cerrar notificaciones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Cargando...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No hay notificaciones</p>
            <p className="text-gray-400 text-sm mt-1">
              Te notificaremos cuando haya novedades
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleNotificationRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <button
            onClick={onClose}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium w-full text-center"
          >
            Cerrar
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Icon placeholder
function Bell({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
  );
}
