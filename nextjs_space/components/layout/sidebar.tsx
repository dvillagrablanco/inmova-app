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
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/hooks/usePermissions';

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

// Navegación core - siempre visible
const coreNavItems = [
  { name: 'Inicio', href: '/home', icon: Home, roles: ['administrador', 'gestor', 'operador'] },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['administrador', 'gestor', 'operador'] },
  { name: 'Edificios', href: '/edificios', icon: Building2, roles: ['administrador', 'gestor'] },
  { name: 'Unidades', href: '/unidades', icon: Home, roles: ['administrador', 'gestor'] },
  { name: 'Inquilinos', href: '/inquilinos', icon: Users, roles: ['administrador', 'gestor'] },
  { name: 'Contratos', href: '/contratos', icon: FileText, roles: ['administrador', 'gestor'] },
  { name: 'Pagos', href: '/pagos', icon: CreditCard, roles: ['administrador', 'gestor'] },
  { name: 'Mantenimiento', href: '/mantenimiento', icon: Wrench, roles: ['administrador', 'gestor', 'operador'] },
];

// Módulos avanzados
const advancedNavItems = [
  { name: 'Business Intelligence', href: '/bi', icon: FileBarChart, roles: ['administrador', 'gestor'] },
  { name: 'Reportes', href: '/reportes', icon: FileBarChart, roles: ['administrador', 'gestor'] },
  { name: 'Documentos', href: '/documentos', icon: FileText, roles: ['administrador', 'gestor'] },
  { name: 'Room Rental', href: '/room-rental', icon: Home, roles: ['administrador', 'gestor'] },
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true,
    advanced: false,
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

  // Filtrar items según rol y módulos activos
  const filterItems = (items: any[]) => {
    if (!role || !modulesLoaded) return [];
    
    return items.filter(item => {
      // Verificar permisos de rol
      if (!item.roles.includes(role)) return false;
      
      // Verificar si el módulo está activo
      const moduleCode = ROUTE_TO_MODULE[item.href];
      if (!moduleCode) return true; // Si no hay mapeo, mostrar por defecto
      
      return activeModules.includes(moduleCode);
    });
  };

  const filteredCoreItems = filterItems(coreNavItems);
  const filteredAdvancedItems = filterItems(advancedNavItems);
  const filteredAdminItems = filterItems(adminNavItems);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                    {filteredCoreItems.map((item) => {
                      const isActive = pathname?.startsWith(item.href) ?? false;
                      return (
                        <Link
                          key={item.href}
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
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
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
                    {filteredAdvancedItems.map((item) => {
                      const isActive = pathname?.startsWith(item.href) ?? false;
                      return (
                        <Link
                          key={item.href}
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
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
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
                    {filteredAdminItems.map((item) => {
                      const isActive = pathname?.startsWith(item.href) ?? false;
                      return (
                        <Link
                          key={item.href}
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
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
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
