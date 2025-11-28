'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  CreditCard,
  Wrench,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Folder,
  UsersRound,
  DollarSign,
  UserPlus,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Edificios', href: '/edificios', icon: Building2 },
  { name: 'Unidades', href: '/unidades', icon: Home },
  { name: 'Inquilinos', href: '/inquilinos', icon: Users },
  { name: 'Candidatos', href: '/candidatos', icon: UserPlus },
  { name: 'Contratos', href: '/contratos', icon: FileText },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  { name: 'Mantenimiento', href: '/mantenimiento', icon: Wrench },
  { name: 'Documentos', href: '/documentos', icon: Folder },
  { name: 'Proveedores', href: '/proveedores', icon: UsersRound },
  { name: 'Gastos', href: '/gastos', icon: DollarSign },
  { name: 'Reportes', href: '/reportes', icon: FileBarChart },
];

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?onlyUnread=true');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Top bar for notifications and search */}
      <div className="lg:ml-64 fixed top-0 right-0 left-0 lg:left-64 z-30 bg-white border-b h-16 flex items-center justify-end px-6 gap-4">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Search size={20} />
          </button>
          {showSearch && (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border p-4 max-h-96 overflow-y-auto">
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
              {searchResults && (
                <div className="mt-4 space-y-2">
                  {searchResults.buildings?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Edificios</p>
                      {searchResults.buildings.map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/edificios/${item.id}`}
                          onClick={() => setShowSearch(false)}
                          className="block p-2 hover:bg-gray-50 rounded text-sm"
                        >
                          {item.nombre}
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.tenants?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Inquilinos</p>
                      {searchResults.tenants.map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/inquilinos/${item.id}`}
                          onClick={() => setShowSearch(false)}
                          className="block p-2 hover:bg-gray-50 rounded text-sm"
                        >
                          {item.nombreCompleto}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {unreadCount}
              </Badge>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
              <div className="divide-y">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay notificaciones nuevas</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 cursor-pointer',
                        !notif.leida && 'bg-blue-50'
                      )}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <p className="font-medium text-sm">{notif.titulo}</p>
                      <p className="text-xs text-gray-600 mt-1">{notif.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-black text-white transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="relative w-full h-12">
              <Image
                src="/vidaro-logo-cover.jpg"
                alt="INMOVA"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">INMOVA</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href) ?? false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-white text-black font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
