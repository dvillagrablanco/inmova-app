import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export interface NavigationHistoryItem {
  path: string;
  title: string;
  timestamp: number;
}

const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = 'inmova_navigation_history';

export function useNavigationHistory() {
  const pathname = usePathname();
  const [history, setHistory] = useState<NavigationHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading navigation history:', error);
    }
  }, []);

  // Update history when pathname changes
  useEffect(() => {
    if (!pathname) return;

    const title = getPageTitle(pathname);
    const newItem: NavigationHistoryItem = {
      path: pathname,
      title,
      timestamp: Date.now(),
    };

    setHistory((prevHistory) => {
      // Remove duplicate paths
      const filtered = prevHistory.filter((item) => item.path !== pathname);
      
      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving navigation history:', error);
      }
      
      return updated;
    });
  }, [pathname]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    history,
    clearHistory,
  };
}

function getPageTitle(path: string): string {
  const pathMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/edificios': 'Edificios',
    '/unidades': 'Unidades',
    '/inquilinos': 'Inquilinos',
    '/contratos': 'Contratos',
    '/pagos': 'Pagos',
    '/mantenimiento': 'Mantenimiento',
    '/proveedores': 'Proveedores',
    '/documentos': 'Documentos',
    '/reportes': 'Reportes',
    '/gastos': 'Gastos',
    '/candidatos': 'Candidatos',
    '/tareas': 'Tareas',
    '/notificaciones': 'Notificaciones',
    '/perfil': 'Perfil',
    '/calendario': 'Calendario',
    '/chat': 'Chat',
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/usuarios': 'Gestión de Usuarios',
    '/admin/clientes': 'Gestión de Clientes',
    '/admin/configuracion': 'Configuración',
    '/admin/partners': 'Partners',
    '/admin/facturacion': 'Facturación',
    '/admin/seguridad': 'Seguridad',
    '/admin/metricas': 'Métricas',
  };

  // Check for exact match
  if (pathMap[path]) {
    return pathMap[path];
  }

  // Check for dynamic routes
  if (path.startsWith('/edificios/')) return 'Detalle de Edificio';
  if (path.startsWith('/unidades/')) return 'Detalle de Unidad';
  if (path.startsWith('/inquilinos/')) return 'Detalle de Inquilino';
  if (path.startsWith('/contratos/')) return 'Detalle de Contrato';
  if (path.startsWith('/admin/')) return 'Administración';

  // Default
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' > ');
}
