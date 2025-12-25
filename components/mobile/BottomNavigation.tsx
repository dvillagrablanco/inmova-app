'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, FileText, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/home',
    icon: <Home className="h-5 w-5" />
  },
  {
    id: 'buildings',
    label: 'Edificios',
    href: '/edificios',
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 'contracts',
    label: 'Contratos',
    href: '/contratos',
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: 'analytics',
    label: 'Reportes',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    id: 'settings',
    label: 'Más',
    href: '/configuracion',
    icon: <Settings className="h-5 w-5" />
  }
];

export function BottomNavigation() {
  const pathname = usePathname();

  // No mostrar en páginas de autenticación
  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/api/')
  ) {
    return null;
  }

  return (
    <nav className="bottom-nav lg:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'bottom-nav-item',
              isActive && 'active'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
