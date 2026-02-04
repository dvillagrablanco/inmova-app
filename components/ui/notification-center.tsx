'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCheck, Filter, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import logger, { logError } from '@/lib/logger';
import { isIgnorableFetchError } from '@/lib/fetch-error';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  icon?: React.ReactNode;
  category?: 'payment' | 'contract' | 'maintenance' | 'message' | 'system';
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  // Cargar notificaciones
  useEffect(() => {
    fetchNotifications();

    // Polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar contador de no leídas
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        setNotifications([]);
        return;
      }
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      if (!isIgnorableFetchError(error)) {
        logger.error('Error fetching notifications:', error);
      }
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        return;
      }
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      if (!isIgnorableFetchError(error)) {
        logger.error('Error marking notification as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        return;
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      if (!isIgnorableFetchError(error)) {
        logger.error('Error marking all as read:', error);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        return;
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      if (!isIgnorableFetchError(error)) {
        logger.error('Error deleting notification:', error);
      }
    }
  };

  const deleteAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/delete-read', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        return;
      }
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      if (!isIgnorableFetchError(error)) {
        logger.error('Error deleting read notifications:', error);
      }
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    const colors = {
      info: 'bg-blue-500',
      warning: 'bg-yellow-500',
      success: 'bg-green-500',
      error: 'bg-red-500',
    };
    return colors[type] || colors.info;
  };

  const getCategoryIcon = (category?: Notification['category']) => {
    // Implementar iconos por categoría si es necesario
    return null;
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const handleClick = () => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      if (notification.link) {
        setOpen(false);
      }
    };

    const content = (
      <div
        className={cn(
          'flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
          notification.read ? 'opacity-60 hover:opacity-100' : 'bg-accent/50',
          'hover:bg-accent'
        )}
        onClick={handleClick}
      >
        <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', getTypeColor(notification.type))} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
              {notification.title}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.createdAt), { 
              addSuffix: true,
              locale: es 
            })}
          </p>
        </div>
      </div>
    );

    if (notification.link) {
      return (
        <Link href={notification.link} className="block">
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h4 className="font-semibold">Notificaciones</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
            </p>
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={markAllAsRead}
                title="Marcar todo como leído"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={deleteAllRead}
              title="Eliminar leídas"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Todas
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              No leídas
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No hay notificaciones</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Te avisaremos cuando haya algo nuevo
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredNotifications.map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">Todo al día</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No tienes notificaciones sin leer
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredNotifications.map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => {
              setOpen(false);
              // Navegar a página de configuración de notificaciones
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar notificaciones
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
