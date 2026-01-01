import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Force dynamic rendering para evitar errores en RSC requests
export const dynamic = 'force-dynamic';

/**
 * Ruta /configuracion - Redirect inteligente según rol
 *
 * Esta ruta no debería accederse directamente, pero Next.js la está
 * pre-fetching como RSC (React Server Component), causando 404s.
 *
 * Solución: Redirigir al usuario a la configuración apropiada según su rol.
 */
export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);

  // Si no está autenticado, redirigir al login
  if (!session || !session.user) {
    redirect('/login');
  }

  // Redirigir según el rol del usuario
  const role = session.user.role;

  if (role === 'super_admin' || role === 'administrador') {
    // Administradores → Configuración de admin
    redirect('/admin/configuracion');
  } else if (role === 'gestor' || role === 'operador') {
    // Gestores y operadores → Dashboard
    redirect('/dashboard');
  } else if (role === 'soporte') {
    // Soporte → Panel de soporte
    redirect('/soporte');
  } else if (role === 'community_manager') {
    // Community manager → Dashboard
    redirect('/dashboard');
  } else {
    // Otros roles → Dashboard
    redirect('/dashboard');
  }
}
