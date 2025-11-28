'use client';

import { useSession, signOut } from 'next-auth/react';
import { Bell, User, LogOut, Building2 } from 'lucide-react';
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
import { GlobalSearch } from '@/components/ui/global-search';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const user = session?.user as any;
  const companyName = user?.companyName || 'INMOVA';
  const userName = user?.name || 'Usuario';
  const userRole = user?.role || 'gestor';

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (session) {
        try {
          const res = await fetch('/api/notifications');
          if (res.ok) {
            const notifications = await res.json();
            const count = notifications.filter((n: any) => !n.leida).length;
            setUnreadCount(count);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };

    fetchUnreadCount();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [session]);

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
    <header className="sticky top-0 z-10 border-b bg-background shadow-sm">
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
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
          <GlobalSearch />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            onClick={() => router.push('/notificaciones')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 h-10">
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
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
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
