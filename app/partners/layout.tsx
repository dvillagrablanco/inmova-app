'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, LayoutDashboard, Users, Mail, Euro, Settings, LogOut } from 'lucide-react';

interface PartnerLayoutProps {
  children: React.ReactNode;
}

export default function PartnerLayout({ children }: PartnerLayoutProps) {
  const pathname = usePathname();

  // Páginas que no necesitan el layout con sidebar
  const publicPages = ['/partners', '/partners/login', '/partners/register', '/partners/accept'];
  const isPublicPage = publicPages.some(
    (page) => pathname === page || pathname?.startsWith('/partners/accept')
  );

  if (isPublicPage) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('partnerToken');
    localStorage.removeItem('partnerData');
    window.location.href = '/partners/login';
  };

  const menuItems = [
    { href: '/partners/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/partners/clients', icon: Users, label: 'Clientes' },
    { href: '/partners/invitations', icon: Mail, label: 'Invitaciones' },
    { href: '/partners/commissions', icon: Euro, label: 'Comisiones' },
    { href: '/partners/settings', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/partners/dashboard" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">INMOVA</h1>
              <p className="text-xs text-gray-500">Portal Partners</p>
            </div>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
