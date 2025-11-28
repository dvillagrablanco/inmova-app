'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  Bell,
  Home,
  ArrowLeft,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
  entityId?: string | null;
  entityType?: string | null;
}

export default function NotificacionesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todas');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchNotifications();
  }, [status]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []); // Maneja la respuesta correcta de la API
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leida: true }),
      });

      if (response.ok) {
        setNotifications(notifications.map((n) => (n.id === id ? { ...n, leida: true } : n)));
        toast.success('Notificación marcada como leída');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leída');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (response.ok) {
        // Actualizar el estado local para marcar todas las notificaciones como leídas
        setNotifications(notifications.map((n) => ({ ...n, leida: true })));
        toast.success('Todas las notificaciones marcadas como leídas');
      } else {
        toast.error('Error al marcar todas como leídas');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== id));
        toast.success('Notificación eliminada');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.leida) {
      await markAsRead(notification.id);
    }

    // Navegar a la ubicación relacionada si existe
    if (notification.entityType && notification.entityId) {
      const routeMap: Record<string, string> = {
        building: '/edificios',
        unit: '/unidades',
        tenant: '/inquilinos',
        contract: '/contratos',
        payment: '/pagos',
        maintenance: '/mantenimiento',
        candidate: '/candidatos',
        expense: '/gastos',
        document: '/documentos',
      };

      const baseRoute = routeMap[notification.entityType.toLowerCase()];
      if (baseRoute) {
        router.push(`${baseRoute}/${notification.entityId}`);
      }
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const getNotificationIcon = (tipo: string) => {
    const icons: Record<string, any> = {
      alerta: AlertTriangle,
      recordatorio: Calendar,
      informacion: Info,
      urgente: AlertCircle,
    };
    return icons[tipo.toLowerCase()] || Bell;
  };

  const getNotificationColor = (tipo: string) => {
    const colors: Record<string, string> = {
      alerta: 'text-red-600 bg-red-50 dark:bg-red-950/20',
      recordatorio: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      informacion: 'text-gray-600 bg-gray-50 dark:bg-gray-950/20',
      urgente: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20',
    };
    return colors[tipo.toLowerCase()] || 'text-gray-600 bg-gray-50';
  };

  const filteredNotifications =
    activeTab === 'todas'
      ? notifications
      : activeTab === 'no_leidas'
      ? notifications.filter((n) => !n.leida)
      : notifications.filter((n) => n.leida);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
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

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-6">
                      {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">Mantente al día con las alertas del sistema</p>
              </div>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
                <TabsTrigger value="todas">Todas ({notifications.length})</TabsTrigger>
                <TabsTrigger value="no_leidas">No leídas ({unreadCount})</TabsTrigger>
                <TabsTrigger value="leidas">Leídas ({notifications.length - unreadCount})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6 space-y-3">
                {filteredNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === 'no_leidas'
                          ? 'No tienes notificaciones sin leer'
                          : activeTab === 'leidas'
                          ? 'No hay notificaciones leídas'
                          : 'No hay notificaciones disponibles'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.tipo);
                    const colorClass = getNotificationColor(notification.tipo);

                    return (
                      <Card
                        key={notification.id}
                        className={`transition-all cursor-pointer hover:shadow-md ${
                          notification.leida ? 'opacity-60' : 'border-l-4 border-l-primary'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold">{notification.titulo}</h3>
                                    {!notification.leida && (
                                      <Badge variant="secondary" className="text-xs">
                                        Nueva
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {notification.tipo}
                                    </Badge>
                                    {notification.entityType && notification.entityId && (
                                      <Badge variant="secondary" className="text-xs">
                                        Click para ver
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{notification.mensaje}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {format(new Date(notification.createdAt), "dd MMM yyyy 'a las' HH:mm", {
                                      locale: es,
                                    })}
                                  </p>
                                </div>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  {!notification.leida && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => markAsRead(notification.id)}
                                      title="Marcar como leída"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteNotification(notification.id)}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
