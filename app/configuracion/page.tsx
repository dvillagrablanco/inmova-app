import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

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

  if (role === 'ADMIN' || role === 'super_admin' || role === 'SUPERADMIN') {
    // Administradores → Configuración de admin
    redirect('/admin/configuracion');
  } else if (role === 'OWNER' || role === 'PROPIETARIO') {
    // Propietarios → Portal propietario
    redirect('/portal-propietario/configuracion');
  } else if (role === 'TENANT' || role === 'INQUILINO') {
    // Inquilinos → Perfil
    redirect('/perfil');
  } else if (role === 'PROVIDER' || role === 'PROVEEDOR') {
    // Proveedores → Settings de proveedor
    redirect('/portal-proveedor/settings');
  } else {
    // Otros roles → Dashboard
    redirect('/dashboard');
  }
}
