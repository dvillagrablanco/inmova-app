'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Building2, Users, CreditCard, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Sidebar } from './sidebar';

/**
 * Navegación inferior para móviles
 * Muestra los enlaces principales de manera accesible en pantallas pequeñas
 */

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

// Navegación principal móvil - optimizada para las funcionalidades más usadas
const mainNavItems: NavItem[] = [
  { label: 'Inicio', icon: Home, href: '/dashboard' },
  { label: 'Propiedades', icon: Building2, href: '/edificios' },
  { label: 'Inquilinos', icon: Users, href: '/inquilinos' },
  { label: 'Pagos', icon: CreditCard, href: '/pagos' },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // No mostrar en desktop o en páginas de autenticación
  if (
    !isMobile ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname === '/'
  ) {
    return null;
  }

  return (
    <>
      {/* Espaciador para evitar que el contenido quede oculto bajo la navegación */}
      <div className="h-16 md:hidden" />

      {/* Barra de navegación inferior */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg md:hidden"
        role="navigation"
        aria-label="Navegación principal móvil"
      >
        <div className="flex h-16 items-center justify-around px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors',
                  'active:scale-95 active:bg-muted',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className={cn('h-5 w-5', isActive && 'animate-in zoom-in-50')} />
                  {item.badge && item.badge > 0 && (
                    <span
                      className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
                      aria-label={`${item.badge} notificaciones`}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Botón de menú para acceder al sidebar completo */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground active:scale-95 active:bg-muted"
                aria-label="Abrir menú completo"
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs font-medium">Menú</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menú de navegación</SheetTitle>
              </SheetHeader>
              <Sidebar onNavigate={() => setIsMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
