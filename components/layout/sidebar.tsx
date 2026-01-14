'use client';

import { useSession } from 'next-auth/react';
import { AdaptiveSidebar } from '@/components/adaptive/AdaptiveSidebar';
import { UserProfile } from '@/lib/ui-mode-service';

export function Sidebar() {
  const { data: session } = useSession();

  // If we have a session with user data, use the adaptive sidebar
  if (session?.user) {
    // Construct a UserProfile-like object from session data if available
    // In a real app, this might come from a useUserProfile hook
    const userRole = (session.user as any).role || '';

    // Configuración optimizada para administradores
    // FIX: Incluir 'administrador' que es el rol usado en el sistema
    const isAdmin = ['super_admin', 'admin', 'administrador', 'ADMIN', 'SUPERADMIN'].includes(userRole);

    const userProfile: UserProfile = {
      uiMode: isAdmin ? 'advanced' : (session.user as any).uiMode || 'standard',
      experienceLevel: isAdmin ? 'avanzado' : (session.user as any).experienceLevel || 'intermedio',
      techSavviness: isAdmin ? 'alto' : (session.user as any).techSavviness || 'medio',
      // FIX: Inicializar arrays vacíos para evitar 'includes is not a function'
      preferredModules: Array.isArray((session.user as any).preferredModules) 
        ? (session.user as any).preferredModules 
        : [],
      hiddenModules: Array.isArray((session.user as any).hiddenModules) 
        ? (session.user as any).hiddenModules 
        : [],
    };

    // Determine vertical (simplified logic)
    // Si es admin, usar la vertical completa 'admin_complete'
    let vertical = 'general';

    if (isAdmin) {
      vertical = 'admin_complete';
    } else {
      // Aquí podría ir lógica para otras verticales según company type
      // Por ahora mantenemos 'general' para otros roles
    }

    return (
      <div className="hidden lg:flex flex-col w-64 border-r bg-background h-full fixed left-0 top-0 bottom-0 z-30">
        <AdaptiveSidebar
          vertical={vertical}
          userProfile={userProfile}
          className="h-full w-full border-none"
        />
      </div>
    );
  }

  // Fallback for non-authenticated state or loading
  // Avoid circular dependency by not importing itself
  return (
    <div className="hidden lg:flex flex-col w-64 border-r bg-background h-full fixed left-0 top-0 bottom-0 z-30">
      <div className="p-4">
        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-full bg-gray-100 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
