'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useBranding } from '@/lib/hooks/useBranding';
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
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Star,
  Hotel,
  TrendingUp,
  HardHat,
  Briefcase,
  Calendar,
  MessageSquare,
  Folder,
  BarChart2,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Mapeo de rutas a códigos de módulos para sistema modular
const ROUTE_TO_MODULE: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/home': 'dashboard',
  '/edificios': 'edificios',
  '/unidades': 'unidades',
  '/inquilinos': 'inquilinos',
  '/contratos': 'contratos',
  '/pagos': 'pagos',
  '/mantenimiento': 'mantenimiento',
  '/bi': 'bi',
  '/reportes': 'reportes',
  '/documentos': 'documentos',
  '/room-rental': 'room_rental',
  '/admin/configuracion': 'configuracion',
  '/admin/usuarios': 'usuarios',
  '/admin/modulos': 'configuracion',
};

// Navegación core - Funcionalidades principales
const coreNavItems = [
  { name: 'Inicio', href: '/home', icon: Home, roles: ['administrador', 'gestor', 'operador'] },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['administrador', 'gestor', 'operador'] },
  { name: 'Edificios', href: '/edificios', icon: Building2, roles: ['administrador', 'gestor'] },
  { name: 'Unidades', href: '/unidades', icon: Home, roles: ['administrador', 'gestor'] },
  { name: 'Inquilinos', href: '/inquilinos', icon: Users, roles: ['administrador', 'gestor'] },
  { name: 'Contratos', href: '/contratos', icon: FileText, roles: ['administrador', 'gestor'] },
  { name: 'Pagos', href: '/pagos', icon: CreditCard, roles: ['administrador', 'gestor'] },
  { name: 'Mantenimiento', href: '/mantenimiento', icon: Wrench, roles: ['administrador', 'gestor', 'operador'] },
  { name: 'Calendario', href: '/calendario', icon: Calendar, roles: ['administrador', 'gestor'] },
  { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['administrador', 'gestor'] },
];

// Módulos avanzados
const advancedNavItems = [
  { name: 'Business Intelligence', href: '/bi', icon: FileBarChart, roles: ['administrador', 'gestor'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart2, roles: ['administrador', 'gestor'] },
  { name: 'Reportes', href: '/reportes', icon: FileBarChart, roles: ['administrador', 'gestor'] },
  { name: 'Documentos', href: '/documentos', icon: Folder, roles: ['administrador', 'gestor'] },
  { name: 'Room Rental', href: '/room-rental', icon: Home, roles: ['administrador', 'gestor'] },
];

// Módulos Multi-Vertical
const multiVerticalItems = [
  { name: 'Anuncios STR', href: '/str/listings', icon: Hotel, roles: ['administrador', 'gestor'] },
  { name: 'Reservas STR', href: '/str/bookings', icon: Calendar, roles: ['administrador', 'gestor'] },
  { name: 'Canales STR', href: '/str/channels', icon: BarChart2, roles: ['administrador', 'gestor'] },
  { name: 'House Flipping', href: '/flipping/projects', icon: TrendingUp, roles: ['administrador', 'gestor'] },
  { name: 'Construcción', href: '/construction/projects', icon: HardHat, roles: ['administrador', 'gestor'] },
  { name: 'Servicios Profesionales', href: '/professional/projects', icon: Briefcase, roles: ['administrador', 'gestor'] },
];

// Admin
const adminNavItems = [
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings, roles: ['administrador'] },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Users, roles: ['administrador'] },
  { name: 'Módulos', href: '/admin/modulos', icon: Settings, roles: ['administrador'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession() || {};
  const { role } = usePermissions();
  const { appName, logo } = useBranding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    favorites: true,
    core: true,
    advanced: false,
    multivertical: false,
    admin: false,
  });

  // Cargar módulos activos de la empresa
  useEffect(() => {
    async function loadActiveModules() {
      try {
        const res = await fetch('/api/modules/active');
        if (res.ok) {
          const data = await res.json();
          setActiveModules(data.activeModules || data || []);
        }
      } catch (error) {
        console.error('Error loading active modules:', error);
      } finally {
        setModulesLoaded(true);
      }
    }
    loadActiveModules();
  }, []);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem('sidebar_favorites');
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Guardar favoritos en localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('sidebar_favorites', JSON.stringify(newFavorites));
  };

  // Toggle favorito
  const toggleFavorite = (href: string) => {
    const newFavorites = favorites.includes(href)
      ? favorites.filter(f => f !== href)
      : [...favorites, href];
    saveFavorites(newFavorites);
  };

  // Filtrar items según rol y módulos activos
  const filterItems = (items: any[]) => {
    if (!role || !modulesLoaded) return [];
    
    let filtered = items.filter(item => {
      // Verificar permisos de rol
      if (!item.roles.includes(role)) return false;
      
      // Verificar si el módulo está activo
      const moduleCode = ROUTE_TO_MODULE[item.href];
      if (!moduleCode) return true; // Si no hay mapeo, mostrar por defecto
      
      return activeModules.includes(moduleCode);
    });

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredCoreItems = filterItems(coreNavItems);
  const filteredAdvancedItems = filterItems(advancedNavItems);
  const filteredMultiVerticalItems = filterItems(multiVerticalItems);
  const filteredAdminItems = filterItems(adminNavItems);

  // Obtener items favoritos
  const allItems = [...coreNavItems, ...advancedNavItems, ...multiVerticalItems, ...adminNavItems];
  const favoriteItems = allItems.filter(item => 
    favorites.includes(item.href) && 
    filterItems([item]).length > 0 // Solo mostrar si el item es accesible
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Componente reutilizable para nav items con favoritos
  const NavItem = ({ item, showFavoriteButton = true }: { item: any; showFavoriteButton?: boolean }) => {
    const isActive = pathname?.startsWith(item.href) ?? false;
    const isFavorite = favorites.includes(item.href);

    return (
      <div className="relative group">
        <Link
          href={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm',
            isActive
              ? 'bg-white text-black font-medium'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <item.icon size={18} />
          <span className="flex-1">{item.name}</span>
        </Link>
        {showFavoriteButton && (
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(item.href);
            }}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
              isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
            )}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-black text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[45]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-[50] h-screen w-64 bg-black text-white transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="relative w-full h-12">
              <Image
                src={logo}
                alt={appName}
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{appName}</p>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Buscar página..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-400 hover:text-white mt-2 transition-colors"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* Favorites Section */}
            {favoriteItems.length > 0 && !searchQuery && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('favorites')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Star size={14} fill="currentColor" className="text-yellow-400" />
                    <span>Favoritos</span>
                  </div>
                  {expandedSections.favorites ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.favorites && (
                  <div className="space-y-1 mt-1">
                    {favoriteItems.map((item) => (
                      <NavItem key={item.href} item={item} showFavoriteButton={false} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Core Section */}
            {filteredCoreItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('core')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>Principal</span>
                  {expandedSections.core ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.core && (
                  <div className="space-y-1 mt-1">
                    {filteredCoreItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Advanced Section */}
            {filteredAdvancedItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('advanced')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>Avanzado</span>
                  {expandedSections.advanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.advanced && (
                  <div className="space-y-1 mt-1">
                    {filteredAdvancedItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Multi-Vertical Section */}
            {filteredMultiVerticalItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('multivertical')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>Multi-Vertical</span>
                  {expandedSections.multivertical ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.multivertical && (
                  <div className="space-y-1 mt-1">
                    {filteredMultiVerticalItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin Section */}
            {filteredAdminItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('admin')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>Administración</span>
                  {expandedSections.admin ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.admin && (
                  <div className="space-y-1 mt-1">
                    {filteredAdminItems.map((item) => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No results message */}
            {searchQuery && 
             filteredCoreItems.length === 0 && 
             filteredAdvancedItems.length === 0 && 
             filteredMultiVerticalItems.length === 0 && 
             filteredAdminItems.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No se encontraron páginas</p>
                <p className="text-xs mt-1">Intenta con otro término</p>
              </div>
            )}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            <div className="px-4 py-2 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">Usuario</p>
              <p className="text-sm font-medium truncate">{session?.user?.name || 'Usuario'}</p>
            </div>
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
