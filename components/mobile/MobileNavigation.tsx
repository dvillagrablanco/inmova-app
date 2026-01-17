'use client';

/**
 * NAVEGACIÓN MÓVIL (BOTTOM NAV BAR)
 * Optimizada para uso con el pulgar en dispositivos móviles
 */

import { usePathname, useRouter } from 'next/navigation';
import { Home, Building2, Users, FileText, Settings, Search, Plus, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Inicio',
      icon: Home,
      href: '/dashboard',
      active: pathname === '/dashboard',
    },
    {
      label: 'Propiedades',
      icon: Building2,
      href: '/edificios',
      active: pathname?.startsWith('/edificios'),
    },
    {
      label: 'Añadir',
      icon: Plus,
      href: '#',
      special: true,
      onClick: () => {
        // Menú de creación rápida
        // Aquí se podría abrir un sheet con opciones
      },
    },
    {
      label: 'Inquilinos',
      icon: Users,
      href: '/inquilinos',
      active: pathname?.startsWith('/inquilinos'),
    },
    {
      label: 'Más',
      icon: Menu,
      href: '/configuracion',
      active: pathname?.startsWith('/configuracion'),
    },
  ];

  return (
    <nav
      className={cn(
        'mobile-nav',
        'md:hidden', // Solo visible en móvil
        className
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else if (item.href !== '#') {
                router.push(item.href);
              }
            }}
            className={cn('mobile-nav-item', item.active && 'active', item.special && 'relative')}
          >
            {item.special ? (
              <div className="flex h-14 w-14 -mt-6 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                <Icon className="h-6 w-6 text-white" />
              </div>
            ) : (
              <>
                <Icon className="mobile-nav-icon h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
