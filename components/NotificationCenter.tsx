'use client';

/**
 * 🔔 NOTIFICATION CENTER
 *
 * Centro de notificaciones in-app con:
 * - Badge con contador de no leídas
 * - Dropdown con lista de notificaciones
 * - Marcar como leída (individual y todas)
 * - Iconos y colores por tipo de notificación
 * - Botones de acción contextuales
 * - Scroll infinito (paginación)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Info,
  AlertTriangle,
  AlertCircle,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  icon?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  className?: string;
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  ONBOARDING: <Sparkles className="w-5 h-5 text-blue-600" />,
  SUCCESS: <Check className="w-5 h-5 text-green-600" />,
  INFO: <Info className="w-5 h-5 text-blue-600" />,
  WARNING: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  ERROR: <AlertCircle className="w-5 h-5 text-red-600" />,
  CELEBRATION: <Trophy className="w-5 h-5 text-purple-600" />,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  ONBOARDING: 'bg-blue-50 border-blue-200',
  SUCCESS: 'bg-green-50 border-green-200',
  INFO: 'bg-blue-50 border-blue-200',
  WARNING: 'bg-yellow-50 border-yellow-200',
  ERROR: 'bg-red-50 border-red-200',
  CELEBRATION: 'bg-purple-50 border-purple-200',
};

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?limit=10&offset=${offset}`);
      const data = await response.json();

      if (offset === 0) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
      }

      setUnreadCount(data.unreadCount || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Fetch notifications on open
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(0);
    }
  }, [isOpen, fetchNotifications]);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-lg text-gray-900">
                Notificaciones
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">({unreadCount} nuevas)</span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-sm">Cargando notificaciones...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {notification.icon ? (
                            <span className="text-2xl">{notification.icon}</span>
                          ) : (
                            NOTIFICATION_ICONS[notification.type] || (
                              <Info className="w-5 h-5 text-gray-400" />
                            )
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-2">
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                onClick={() => {
                                  if (!notification.isRead) {
                                    markAsRead(notification.id);
                                  }
                                  setIsOpen(false);
                                }}
                              >
                                {notification.actionLabel || 'Ver más'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Marcar leída
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="p-4 text-center">
                      <button
                        onClick={() => fetchNotifications(notifications.length)}
                        disabled={loading}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                      >
                        {loading ? 'Cargando...' : 'Cargar más'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <a
                  href="/notifications"
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Ver todas las notificaciones
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
