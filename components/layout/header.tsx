'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, Building2 } from 'lucide-react';
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
import { useBranding } from '@/lib/hooks/useBranding';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ExternalPortalsNotifications } from '@/components/admin/external-portals-notifications';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import NotificationCenter from '@/components/NotificationCenter';

export function Header() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { appName } = useBranding();

  const user = session?.user as any;
  const companyName = user?.companyName || appName;
  const userName = user?.name || 'Usuario';
  const userRole = user?.role || 'gestor';

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
      <div className="flex h-14 items-center justify-between gap-2 pl-16 pr-3 md:gap-4 md:pl-3 md:pr-6 lg:ml-64 lg:pl-6">
        {/* Empresa Info - Oculta en móvil para ahorrar espacio */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">{companyName}</span>
              <span className="text-xs text-muted-foreground">Gestión Inmobiliaria</span>
            </div>
          </div>
        </div>

        {/* Logo/Nombre en móvil */}
        <div className="flex items-center md:hidden">
          <span className="text-sm font-semibold text-primary">{appName}</span>
        </div>

        {/* Global Search - Responsive */}
        <div className="hidden flex-1 md:flex md:max-w-md">
          <EnhancedGlobalSearch />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Notifications Center - Enhanced with real-time notifications */}
          <NotificationCenter />

          {/* External Portals Notifications (Super Admin only) */}
          <ExternalPortalsNotifications />

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
                  <Badge
                    variant={roleBadge.variant}
                    className="text-[9px] h-3.5 px-1.5 leading-none"
                  >
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
