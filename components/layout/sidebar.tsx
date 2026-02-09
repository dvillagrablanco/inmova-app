'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useBranding } from '@/lib/hooks/useBranding';
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Star,
  Loader2,
  Settings,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import logger, { logError } from '@/lib/logger';
import { safeLocalStorage } from '@/lib/safe-storage';
import { toggleMobileMenu, closeMobileMenu } from '@/lib/mobile-menu';
import {
  getInitialExpandedSections,
  getSectionName,
  getSectionOrder,
  type UserRole,
  type BusinessVertical,
} from './sidebar-config';
import { HIDDEN_ROUTES } from '@/lib/active-modules-config';
import { CompanySelector } from './CompanySelector';
import { useSelectedCompany } from '@/lib/hooks/admin/useSelectedCompany';
import {
  ROUTE_TO_MODULE,
  CORE_MODULES,
  dashboardNavItems,
  alquilerResidencialItems,
  strNavItems,
  coLivingNavItems,
  buildToRentNavItems,
  flippingNavItems,
  construccionNavItems,
  ewoorkerNavItems,
  comercialNavItems,
  alquilerComercialNavItems,
  adminFincasItems,
  studentHousingNavItems,
  viajesCorporativosNavItems,
  viviendaSocialNavItems,
  realEstateDeveloperNavItems,
  workspaceNavItems,
  warehouseNavItems,
  finanzasNavItems,
  analyticsNavItems,
  operacionesNavItems,
  herramientasInversionNavItems,
  comunicacionesNavItems,
  documentosLegalNavItems,
  crmMarketingNavItems,
  automatizacionNavItems,
  innovacionNavItems,
  soporteNavItems,
  operadorNavItems,
  administradorEmpresaItems,
  superAdminPlatformItems,
  type SidebarItem,
} from './sidebar-data';

interface SidebarProps {
  onNavigate?: () => void; // Callback cuando se navega a una ruta (útil para cerrar modals en mobile)
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { role } = usePermissions();
  const { appName, logo } = useBranding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [primaryVertical, setPrimaryVertical] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hook para empresa seleccionada (Super Admin)
  const { selectedCompany, selectCompany: handleCompanySelect } = useSelectedCompany();

  // Módulos activos de la empresa seleccionada (para Super Admin)
  const [selectedCompanyModules, setSelectedCompanyModules] = useState<string[]>([]);

  // Cargar vertical principal de la empresa
  useEffect(() => {
    async function loadCompanyVertical() {
      try {
        const res = await fetch('/api/company/vertical');
        if (res.ok) {
          const data = await res.json();
          setPrimaryVertical(data.vertical);
        }
      } catch (error) {
        logger.error('Error loading company vertical:', error);
      }
    }
    loadCompanyVertical();
  }, []);

  // Inicializar estado expandido basado en rol y vertical
  useEffect(() => {
    if (!role || isInitialized) return;

    try {
      // Intentar cargar preferencias del usuario desde localStorage
      const storedExpanded = safeLocalStorage.getItem('sidebar_expanded_sections');

      if (storedExpanded) {
        // Usuario tiene preferencias guardadas
        setExpandedSections(JSON.parse(storedExpanded));
      } else {
        // Primera vez: usar configuración por defecto según rol
        const initialState = getInitialExpandedSections(
          role as UserRole,
          primaryVertical as BusinessVertical
        );
        setExpandedSections(initialState);
      }

      setIsInitialized(true);
    } catch (error) {
      logger.error('Error initializing expanded sections:', error);
      // Fallback a estado vacío (todo colapsado)
      setExpandedSections({
        favorites: true,
        dashboard: true,
      });
      setIsInitialized(true);
    }
  }, [role, primaryVertical, isInitialized]);

  // Persistir posición de scroll de forma segura - mejorado para restaurar después de navegación
  useEffect(() => {
    try {
      const sidebar = document.querySelector('[data-sidebar-nav]');
      if (sidebar) {
        // Restaurar scroll con un pequeño delay para asegurar que el DOM está listo
        const restoreScroll = () => {
          const savedScroll = safeLocalStorage.getItem('sidebar_scroll_position');
          if (savedScroll) {
            const scrollValue = parseInt(savedScroll, 10);
            // Usar requestAnimationFrame para asegurar que el scroll se aplica después del render
            requestAnimationFrame(() => {
              sidebar.scrollTop = scrollValue;
            });
          }
        };

        // Restaurar inmediatamente y también después de un pequeño delay
        restoreScroll();
        const timeoutId = setTimeout(restoreScroll, 100);

        const handleScroll = () => {
          try {
            safeLocalStorage.setItem('sidebar_scroll_position', sidebar.scrollTop.toString());
          } catch (err) {
            // Ignorar errores de storage
          }
        };

        sidebar.addEventListener('scroll', handleScroll);
        return () => {
          sidebar.removeEventListener('scroll', handleScroll);
          clearTimeout(timeoutId);
        };
      }
    } catch (error) {
      logger.error('Error setting up scroll persistence:', error);
    }
  }, [pathname]); // Añadir pathname como dependencia para restaurar después de navegación

  // Cargar módulos activos de la empresa del usuario actual
  useEffect(() => {
    async function loadActiveModules() {
      try {
        const res = await fetch('/api/modules/active');
        if (res.ok) {
          const data = await res.json();
          // Asegurar que siempre sea un array
          const modules = Array.isArray(data.activeModules)
            ? data.activeModules
            : Array.isArray(data)
              ? data
              : [];
          setActiveModules(modules);
        }
      } catch (error) {
        logger.error('Error loading active modules:', error);
      } finally {
        setModulesLoaded(true);
      }
    }
    loadActiveModules();
  }, []);

  // Cargar módulos de la empresa seleccionada (Solo para Super Admin)
  useEffect(() => {
    async function loadSelectedCompanyModules() {
      if (!selectedCompany || role !== 'super_admin') {
        setSelectedCompanyModules([]);
        return;
      }

      try {
        const res = await fetch(`/api/modules/active?companyId=${selectedCompany.id}`);
        if (res.ok) {
          const data = await res.json();
          // Asegurar que siempre sea un array
          const modules = Array.isArray(data.activeModules) ? data.activeModules : [];
          setSelectedCompanyModules(modules);
          logger.info('Módulos de empresa seleccionada cargados', {
            companyId: selectedCompany.id,
            modulesCount: modules.length,
          });
        }
      } catch (error) {
        logger.error('Error loading selected company modules:', error);
        setSelectedCompanyModules([]);
      }
    }
    loadSelectedCompanyModules();
  }, [selectedCompany, role]);

  // Cargar favoritos desde localStorage de forma segura
  useEffect(() => {
    try {
      const storedFavorites = safeLocalStorage.getItem('sidebar_favorites');
      if (storedFavorites) {
        const parsed = JSON.parse(storedFavorites);
        // Asegurar que siempre sea un array
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      logger.error('Error loading favorites:', error);
      // Continuar con favoritos vacíos
    }
  }, []);

  // Prevenir scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Agregar clase para prevenir scroll
      document.body.classList.add('sidebar-open');

      // Guardar el scroll actual
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;

      return () => {
        // Remover clase y restaurar scroll
        document.body.classList.remove('sidebar-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobileMenuOpen]);

  // Cerrar menú con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Guardar favoritos en localStorage de forma segura
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    try {
      safeLocalStorage.setItem('sidebar_favorites', JSON.stringify(newFavorites));
    } catch (error) {
      logger.error('Error saving favorites:', error);
      // Los favoritos siguen funcionando en memoria
    }
  };

  // Toggle favorito
  const toggleFavorite = (href: string) => {
    const newFavorites = favorites.includes(href)
      ? favorites.filter((f) => f !== href)
      : [...favorites, href];
    saveFavorites(newFavorites);
  };

  // Filtrar items según rol y módulos activos
  // skipModuleCheck: true para items de plataforma que no dependen de módulos de empresa
  const filterItems = (
    items: SidebarItem[],
    useSelectedCompanyModules: boolean = false,
    skipModuleCheck: boolean = false
  ) => {
    // Validación: Si no hay rol, retornar vacío
    if (!role) return [];

    // Para items que no requieren verificación de módulos (ej: superAdminPlatformItems),
    // no esperar a que los módulos estén cargados
    if (!skipModuleCheck && !modulesLoaded) return [];

    // Validación: Si items no es un array válido
    if (!Array.isArray(items) || items.length === 0) return [];

    // Determinar qué módulos usar para filtrar
    // Si es super_admin con empresa seleccionada y useSelectedCompanyModules es true,
    // usar los módulos de la empresa seleccionada
    const modulesToCheck =
      useSelectedCompanyModules &&
      role === 'super_admin' &&
      selectedCompany &&
      Array.isArray(selectedCompanyModules) &&
      selectedCompanyModules.length > 0
        ? selectedCompanyModules
        : Array.isArray(activeModules)
          ? activeModules
          : [];

    let filtered = items.filter((item) => {
      // Validación: item debe tener roles
      if (!item || !Array.isArray(item.roles)) return false;

      // NUEVO: Filtrar rutas ocultas (placeholders no funcionales)
      if (HIDDEN_ROUTES.includes(item.href)) return false;

      // Verificar permisos de rol
      if (!item.roles.includes(role)) return false;

      // Si skipModuleCheck es true, no verificar módulos activos
      if (skipModuleCheck) return true;

      // Verificar si el módulo está activo
      const moduleCode = ROUTE_TO_MODULE[item.href];
      if (!moduleCode) return true; // Si no hay mapeo, mostrar por defecto

      // Los módulos core siempre se muestran (esCore: true)
      if (CORE_MODULES.includes(moduleCode)) return true;

      return modulesToCheck.includes(moduleCode);
    });

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return item && item.name && item.name.toLowerCase().includes(query);
      });
    }

    return filtered;
  };

  // Filtrar items por rol y módulos activos
  const filteredDashboardItems = filterItems(dashboardNavItems);

  // Verticales de Negocio - Usar módulos de empresa seleccionada si hay una (Super Admin)
  const useCompanyModules = role === 'super_admin' && !!selectedCompany;
  const filteredAlquilerResidencialItems = filterItems(alquilerResidencialItems, useCompanyModules);
  const filteredStrItems = filterItems(strNavItems, useCompanyModules);
  const filteredCoLivingItems = filterItems(coLivingNavItems, useCompanyModules);
  const filteredBuildToRentItems = filterItems(buildToRentNavItems, useCompanyModules);
  const filteredFlippingItems = filterItems(flippingNavItems, useCompanyModules);
  const filteredConstruccionItems = filterItems(construccionNavItems, useCompanyModules);
  const filteredEwoorkerItems = filterItems(ewoorkerNavItems, useCompanyModules);
  const filteredComercialItems = filterItems(comercialNavItems, useCompanyModules);
  const filteredAlquilerComercialItems = filterItems(alquilerComercialNavItems, useCompanyModules);
  const filteredAdminFincasItems = filterItems(adminFincasItems, useCompanyModules);
  const filteredStudentHousingItems = filterItems(studentHousingNavItems, useCompanyModules);
  const filteredViajesCorporativosItems = filterItems(
    viajesCorporativosNavItems,
    useCompanyModules
  );
  const filteredViviendaSocialItems = filterItems(viviendaSocialNavItems, useCompanyModules);
  const filteredRealEstateDeveloperItems = filterItems(
    realEstateDeveloperNavItems,
    useCompanyModules
  );
  const filteredWorkspaceItems = filterItems(workspaceNavItems, useCompanyModules);
  const filteredWarehouseItems = filterItems(warehouseNavItems, useCompanyModules);

  // Herramientas Horizontales - Usar módulos de empresa seleccionada si hay una (Super Admin)
  const filteredFinanzasItems = filterItems(finanzasNavItems, useCompanyModules);
  const filteredAnalyticsItems = filterItems(analyticsNavItems, useCompanyModules);
  const filteredOperacionesItems = filterItems(operacionesNavItems, useCompanyModules);
  const filteredHerramientasInversionItems = filterItems(
    herramientasInversionNavItems,
    useCompanyModules
  );
  const filteredComunicacionesItems = filterItems(comunicacionesNavItems, useCompanyModules);
  const filteredDocumentosLegalItems = filterItems(documentosLegalNavItems, useCompanyModules);
  const filteredCrmMarketingItems = filterItems(crmMarketingNavItems, useCompanyModules);
  const filteredAutomatizacionItems = filterItems(automatizacionNavItems, useCompanyModules);
  const filteredInnovacionItems = filterItems(innovacionNavItems, useCompanyModules);
  const filteredSoporteItems = filterItems(soporteNavItems, useCompanyModules);

  // Roles Específicos
  const filteredOperadorItems = filterItems(operadorNavItems);

  // Administración
  const filteredAdministradorEmpresaItems = filterItems(administradorEmpresaItems);
  // Items de plataforma para super_admin - NO dependen de módulos de empresa
  const filteredSuperAdminPlatformItems = filterItems(superAdminPlatformItems, false, true);

  // Obtener items favoritos de todas las secciones
  const allItems = [
    ...dashboardNavItems,
    // Verticales
    ...alquilerResidencialItems,
    ...strNavItems,
    ...coLivingNavItems,
    ...buildToRentNavItems,
    ...flippingNavItems,
    ...construccionNavItems,
    ...comercialNavItems,
    ...alquilerComercialNavItems,
    ...adminFincasItems,
    // Herramientas Horizontales
    ...finanzasNavItems,
    ...analyticsNavItems,
    ...operacionesNavItems,
    ...herramientasInversionNavItems,
    ...comunicacionesNavItems,
    ...documentosLegalNavItems,
    ...crmMarketingNavItems,
    ...automatizacionNavItems,
    ...innovacionNavItems,
    ...soporteNavItems,
    // Roles específicos
    ...operadorNavItems,
    // Administración
    ...administradorEmpresaItems,
    ...superAdminPlatformItems,
  ];

  // Validación: Filtrar favoritos de forma segura
  const favoriteItems =
    favorites.length > 0 && allItems.length > 0
      ? allItems.filter((item) => {
          try {
            return (
              item && item.href && favorites.includes(item.href) && filterItems([item]).length > 0
            );
          } catch (error) {
            logger.error('Error filtering favorite item:', error);
            return false;
          }
        })
      : [];

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newState = { ...prev, [section]: !prev[section] };
      try {
        safeLocalStorage.setItem('sidebar_expanded_sections', JSON.stringify(newState));
      } catch (error) {
        logger.error('Error saving expanded sections:', error);
        // Las secciones siguen funcionando en memoria
      }
      return newState;
    });
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Componente reutilizable para nav items con favoritos
  const NavItem = ({
    item,
    showFavoriteButton = true,
  }: {
    item: SidebarItem;
    showFavoriteButton?: boolean;
  }) => {
    const isActive = pathname?.startsWith(item.href) ?? false;
    const isFavorite = favorites.includes(item.href);

    return (
      <div className="relative group">
        <Link
          href={item.href}
          prefetch={true}
          onClick={() => {
            // Cerrar el menú móvil
            setIsMobileMenuOpen(false);
            onNavigate?.();
          }}
          data-tour={item.dataTour || undefined}
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
              e.stopPropagation();
              toggleFavorite(item.href);
            }}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10',
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

  // Componente para nav items con submenús (Super Admin)
  // Ahora acepta companyId opcional para parametrizar URLs
  const NavItemWithSubs = ({ item, companyId }: { item: SidebarItem; companyId?: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Función para añadir companyId a URLs
    const appendCompanyId = (href: string): string => {
      if (!companyId) return href;
      return href.includes('?')
        ? `${href}&companyId=${companyId}`
        : `${href}?companyId=${companyId}`;
    };

    const itemHref = appendCompanyId(item.href);
    const isActive = pathname?.startsWith(item.href) ?? false;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    // Auto-expandir si algún subitem está activo
    useEffect(() => {
      if (hasSubItems && item.subItems?.some((sub) => pathname?.startsWith(sub.href))) {
        setIsExpanded(true);
      }
    }, [pathname, hasSubItems, item.subItems]);

    if (!hasSubItems) {
      return <NavItem item={{ ...item, href: itemHref }} showFavoriteButton={false} />;
    }

    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm w-full',
            isActive
              ? 'bg-gray-800 text-white font-medium'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <item.icon size={18} />
          <span className="flex-1 text-left">{item.name}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1 border-l border-gray-700 pl-2">
            {item.subItems?.map((subItem) => {
              const subItemHref = appendCompanyId(subItem.href);
              const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href);
              return (
                <Link
                  key={subItem.href}
                  href={subItemHref}
                  prefetch={true}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate?.();
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-xs',
                    isSubActive
                      ? 'bg-white text-black font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  {subItem.icon ? (
                    <subItem.icon size={14} className="opacity-70" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                  )}
                  {subItem.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button - Fixed en la parte superior izquierda */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-3 left-3 z-[100] p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-2xl hover:shadow-indigo-600/90 active:scale-95 transition-all duration-200 border-2 border-white/30 backdrop-blur-md touch-manipulation flex items-center justify-center"
        style={{ backgroundColor: 'rgba(79, 70, 229, 0.95)', minWidth: '52px', minHeight: '52px' }}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? (
          <X size={26} strokeWidth={2.5} />
        ) : (
          <Menu size={26} strokeWidth={2.5} />
        )}
      </button>

      {/* Overlay for mobile - Cubre toda la pantalla excepto el botón */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 z-[80] backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Visible en desktop, toggle en mobile */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-[90] h-screen w-[85vw] max-w-[320px] sm:w-64 lg:w-64',
          'bg-black text-white overflow-hidden transition-transform duration-300 ease-in-out',
          // Desktop: siempre visible
          'lg:translate-x-0',
          // Mobile: toggle con menu
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          maxHeight: '100vh',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
        aria-label="Navegación principal"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="relative w-full h-12">
              <Image src={logo} alt={appName} fill className="object-contain" priority />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{appName}</p>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
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

          {/* Navigation - Mejorado para scroll en móviles */}
          <nav
            className="flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain"
            data-sidebar-nav
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
            }}
          >
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
                  {expandedSections.favorites ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.favorites && (
                  <div className="space-y-1 mt-1">
                    {favoriteItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Section */}
            {filteredDashboardItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('dashboard')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏠 Inicio</span>
                  {expandedSections.dashboard ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.dashboard && (
                  <div className="space-y-1 mt-1">
                    {filteredDashboardItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SUPER ADMIN - GESTIÓN DE PLATAFORMA (PRIMERO para Super Admin) */}
            {/* ============================================================== */}
            {filteredSuperAdminPlatformItems.length > 0 && role === 'super_admin' && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    ⚡ Gestión de Plataforma
                  </h3>
                </div>
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('superAdminPlatform')}
                    className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-indigo-300 uppercase hover:text-white transition-colors"
                  >
                    <span>🌐 Plataforma Global</span>
                    {expandedSections.superAdminPlatform ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedSections.superAdminPlatform && (
                    <div className="space-y-1 mt-1">
                      {filteredSuperAdminPlatformItems.map((item) => (
                        <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* SELECTOR DE EMPRESA Y GESTIÓN (Para Super Admin) */}
            {/* ============================================================== */}
            {role === 'super_admin' && filteredAdministradorEmpresaItems.length > 0 && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    🏢 Gestión de Empresas
                  </h3>
                  <p className="text-[9px] text-gray-500 mt-1">
                    Selecciona una empresa para configurar
                  </p>
                </div>

                {/* Selector de Empresa */}
                <div className="mb-4 px-2">
                  <CompanySelector
                    onCompanyChange={(company) => {
                      // Auto-expandir la sección cuando se selecciona empresa
                      if (company) {
                        setExpandedSections((prev) => ({
                          ...prev,
                          administradorEmpresa: true,
                        }));
                      }
                    }}
                  />
                </div>

                {/* Gestión de Empresa - Solo visible cuando hay empresa seleccionada */}
                {selectedCompany && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSection('administradorEmpresa')}
                      className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-emerald-300 uppercase hover:text-white transition-colors"
                    >
                      <span>
                        ⚙️ Configurar: {selectedCompany.nombre.substring(0, 15)}
                        {selectedCompany.nombre.length > 15 ? '...' : ''}
                      </span>
                      {expandedSections.administradorEmpresa ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {expandedSections.administradorEmpresa && (
                      <div className="space-y-1 mt-1">
                        {filteredAdministradorEmpresaItems.map((item) => (
                          <NavItemWithSubs
                            key={item.href}
                            item={item as SidebarItem}
                            companyId={selectedCompany.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje cuando no hay empresa seleccionada */}
                {!selectedCompany && (
                  <div className="mx-2 mb-4 p-3 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
                    <p className="text-xs text-gray-400 text-center">
                      Selecciona una empresa para ver las opciones de configuración
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ============================================================== */}
            {/* EXPLOTACIÓN DE ACTIVOS (Inversión/Rendimiento) */}
            {/* ============================================================== */}
            {(filteredAlquilerResidencialItems.length > 0 ||
              filteredStrItems.length > 0 ||
              filteredCoLivingItems.length > 0 ||
              filteredBuildToRentItems.length > 0 ||
              filteredFlippingItems.length > 0 ||
              filteredComercialItems.length > 0 ||
              filteredAlquilerComercialItems.length > 0 ||
              filteredWarehouseItems.length > 0 ||
              filteredViviendaSocialItems.length > 0) &&
              (role === 'administrador' || (role === 'super_admin' && selectedCompany)) && (
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      selectedCompany ? 'text-blue-400' : 'text-gray-500'
                    )}
                  >
                    💰 Explotación de Activos
                  </h3>
                  <p className="text-[8px] text-gray-500 mt-0.5">Inversión / Rendimiento</p>
                  {/* Mostrar empresa seleccionada para Super Admin */}
                  {role === 'super_admin' && selectedCompany && (
                    <p className="text-[9px] text-blue-500 mt-1">
                      Empresa: {selectedCompany.nombre}
                    </p>
                  )}
                </div>
              )}

            {/* 1. LIVING RESIDENCIAL (Alquiler + Coliving + Student Housing) */}
            {(filteredAlquilerResidencialItems.length > 0 ||
              filteredCoLivingItems.length > 0 ||
              filteredStudentHousingItems.length > 0) && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('alquilerResidencial')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏠 Living Residencial</span>
                  {expandedSections.alquilerResidencial ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.alquilerResidencial && (
                  <div className="space-y-1 mt-1">
                    {/* Alquiler Tradicional */}
                    {filteredAlquilerResidencialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Coliving / Habitaciones */}
                    {filteredCoLivingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">
                        Coliving
                      </div>
                    )}
                    {filteredCoLivingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Student Housing */}
                    {filteredStudentHousingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">
                        Student Housing
                      </div>
                    )}
                    {filteredStudentHousingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. ALQUILER TURÍSTICO CORTA ESTANCIA (STR) */}
            {filteredStrItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('str')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏖️ Alquiler Turístico (STR)</span>
                  {expandedSections.str ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.str && (
                  <div className="space-y-1 mt-1">
                    {filteredStrItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Coliving y Student Housing en Living Residencial, Workspace en Comercial */}

            {/* 4. CONSTRUCCIÓN / PROMOCIÓN */}
            {(filteredBuildToRentItems.length > 0 ||
              filteredFlippingItems.length > 0 ||
              filteredConstruccionItems.length > 0 ||
              filteredEwoorkerItems.length > 0 ||
              filteredRealEstateDeveloperItems.length > 0) && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('construccion')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏗️ Construcción / Promoción</span>
                  {expandedSections.construccion ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.construccion && (
                  <div className="space-y-1 mt-1">
                    {/* Proyectos de Obra */}
                    {filteredConstruccionItems.length > 0 && (
                      <div className="ml-2 mt-1 mb-1 text-[9px] text-gray-500 uppercase">
                        Obra Nueva / Reformas
                      </div>
                    )}
                    {filteredConstruccionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredBuildToRentItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Flipping */}
                    {filteredFlippingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">
                        House Flipping
                      </div>
                    )}
                    {filteredFlippingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Promociones Inmobiliarias */}
                    {filteredRealEstateDeveloperItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">
                        Promociones
                      </div>
                    )}
                    {filteredRealEstateDeveloperItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* eWoorker - Marketplace B2B */}
                    {filteredEwoorkerItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-amber-500 uppercase">
                        🔧 eWoorker (B2B)
                      </div>
                    )}
                    {filteredEwoorkerItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. INMUEBLES COMERCIALES (Oficinas + Locales + Naves/Logística + Workspace) */}
            {(filteredComercialItems.length > 0 ||
              filteredAlquilerComercialItems.length > 0 ||
              filteredWarehouseItems.length > 0 ||
              filteredWorkspaceItems.length > 0) && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('comercial')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏢 Inmuebles Comerciales</span>
                  {expandedSections.comercial ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.comercial && (
                  <div className="space-y-1 mt-1">
                    {/* Servicios Profesionales */}
                    {filteredComercialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Oficinas, Locales, Naves */}
                    {filteredAlquilerComercialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Naves y Logística */}
                    {filteredWarehouseItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">
                        Logística / Almacenes
                      </div>
                    )}
                    {filteredWarehouseItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {/* Workspace / Coworking */}
                    {filteredWorkspaceItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[9px] text-gray-500 uppercase">
                        Workspace
                      </div>
                    )}
                    {filteredWorkspaceItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SERVICIOS DE ADMINISTRACIÓN (B2C/Servicio) */}
            {/* ============================================================== */}
            {filteredAdminFincasItems.length > 0 &&
              (role === 'administrador' || (role === 'super_admin' && selectedCompany)) && (
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      selectedCompany ? 'text-purple-400' : 'text-gray-500'
                    )}
                  >
                    🤝 Servicios de Administración
                  </h3>
                  <p className="text-[8px] text-gray-500 mt-0.5">B2C / Servicio</p>
                </div>
              )}

            {/* COMUNIDADES DE PROPIETARIOS */}
            {filteredAdminFincasItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('adminFincas')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏘️ Comunidades de Propietarios</span>
                  {expandedSections.adminFincas ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.adminFincas && (
                  <div className="space-y-1 mt-1">
                    {filteredAdminFincasItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Viajes Corporativos - ELIMINADO (No es PropTech) */}

            {/* 7. VIVIENDA SOCIAL / RESIDENCIAS */}
            {filteredViviendaSocialItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('viviendaSocial')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🏛️ Vivienda Social / Residencias</span>
                  {expandedSections.viviendaSocial ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.viviendaSocial && (
                  <div className="space-y-1 mt-1">
                    {filteredViviendaSocialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Estructura simplificada:
                - Living: Alquiler + Coliving + Student Housing
                - Comercial: Oficinas + Locales + Naves + Logística + Workspace
                - Construcción: Obra + Flipping + Promociones + eWoorker */}

            {/* HERRAMIENTAS HORIZONTALES - Separador visual */}
            {(filteredFinanzasItems.length > 0 ||
              filteredAnalyticsItems.length > 0 ||
              filteredOperacionesItems.length > 0 ||
              filteredComunicacionesItems.length > 0) && (
              <div className="px-2 py-3 mb-2 border-t border-gray-800">
                <h3
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    role === 'super_admin' && selectedCompany ? 'text-emerald-400' : 'text-gray-500'
                  )}
                >
                  🛠️ Herramientas
                  {role === 'super_admin' && selectedCompany && (
                    <span className="text-emerald-500 normal-case font-normal ml-1">
                      ({selectedCompany.nombre.substring(0, 12)}
                      {selectedCompany.nombre.length > 12 ? '...' : ''})
                    </span>
                  )}
                </h3>
              </div>
            )}

            {/* Finanzas */}
            {filteredFinanzasItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('finanzas')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>💰 Finanzas</span>
                  {expandedSections.finanzas ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.finanzas && (
                  <div className="space-y-1 mt-1">
                    {filteredFinanzasItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics */}
            {filteredAnalyticsItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('analytics')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>📊 Analytics e IA</span>
                  {expandedSections.analytics ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.analytics && (
                  <div className="space-y-1 mt-1">
                    {filteredAnalyticsItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Operaciones */}
            {filteredOperacionesItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('operaciones')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>⚙️ Operaciones</span>
                  {expandedSections.operaciones ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.operaciones && (
                  <div className="space-y-1 mt-1">
                    {filteredOperacionesItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Herramientas de Inversión (NUEVO) */}
            {filteredHerramientasInversionItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('herramientasInversion')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🧮 Inversión</span>
                  {expandedSections.herramientasInversion ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.herramientasInversion && (
                  <div className="space-y-1 mt-1">
                    {filteredHerramientasInversionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comunicaciones */}
            {filteredComunicacionesItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('comunicaciones')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>💬 Comunicaciones</span>
                  {expandedSections.comunicaciones ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.comunicaciones && (
                  <div className="space-y-1 mt-1">
                    {filteredComunicacionesItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documentos y Legal */}
            {filteredDocumentosLegalItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('documentosLegal')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>📄 Documentos y Legal</span>
                  {expandedSections.documentosLegal ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.documentosLegal && (
                  <div className="space-y-1 mt-1">
                    {filteredDocumentosLegalItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CRM INMOBILIARIO (Herramienta Horizontal) */}
            {filteredCrmMarketingItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('crmMarketing')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>📇 CRM Inmobiliario</span>
                  {expandedSections.crmMarketing ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.crmMarketing && (
                  <div className="space-y-1 mt-1">
                    {filteredCrmMarketingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Automatización */}
            {filteredAutomatizacionItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('automatizacion')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>⚡ Automatización</span>
                  {expandedSections.automatizacion ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.automatizacion && (
                  <div className="space-y-1 mt-1">
                    {filteredAutomatizacionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Innovación */}
            {filteredInnovacionItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('innovacion')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🚀 Innovación</span>
                  {expandedSections.innovacion ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.innovacion && (
                  <div className="space-y-1 mt-1">
                    {filteredInnovacionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Soporte */}
            {filteredSoporteItems.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('soporte')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>🎧 Soporte</span>
                  {expandedSections.soporte ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.soporte && (
                  <div className="space-y-1 mt-1">
                    {filteredSoporteItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OPERADOR DE CAMPO - Solo visible para operadores */}
            {filteredOperadorItems.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    👷 Operador de Campo
                  </h3>
                </div>
                <button
                  onClick={() => toggleSection('operador')}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                >
                  <span>Dashboard Operador</span>
                  {expandedSections.operador ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {expandedSections.operador && (
                  <div className="space-y-1 mt-1">
                    {filteredOperadorItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADMINISTRACIÓN DE EMPRESA (Solo para Administrador - NO Super Admin) */}
            {/* Gestión de Empresa - Visible para administrador y super_admin */}
            {filteredAdministradorEmpresaItems.length > 0 &&
              (role === 'administrador' || role === 'super_admin') && (
                <>
                  <div className="px-2 py-3 mb-2 border-t border-gray-800">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      ⚙️ Configuración de Mi Empresa
                    </h3>
                  </div>
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSection('administradorEmpresa')}
                      className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
                    >
                      <span>🏢 Gestión de Empresa</span>
                      {expandedSections.administradorEmpresa ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {expandedSections.administradorEmpresa && (
                      <div className="space-y-1 mt-1">
                        {filteredAdministradorEmpresaItems.map((item) => (
                          <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

            {/* No results message */}
            {searchQuery && favoriteItems.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">No se encontraron páginas</p>
                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
              </div>
            )}
          </nav>

          {/* User Info & Logout - Mejorado con validaciones */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            {sessionStatus === 'loading' ? (
              /* Loading skeleton */
              <div className="px-4 py-3 bg-gray-800 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ) : session?.user ? (
              <>
                {/* User Profile Card */}
                <Link
                  href="/perfil"
                  className="block px-4 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
                  data-testid="user-menu"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'Usuario'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        (session.user.name || session.user.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session.user.name || 'Usuario'}
                      </p>
                      {session.user.email && (
                        <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                      )}
                      {session.user.role && (
                        <p className="text-[10px] text-indigo-400 uppercase mt-0.5 font-semibold">
                          {session.user.role
                            .replace('_', ' ')
                            .replace('super admin', 'Super Admin')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Settings Link */}
                <Link
                  href="/configuracion"
                  data-tour="configuracion-link"
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
                >
                  <Settings size={18} />
                  <span className="text-sm">Configuración</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-300 hover:bg-red-900/50 hover:text-red-300 transition-all duration-200"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Cerrar Sesión</span>
                </button>
              </>
            ) : sessionStatus === 'unauthenticated' ? (
              /* Redirect to login if not authenticated */
              <div className="px-4 py-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 text-center">No autenticado</p>
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  Iniciar Sesión
                </Button>
              </div>
            ) : (
              /* Fallback genérico */
              <div className="px-4 py-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <p className="text-xs text-gray-400">Cargando...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
