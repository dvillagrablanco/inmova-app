'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Receipt,
  Wrench,
  MessageSquare,
  Building2,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { href: '/portal-propietario/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal-propietario/propiedades', label: 'Propiedades', icon: Building2 },
  { href: '/portal-propietario/contratos', label: 'Contratos', icon: FileText },
  { href: '/portal-propietario/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/portal-propietario/liquidaciones', label: 'Liquidaciones', icon: Receipt },
  { href: '/portal-propietario/incidencias', label: 'Incidencias', icon: Wrench },
  { href: '/portal-propietario/comunicacion', label: 'Comunicación', icon: MessageSquare },
  { href: '/portal-propietario/informe-mensual', label: 'Informe Mensual', icon: BarChart3 },
];

export default function PortalPropietarioLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-14 items-center px-4 md:px-6">
          <h1 className="text-lg font-semibold">Portal Propietario - Inmova</h1>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden w-56 shrink-0 border-r bg-background md:block">
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-6 md:p-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t bg-background md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label.split(' ')[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
