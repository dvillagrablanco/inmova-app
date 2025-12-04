'use client';

import { useSession, signOut } from 'next-auth/react';
import { Bell, User, LogOut, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { EnhancedGlobalSearch } from '@/components/ui/enhanced-global-search';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBranding } from '@/lib/hooks/useBranding';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '@/components/LanguageSelector';
import logger, { logError } from '@/lib/logger';

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

export function Header() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { appName } = useBranding();

  const user = session?.user as any;
  const companyName = user?.companyName || appName;
  const userName = user?.name || 'Usuario';
  const userRole = user?.role || 'gestor';

  const fetchNotifications = async () => {
    if (session) {
      try {
        const res = await fetch('/api/notifications?onlyUnread=true&generate=true');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || data || []);
        }
      } catch (error) {
        logger.error('Error fetching notifications:', error);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [session]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      // Validar que la notificación tenga la estructura esperada
      if (!notif || !notif.id) {
        logger.error('Notificación inválida:', notif);
        return;
      }

      // Marcar como leída
      await markAsRead(notif.id);
      
      // Cerrar el dropdown
      setShowNotifications(false);
      
      // Navegar según el tipo de notificación
      if (notif.entityType && notif.entityId) {
        switch (notif.entityType) {
          case 'contract':
          case 'contrato':
            router.push(`/contratos/${notif.entityId}`);
            break;
          case 'payment':
          case 'pago':
            router.push(`/pagos`);
            break;
          case 'maintenance':
          case 'mantenimiento':
            router.push(`/mantenimiento/${notif.entityId}`);
            break;
          case 'tenant':
          case 'inquilino':
            router.push(`/inquilinos/${notif.entityId}`);
            break;
          case 'unit':
          case 'unidad':
            router.push(`/unidades/${notif.entityId}`);
            break;
          case 'building':
          case 'edificio':
            router.push(`/edificios/${notif.entityId}`);
            break;
          default:
            // Si no hay entidad específica, ir a la página de notificaciones
            router.push('/notificaciones');
        }
      } else {
        // Si no hay entidad, ir a la página de notificaciones
        router.push('/notificaciones');
      }
    } catch (error) {
      logger.error('Error al procesar notificación:', error);
      // En caso de error, al menos cerrar el dropdown
      setShowNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
      fetchNotifications();
      setShowNotifications(false);
    } catch (error) {
      logger.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; variant: any }> = {
      administrador: { label: 'Admin', variant: 'destructive' },
      gestor: { label: 'Gestor', variant: 'default' },
      operador: { label: 'Operador', variant: 'secondary' },
    };
    return roles[role] || roles.gestor;
  };

  const roleBadge = getRoleBadge(userRole);

  return (
    <header className="sticky top-0 z-20 border-b bg-background shadow-sm">
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6 lg:ml-64">
        {/* Empresa Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">{companyName}</span>
              <span className="text-xs text-muted-foreground">Gestión Inmobiliaria</span>
            </div>
          </div>
        </div>

        {/* Global Search */}
        <div className="hidden flex-1 md:flex md:max-w-md">
          <EnhancedGlobalSearch />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"}
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white" aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            
            {showNotifications && (
              <>
                {/* Overlay */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Dropdown */}
                <div className="absolute right-0 top-12 z-40 w-96 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
                  <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                    <h3 className="font-semibold">Notificaciones</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Marcar todas como leídas
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay notificaciones nuevas</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                            !notif.leida && 'bg-blue-50'
                          )}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <p className="font-medium text-sm">{notif.titulo}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.mensaje}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notif.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t bg-gray-50 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        router.push('/notificaciones');
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Language Selector */}
          <LanguageSelector />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 pl-2 pr-3 h-10"
                aria-label={`Menú de usuario: ${userName}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">{userName}</span>
                  <Badge variant={roleBadge.variant} className="text-[9px] h-3.5 px-1.5 leading-none">
                    {roleBadge.label}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs font-medium text-primary">{companyName}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/configuracion')}>
                <Building2 className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
