/**
 * NOTIFICATION BELL
 * Icono de campana con badge contador de notificaciones no leídas
 * Se muestra en el header de la aplicación
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPanel from './NotificationPanel';
import { isIgnorableFetchError } from '@/lib/fetch-error';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  async function fetchUnreadCount() {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) {
        setUnreadCount(0);
        return;
      }
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      if (!isIgnorableFetchError(error)) {
        console.error('Error fetching unread count:', error);
      }
    }
  }

  function togglePanel() {
    setIsOpen(!isOpen);
  }

  function handleNotificationRead() {
    // Decrementar contador al marcar como leída
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function handleMarkAllRead() {
    // Resetear contador al marcar todas como leídas
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <motion.button
        ref={buttonRef}
        onClick={togglePanel}
        className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Notificaciones (${unreadCount} no leídas)`}
      >
        <Bell className="w-5 h-5" />

        {/* Badge con contador */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <div ref={panelRef}>
            <NotificationPanel
              onClose={() => setIsOpen(false)}
              onNotificationRead={handleNotificationRead}
              onMarkAllRead={handleMarkAllRead}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
