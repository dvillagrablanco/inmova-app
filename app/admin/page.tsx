'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoadingState } from '@/components/ui/loading-state';
import { usePermissions } from '@/lib/hooks/usePermissions';

/**
 * Página de redirección para /admin
 * Redirige automáticamente según el rol del usuario:
 * - super_admin -> /admin/dashboard
 * - administrador -> /admin/usuarios
 * - otros -> /dashboard
 */
export default function AdminIndexPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { role } = usePermissions();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Redireccionar según el rol
    if (role === 'super_admin') {
      router.push('/admin/dashboard');
    } else if (role === 'administrador') {
      router.push('/admin/usuarios');
    } else {
      // Usuarios sin acceso admin
      router.push('/dashboard');
    }
  }, [status, role, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <LoadingState message="Redirigiendo al panel de administración..." />
    </div>
  );
}
