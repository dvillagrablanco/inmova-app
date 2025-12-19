'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  Filter,
  Settings2,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import logger, { logError } from '@/lib/logger';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  category?: string;
  metadata?: any;
}

export default function NotificacionesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status, router]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchQuery, typeFilter, activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        // El API retorna { notifications: [], unreadCount: number, total: number }
        setNotifications(data.notifications || data || []);
      } else {
        toast.error('Error al cargar notificaciones');
        setNotifications([]);
      }
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      toast.error('Error al cargar notificaciones');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Filtrar por tab
    if (activeTab === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    }

    // Filtrar por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        toast.success('Notificación marcada como leída');
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leída');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      logger.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success('Notificación eliminada');
      }
    } catch (error) {
      logger.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.size === 0) {
      toast.error('Selecciona al menos una notificación');
      return;
    }

    if (!confirm(`¿Eliminar ${selectedNotifications.size} notificaciones?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedNotifications).map((id) =>
          fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        )
      );

      setNotifications((prev) => prev.filter((n) => !selectedNotifications.has(n.id)));
      setSelectedNotifications(new Set());
      toast.success(`${selectedNotifications.size} notificaciones eliminadas`);
    } catch (error) {
      logger.error('Error deleting notifications:', error);
      toast.error('Error al eliminar notificaciones');
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const selectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    const icons = {
      info: <Info className="w-5 h-5 text-blue-500" />,
      warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      success: <CheckCircle className="w-5 h-5 text-green-500" />,
      error: <XCircle className="w-5 h-5 text-red-500" />,
    };
    return icons[type];
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-96" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Notificaciones</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Notificaciones</h1>
                <p className="text-muted-foreground mt-2">
                  {unreadCount > 0
                    ? `Tienes ${unreadCount} notificaciones sin leer`
                    : 'Estás al día con todas tus notificaciones'}
                </p>
              </div>
              <Link href="/configuracion/notificaciones">
                <Button variant="outline">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList>
                      <TabsTrigger value="all">
                        Todas
                        <Badge variant="secondary" className="ml-2">
                          {notifications.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="unread">
                        Sin leer
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {unreadCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {selectedNotifications.size > 0 && (
                      <Button variant="destructive" size="sm" onClick={deleteSelected}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar ({selectedNotifications.size})
                      </Button>
                    )}
                    {unreadCount > 0 && (
                      <Button variant="outline" size="sm" onClick={markAllAsRead}>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Marcar todo
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar notificaciones..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="info">Información</SelectItem>
                      <SelectItem value="success">Éxito</SelectItem>
                      <SelectItem value="warning">Advertencia</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredNotifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.size === filteredNotifications.length}
                      onChange={selectAll}
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">Seleccionar todas</span>
                  </div>
                )}

                <div className="space-y-2">
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bell className="w-16 h-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || typeFilter !== 'all'
                          ? 'No se encontraron resultados con los filtros aplicados'
                          : 'Te avisaremos cuando haya algo nuevo'}
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={cn(
                          'transition-colors',
                          !notification.read && 'border-l-4 border-l-blue-500 bg-accent/50',
                          selectedNotifications.has(notification.id) && 'bg-accent'
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.has(notification.id)}
                              onChange={() => toggleSelect(notification.id)}
                              className="mt-1 rounded"
                            />
                            <div className="mt-1">{getTypeIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4
                                    className={cn(
                                      'font-medium',
                                      !notification.read && 'font-semibold'
                                    )}
                                  >
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                      addSuffix: true,
                                      locale: es,
                                    })}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                    >
                                      <CheckCheck className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notification.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {notification.link && (
                                <Link href={notification.link}>
                                  <Button variant="link" size="sm" className="px-0">
                                    Ver detalles
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
