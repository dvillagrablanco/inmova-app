/**
 * NOTIFICATION ITEM
 * Item individual de notificación en el panel
 * Muestra el contenido, icono, y permite marcar como leída
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  Bell,
  Building2,
  Home,
  FileText,
  Clock,
  PartyPopper,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface NotificationItemProps {
  notification: Notification;
  onRead: (notificationId: string) => void;
}

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const router = useRouter();
  const [isMarking, setIsMarking] = useState(false);

  async function markAsRead() {
    if (notification.read || isMarking) return;

    try {
      setIsMarking(true);
      const response = await fetch(
        `/api/notifications/${notification.id}/read`,
        {
          method: 'PATCH',
        }
      );

      if (response.ok) {
        onRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsMarking(false);
    }
  }

  function handleAction() {
    if (notification.actionRoute) {
      markAsRead();
      router.push(notification.actionRoute);
    }
  }

  function handleClick() {
    if (!notification.read) {
      markAsRead();
    }
  }

  const Icon = getIconComponent(notification.icon || notification.type);
  const bgColor = getTypeColor(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-indigo-50/50' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${bgColor}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`font-semibold text-sm ${
                notification.read ? 'text-gray-700' : 'text-gray-900'
              }`}
            >
              {notification.title}
            </h4>

            {/* Unread dot */}
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-1.5"></div>
            )}
          </div>

          <p
            className={`text-sm mt-0.5 line-clamp-2 ${
              notification.read ? 'text-gray-500' : 'text-gray-700'
            }`}
          >
            {notification.message}
          </p>

          {/* Action Button */}
          {notification.actionLabel && notification.actionRoute && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction();
              }}
              className="mt-2 text-indigo-600 hover:text-indigo-700 text-xs font-medium inline-flex items-center gap-1 hover:underline"
            >
              {notification.actionLabel}
              <span>→</span>
            </button>
          )}

          {/* Time */}
          <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getIconComponent(iconName: string) {
  const iconMap: Record<string, any> = {
    CheckCircle2,
    Info,
    AlertTriangle,
    Bell,
    Building2,
    Home,
    FileText,
    Clock,
    PartyPopper,
    success: CheckCircle2,
    info: Info,
    warning: AlertTriangle,
    action: Bell,
  };

  return iconMap[iconName] || Bell;
}

function getTypeColor(type: string) {
  switch (type) {
    case 'success':
      return 'bg-green-100 text-green-600';
    case 'info':
      return 'bg-blue-100 text-blue-600';
    case 'warning':
      return 'bg-yellow-100 text-yellow-600';
    case 'action':
      return 'bg-indigo-100 text-indigo-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
