'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { routePreloader } from '@/lib/route-preloader-manager';

/**
 * RoutePreloaderProvider - Provider que activa la precarga automática
 * basada en el rol del usuario autenticado
 * 
 * Debe envolverse en el layout principal de la aplicación
 */
export function RoutePreloaderProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() || {};

  useEffect(() => {
    // Solo precargar cuando la sesión esté completamente cargada
    if (status === 'loading') return;

    // Determinar el rol del usuario
    let userRole: 'admin' | 'owner' | 'tenant' | 'guest' = 'guest';

    if (session?.user) {
      const role = session.user.role;
      
      // Mapear roles de la aplicación a roles de precarga
      if (role === 'super_admin' || role === 'administrador') {
        userRole = 'admin';
      } else if (role === 'gestor' || role === 'operador') {
        userRole = 'owner';
      } else if (role === 'tenant') {
        userRole = 'tenant';
      }
    }

    // Activar precarga para el rol detectado
    if (typeof window !== 'undefined') {
      // Esperar un poco para no interferir con la carga inicial
      const timeoutId = setTimeout(() => {
        routePreloader.preloadForUserRole(userRole);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [session, status]);

  return <>{children}</>;
}
