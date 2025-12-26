'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bell,
  X,
  MessageSquare,
  DollarSign,
  CheckCircle,
  FileSignature,
  Target,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  priority: 'high' | 'normal';
  title: string;
  message: string;
  details: string;
  timestamp: Date;
  portal: string;
  actionUrl: string;
  icon: string;
}

interface NotificationCounts {
  total: number;
  high: number;
  normal: number;
  byPortal: {
    inquilinos: number;
    proveedores: number;
    propietarios: number;
    comerciales: number;
  };
}

export function ExternalPortalsNotifications() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      loadNotifications();
      // Refrescar cada 5 minutos
      const interval = setInterval(loadNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setCounts(data.counts || null);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    router.push(notification.actionUrl);
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'dollar':
        return <DollarSign className="h-4 w-4" />;
      case 'check':
        return <CheckCircle className="h-4 w-4" />;
      case 'signature':
        return <FileSignature className="h-4 w-4" />;
      case 'target':
        return <Target className="h-4 w-4" />;
      case 'trophy':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'text-red-600' : 'text-blue-600';
  };

  // Solo mostrar para super_admin
  if (session?.user?.role !== 'super_admin') {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(true)}>
          <Bell className="h-5 w-5" />
          {counts && counts.total > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {counts.total > 99 ? '99+' : counts.total}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notificaciones de Portales</h3>
            {counts && (
              <p className="text-xs text-muted-foreground mt-1">
                {counts.total} notificaciones
                {counts.high > 0 && (
                  <span className="text-red-600 ml-2">· {counts.high} prioritarias</span>
                )}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtros por portal */}
        {counts && (
          <div className="flex gap-2 p-3 border-b bg-muted/30">
            <Badge variant="outline" className="text-xs">
              Inquilinos: {counts.byPortal.inquilinos}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Proveedores: {counts.byPortal.proveedores}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Propietarios: {counts.byPortal.propietarios}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Comerciales: {counts.byPortal.comerciales}
            </Badge>
          </div>
        )}

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn('flex-shrink-0 mt-1', getPriorityColor(notification.priority))}
                    >
                      {getIcon(notification.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {notification.portal}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      {notification.details && (
                        <p className="text-xs text-muted-foreground/70 line-clamp-1">
                          {notification.details}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.timestamp
                          ? format(new Date(notification.timestamp), "d 'de' MMMM, HH:mm", {
                              locale: es,
                            })
                          : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setIsOpen(false);
              router.push('/admin/portales-externos');
            }}
          >
            Ver todos los portales
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
