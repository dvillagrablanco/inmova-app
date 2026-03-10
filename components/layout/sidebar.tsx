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
import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useSidebarCounts } from '@/lib/hooks/useSidebarCounts';

const ROUTE_TO_COUNT_KEY: Record<string, { key: string; label: string }> = {
  '/pagos': { key: 'pagos_pendientes', label: 'pagos pendientes de cobro' },
  '/incidencias': { key: 'incidencias_abiertas', label: 'incidencias abiertas' },
  '/contratos': { key: 'contratos_por_vencer', label: 'contratos vencen en 30 días' },
  '/candidatos': { key: 'candidatos_nuevos', label: 'candidatos nuevos' },
};
import { useSelectedCompany } from '@/lib/hooks/admin/useSelectedCompany';
import {
  ROUTE_TO_MODULE,
  CORE_MODULES,
  SECTION_TO_MODULES,
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
  patrimonioTerciarioNavItems,
  espaciosFlexiblesNavItems,
  hospitalityNavItems,
  adminFincasItems,
  studentHousingNavItems,
  viajesCorporativosNavItems,
  viviendaSocialNavItems,
  realEstateDeveloperNavItems,
  workspaceNavItems,
  warehouseNavItems,
  holdingGrupoNavItems,
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
  const { counts } = useSidebarCounts();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [primaryVertical, setPrimaryVertical] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [editModulesMode, setEditModulesMode] = useState(false);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);
  const [togglingSection, setTogglingSection] = useState<string | null>(null);

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
      const storedExpanded = safeLocalStorage.getItem('sidebar_expanded_sections');
      const defaultState = getInitialExpandedSections(
        role as UserRole,
        primaryVertical as BusinessVertical
      );

      if (storedExpanded) {
        const parsed = JSON.parse(storedExpanded);
        // Merge defaults para secciones no presentes en preferencias guardadas,
        // y forzar expansión de secciones clave si el layout cambió (v2)
        const layoutVersion = safeLocalStorage.getItem('sidebar_layout_version');
        const CURRENT_LAYOUT_VERSION = '2';
        let merged = { ...defaultState, ...parsed };
        if (layoutVersion !== CURRENT_LAYOUT_VERSION) {
          merged = { ...parsed, ...defaultState };
          safeLocalStorage.setItem('sidebar_layout_version', CURRENT_LAYOUT_VERSION);
          safeLocalStorage.setItem('sidebar_expanded_sections', JSON.stringify(merged));
        }
        setExpandedSections(merged);
      } else {
        setExpandedSections(defaultState);
      }

      setIsInitialized(true);
    } catch (error) {
      logger.error('Error initializing expanded sections:', error);
      setExpandedSections({
        favorites: true,
        dashboard: true,
        operaciones: true,
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
  const loadActiveModules = useCallback(async () => {
    try {
      const res = await fetch('/api/modules/active');
      if (res.ok) {
        const data = await res.json();
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
  }, []);

  useEffect(() => {
    loadActiveModules();

    const handleModulesChanged = () => loadActiveModules();
    window.addEventListener('modules-changed', handleModulesChanged);
    return () => window.removeEventListener('modules-changed', handleModulesChanged);
  }, [loadActiveModules]);

  // Cargar módulos de la empresa seleccionada
  useEffect(() => {
    async function loadSelectedCompanyModules() {
      if (!selectedCompany) {
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

  // Toggle de módulo desde sidebar
  const handleSidebarModuleToggle = async (moduloCodigo: string, currentlyActive: boolean) => {
    setTogglingModule(moduloCodigo);
    try {
      const res = await fetch('/api/modules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduloCodigo, activo: !currentlyActive }),
      });
      if (res.ok) {
        if (!currentlyActive) {
          setActiveModules((prev) => [...prev, moduloCodigo]);
        } else {
          setActiveModules((prev) => prev.filter((m) => m !== moduloCodigo));
        }
        window.dispatchEvent(new Event('modules-changed'));
      } else {
        const err = await res.json();
        logger.error('Error toggling module:', err);
      }
    } catch (error) {
      logger.error('Error toggling module:', error);
    } finally {
      setTogglingModule(null);
    }
  };

  // Toggle de sección completa (activar/desactivar todos los módulos de una sección)
  const handleSectionToggle = async (sectionId: string, activate: boolean) => {
    const sectionModules = SECTION_TO_MODULES[sectionId];
    if (!sectionModules || sectionModules.length === 0) return;

    setTogglingSection(sectionId);
    try {
      const res = await fetch('/api/modules/toggle-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: sectionModules, activo: activate }),
      });
      if (res.ok) {
        if (activate) {
          setActiveModules((prev) => [...new Set([...prev, ...sectionModules])]);
        } else {
          setActiveModules((prev) => prev.filter((m) => !sectionModules.includes(m)));
        }
        window.dispatchEvent(new Event('modules-changed'));
      } else {
        const err = await res.json();
        logger.error('Error toggling section:', err);
      }
    } catch (error) {
      logger.error('Error toggling section:', error);
    } finally {
      setTogglingSection(null);
    }
  };

  // Calcular si una sección está activa (mayoría de módulos activos)
  const isSectionActive = (sectionId: string): boolean => {
    const sectionModules = SECTION_TO_MODULES[sectionId];
    if (!sectionModules || sectionModules.length === 0) return true;
    const activeCount = sectionModules.filter((m) => activeModules.includes(m)).length;
    return activeCount > sectionModules.length / 2;
  };

  // Contar módulos activos en una sección
  const getSectionActiveCount = (sectionId: string): { active: number; total: number } => {
    const sectionModules = SECTION_TO_MODULES[sectionId];
    if (!sectionModules) return { active: 0, total: 0 };
    const active = sectionModules.filter((m) => activeModules.includes(m)).length;
    return { active, total: sectionModules.length };
  };

  const isModuleEditable = role === 'super_admin' || role === 'administrador';

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

      // En modo edición de módulos, mostrar todos (activos e inactivos)
      if (editModulesMode) return true;

      // Verificar si el módulo está activo
      const moduleCode = ROUTE_TO_MODULE[item.href];
      if (!moduleCode) return true;

      if (modulesToCheck.length > 0) {
        return modulesToCheck.includes(moduleCode);
      }

      return CORE_MODULES.includes(moduleCode);
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

  // Verticales de Negocio - Usar módulos de empresa seleccionada si hay una
  const useCompanyModules = !!selectedCompany;
  const filteredAlquilerResidencialItems = filterItems(alquilerResidencialItems, useCompanyModules);
  const filteredStrItems = filterItems(strNavItems, useCompanyModules);
  const filteredCoLivingItems = filterItems(coLivingNavItems, useCompanyModules);
  const filteredBuildToRentItems = filterItems(buildToRentNavItems, useCompanyModules);
  const filteredFlippingItems = filterItems(flippingNavItems, useCompanyModules);
  const filteredConstruccionItems = filterItems(construccionNavItems, useCompanyModules);
  const filteredEwoorkerItems = filterItems(ewoorkerNavItems, useCompanyModules);
  const filteredComercialItems = filterItems(comercialNavItems, useCompanyModules);
  const filteredAlquilerComercialItems = filterItems(alquilerComercialNavItems, useCompanyModules);
  const filteredPatrimonioTerciarioItems = filterItems(
    patrimonioTerciarioNavItems,
    useCompanyModules
  );
  const filteredEspaciosFlexiblesItems = filterItems(espaciosFlexiblesNavItems, useCompanyModules);
  const filteredHospitalityItems = filterItems(hospitalityNavItems, useCompanyModules);
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

  // Holding / Grupo Societario
  const filteredHoldingGrupoItems = filterItems(holdingGrupoNavItems, useCompanyModules);

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
    ...patrimonioTerciarioNavItems,
    ...espaciosFlexiblesNavItems,
    ...hospitalityNavItems,
    ...adminFincasItems,
    // Holding / Grupo
    ...holdingGrupoNavItems,
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
    const moduleCode = ROUTE_TO_MODULE[item.href];
    const isModActive = moduleCode ? activeModules.includes(moduleCode) : true;
    const isToggling = togglingModule === moduleCode;

    if (editModulesMode && moduleCode) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <item.icon size={16} className="text-gray-400 flex-shrink-0" />
          <span
            className={cn(
              'flex-1 truncate',
              isModActive ? 'text-gray-200' : 'text-gray-500 line-through'
            )}
          >
            {item.name}
          </span>
          <button
            onClick={() => moduleCode && handleSidebarModuleToggle(moduleCode, isModActive)}
            disabled={isToggling}
            aria-label={isModActive ? `Desactivar módulo ${item.name}` : `Activar módulo ${item.name}`}
            className={cn(
              'w-9 h-5 rounded-full relative transition-colors flex-shrink-0 p-0 touch-manipulation',
              isToggling ? 'opacity-50' : '',
              isModActive ? 'bg-green-500' : 'bg-gray-600'
            )}
            style={{ minWidth: 36, minHeight: 28 }}
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                isModActive ? 'translate-x-4' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      );
    }

    return (
      <div className="relative group">
        <Link
          href={item.href}
          prefetch={true}
          onClick={() => {
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
          {(() => {
            const countInfo = ROUTE_TO_COUNT_KEY[item.href];
            const count = countInfo ? (counts[countInfo.key] ?? 0) : 0;
            return count > 0 ? (
              <span
                className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                title={`${count} ${countInfo!.label}`}
              >
                {count}
              </span>
            ) : null;
          })()}
        </Link>
        {showFavoriteButton && !editModulesMode && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(item.href);
            }}
            className={cn(
              'absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded transition-opacity z-10',
              isFavorite ? 'text-yellow-400 opacity-100' : 'text-gray-400 hover:text-yellow-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
            )}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
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
          aria-expanded={isExpanded}
          aria-label={`${item.name} — ${isExpanded ? 'colapsar' : 'expandir'}`}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm w-full min-h-[44px]',
            isActive
              ? 'bg-gray-800 text-white font-medium'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <item.icon size={18} />
          <span className="flex-1 text-left">{item.name}</span>
          {(() => {
            const countInfo = ROUTE_TO_COUNT_KEY[item.href];
            const count = countInfo ? (counts[countInfo.key] ?? 0) : 0;
            return count > 0 ? (
              <span
                className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                title={`${count} ${countInfo!.label}`}
              >
                {count}
              </span>
            ) : null;
          })()}
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
                    'flex items-center gap-2 px-3 py-2.5 rounded-md transition-all duration-200 text-xs min-h-[40px]',
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

  // Componente reutilizable para header de sección con toggle de módulo completo
  const SectionHeader = ({
    sectionId,
    title,
    className: headerClassName,
  }: {
    sectionId: string;
    title: string;
    className?: string;
  }) => {
    const sectionActive = isSectionActive(sectionId);
    const { active: sectionActiveCount, total: sectionTotal } = getSectionActiveCount(sectionId);
    const isSectionToggling = togglingSection === sectionId;
    const hasSectionModules = !!SECTION_TO_MODULES[sectionId];

    return (
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => toggleSection(sectionId)}
          className={cn(
            'flex items-center justify-between flex-1 px-2 py-2 text-xs font-semibold uppercase hover:text-white transition-colors',
            headerClassName || 'text-gray-400'
          )}
        >
          <span>{title}</span>
          {!editModulesMode && (
            expandedSections[sectionId] ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )
          )}
        </button>
        {editModulesMode && isModuleEditable && hasSectionModules && (
          <div className="flex items-center gap-1.5 pr-1 flex-shrink-0">
            <span className="text-[11px] text-gray-500">
              {sectionActiveCount}/{sectionTotal}
            </span>
            <button
              onClick={() => handleSectionToggle(sectionId, !sectionActive)}
              disabled={isSectionToggling}
              aria-label={sectionActive ? 'Desactivar sección' : 'Activar sección'}
              className={cn(
                'w-9 h-5 rounded-full relative transition-colors flex-shrink-0 p-0 touch-manipulation',
                isSectionToggling ? 'opacity-50' : '',
                sectionActive ? 'bg-green-500' : 'bg-gray-600'
              )}
              style={{ minWidth: 36, minHeight: 28 }}
              title={sectionActive ? 'Desactivar todo el módulo' : 'Activar todo el módulo'}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                  sectionActive ? 'translate-x-4' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Componente reutilizable para secciones simples del sidebar
  const SidebarSection = ({
    sectionId,
    title,
    items,
    companyId,
    headerClassName,
  }: {
    sectionId: string;
    title: string;
    items: SidebarItem[];
    companyId?: string;
    headerClassName?: string;
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <SectionHeader sectionId={sectionId} title={title} className={headerClassName} />
        {(expandedSections[sectionId] || editModulesMode) && (
          <div className="space-y-1 mt-1">
            {items.map((item) => (
              <NavItemWithSubs key={item.href} item={item as SidebarItem} companyId={companyId} />
            ))}
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
              {logo ? (
                <Image src={logo} alt={appName} fill className="object-contain" priority />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-lg font-bold text-white">{appName}</span>
                </div>
              )}
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

          {/* Edit Modules Button */}
          {isModuleEditable && (
            <div className="px-4 pb-2">
              <button
                onClick={() => setEditModulesMode(!editModulesMode)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  editModulesMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                )}
              >
                <Settings size={14} />
                {editModulesMode ? 'Guardar cambios' : 'Editar Módulos'}
              </button>
            </div>
          )}

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
            <SidebarSection
              sectionId="dashboard"
              title="🏠 Inicio"
              items={filteredDashboardItems}
            />

            {/* ============================================================== */}
            {/* SUPER ADMIN - GESTIÓN DE PLATAFORMA (PRIMERO para Super Admin) */}
            {/* ============================================================== */}
            {filteredSuperAdminPlatformItems.length > 0 && role === 'super_admin' && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
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
            {/* SELECTOR DE EMPRESA (Siempre visible) */}
            {/* ============================================================== */}
            <div className="px-2 pt-3 pb-1 mb-1 border-t border-gray-800">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                🏢 Sociedad
              </h3>
            </div>

            <div className="mb-4 px-1">
              <CompanySelector
                onCompanyChange={(company) => {
                  if (company) {
                    setExpandedSections((prev) => ({
                      ...prev,
                      administradorEmpresa: true,
                    }));
                  }
                }}
              />
            </div>

            {/* ============================================================== */}
            {/* SELECTOR DE EMPRESA Y GESTIÓN (Para Super Admin) */}
            {/* ============================================================== */}
            {role === 'super_admin' && filteredAdministradorEmpresaItems.length > 0 && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    🏢 Gestión de Empresas
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Configuración avanzada por empresa
                  </p>
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
              filteredPatrimonioTerciarioItems.length > 0 ||
              filteredEspaciosFlexiblesItems.length > 0 ||
              filteredWarehouseItems.length > 0 ||
              filteredViviendaSocialItems.length > 0) &&
              (role === 'administrador' || (role === 'super_admin' && selectedCompany)) && (
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3
                    className={cn(
                      'text-xs font-bold uppercase tracking-wider',
                      selectedCompany ? 'text-blue-400' : 'text-gray-500'
                    )}
                  >
                    💰 Explotación de Activos
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Inversión / Rendimiento</p>
                  {/* Mostrar empresa seleccionada para Super Admin */}
                  {role === 'super_admin' && selectedCompany && (
                    <p className="text-[11px] text-blue-500 mt-1">
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
                <SectionHeader sectionId="alquilerResidencial" title="🏠 Living Residencial" />
                {(expandedSections.alquilerResidencial || editModulesMode) && (
                  <div className="space-y-1 mt-1">
                    {filteredAlquilerResidencialItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredCoLivingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[11px] text-gray-500 uppercase">
                        Coliving
                      </div>
                    )}
                    {filteredCoLivingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredStudentHousingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[11px] text-gray-500 uppercase">
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

            {/* 2. ALQUILER TURÍSTICO Y HOSPITALITY (STR + Hospitality) */}
            {(filteredStrItems.length > 0 || filteredHospitalityItems.length > 0) && (
              <div className="mb-4">
                <SectionHeader sectionId="str" title="🏖️ Turístico y Hospitality" />
                {(expandedSections.str || editModulesMode) && (
                  <div className="space-y-1 mt-1">
                    {filteredStrItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredHospitalityItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[11px] text-gray-500 uppercase">
                        Hospitality
                      </div>
                    )}
                    {filteredHospitalityItems.map((item) => (
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
                <SectionHeader sectionId="construccion" title="🏗️ Construcción / Promoción" />
                {(expandedSections.construccion || editModulesMode) && (
                  <div className="space-y-1 mt-1">
                    {filteredConstruccionItems.length > 0 && (
                      <div className="ml-2 mt-1 mb-1 text-[11px] text-gray-500 uppercase">
                        Obra Nueva / Reformas
                      </div>
                    )}
                    {filteredConstruccionItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredBuildToRentItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredFlippingItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[11px] text-gray-500 uppercase">
                        House Flipping
                      </div>
                    )}
                    {filteredFlippingItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredRealEstateDeveloperItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[11px] text-gray-500 uppercase">
                        Promociones
                      </div>
                    )}
                    {filteredRealEstateDeveloperItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredEwoorkerItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[11px] text-amber-500 uppercase">
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

            {/* 3. PATRIMONIO TERCIARIO (Locales + Oficinas + Naves + Garajes/Trasteros) */}
            {(filteredPatrimonioTerciarioItems.length > 0 ||
              filteredEspaciosFlexiblesItems.length > 0 ||
              filteredWarehouseItems.length > 0) && (
              <div className="mb-4">
                <SectionHeader sectionId="comercial" title="🏢 Patrimonio Terciario" />
                {(expandedSections.comercial || editModulesMode) && (
                  <div className="space-y-1 mt-1">
                    {filteredPatrimonioTerciarioItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredEspaciosFlexiblesItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[11px] text-gray-500 uppercase">
                        Espacios Flexibles
                      </div>
                    )}
                    {filteredEspaciosFlexiblesItems.map((item) => (
                      <NavItemWithSubs key={item.href} item={item as SidebarItem} />
                    ))}
                    {filteredWarehouseItems.length > 0 && (
                      <div className="ml-2 mt-2 mb-1 text-[11px] text-gray-500 uppercase">
                        Logística / Almacenes
                      </div>
                    )}
                    {filteredWarehouseItems.map((item) => (
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
                      'text-xs font-bold uppercase tracking-wider',
                      selectedCompany ? 'text-purple-400' : 'text-gray-500'
                    )}
                  >
                    🤝 Servicios de Administración
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">B2C / Servicio</p>
                </div>
              )}

            {/* COMUNIDADES DE PROPIETARIOS */}
            <SidebarSection
              sectionId="adminFincas"
              title="🏘️ Comunidades de Propietarios"
              items={filteredAdminFincasItems}
            />

            {/* 7. VIVIENDA SOCIAL / RESIDENCIAS */}
            <SidebarSection
              sectionId="viviendaSocial"
              title="🏛️ Vivienda Social / Residencias"
              items={filteredViviendaSocialItems}
            />

            {/* Estructura simplificada:
                - Living: Alquiler + Coliving + Student Housing
                - Comercial: Oficinas + Locales + Naves + Logística + Workspace
                - Construcción: Obra + Flipping + Promociones + eWoorker */}

            {/* HOLDING / GRUPO SOCIETARIO */}
            {filteredHoldingGrupoItems.length > 0 && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    🏛️ Holding / Grupo
                  </h3>
                </div>
                <SidebarSection
                  sectionId="holdingGrupo"
                  title="🏛️ Inversiones Grupo"
                  items={filteredHoldingGrupoItems}
                  headerClassName="text-amber-400/80"
                />
              </>
            )}

            {/* HERRAMIENTAS HORIZONTALES - Separador visual */}
            {(filteredFinanzasItems.length > 0 ||
              filteredAnalyticsItems.length > 0 ||
              filteredOperacionesItems.length > 0 ||
              filteredComunicacionesItems.length > 0) && (
              <div className="px-2 py-3 mb-2 border-t border-gray-800">
                <h3
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider',
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
            <SidebarSection sectionId="finanzas" title="💰 Finanzas" items={filteredFinanzasItems} />

            {/* Analytics */}
            <SidebarSection sectionId="analytics" title="📊 Analytics e IA" items={filteredAnalyticsItems} />

            {/* Operaciones */}
            <SidebarSection sectionId="operaciones" title="⚙️ Operaciones" items={filteredOperacionesItems} />

            {/* Herramientas de Inversión */}
            <SidebarSection sectionId="herramientasInversion" title="🧮 Inversión" items={filteredHerramientasInversionItems} />

            {/* Comunicaciones */}
            <SidebarSection sectionId="comunicaciones" title="💬 Comunicaciones" items={filteredComunicacionesItems} />

            {/* Documentos y Legal */}
            <SidebarSection sectionId="documentosLegal" title="📄 Documentos y Legal" items={filteredDocumentosLegalItems} />

            {/* CRM Inmobiliario */}
            <SidebarSection sectionId="crmMarketing" title="📇 CRM Inmobiliario" items={filteredCrmMarketingItems} />

            {/* Automatización */}
            <SidebarSection sectionId="automatizacion" title="⚡ Automatización" items={filteredAutomatizacionItems} />

            {/* Innovación */}
            <SidebarSection sectionId="innovacion" title="🚀 Innovación" items={filteredInnovacionItems} />

            {/* Soporte */}
            <SidebarSection sectionId="soporte" title="🎧 Soporte" items={filteredSoporteItems} />

            {/* OPERADOR DE CAMPO - Solo visible para operadores */}
            {filteredOperadorItems.length > 0 && (
              <>
                <div className="px-2 py-3 mb-2 border-t border-gray-800">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    👷 Operador de Campo
                  </h3>
                </div>
                <SidebarSection
                  sectionId="operador"
                  title="Dashboard Operador"
                  items={filteredOperadorItems}
                />
              </>
            )}

            {/* ADMINISTRACIÓN DE EMPRESA (Solo para Administrador - NO Super Admin) */}
            {/* Gestión de Empresa - Visible para administrador y super_admin */}
            {filteredAdministradorEmpresaItems.length > 0 &&
              (role === 'administrador' || role === 'super_admin') && (
                <>
                  <div className="px-2 py-3 mb-2 border-t border-gray-800">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      ⚙️ Configuración de Mi Empresa
                    </h3>
                  </div>
                  <SidebarSection
                    sectionId="administradorEmpresa"
                    title="🏢 Gestión de Empresa"
                    items={filteredAdministradorEmpresaItems}
                  />
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
                      <p className="text-sm font-medium text-white truncate" title={session.user.name || 'Usuario'}>
                        {session.user.name || 'Usuario'}
                      </p>
                      {session.user.email && (
                        <p className="text-xs text-gray-400 truncate" title={session.user.email}>{session.user.email}</p>
                      )}
                      {session.user.role && (
                        <p className="text-xs text-indigo-400 uppercase mt-0.5 font-semibold">
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
