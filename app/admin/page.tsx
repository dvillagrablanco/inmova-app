import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Inmova',
  description: 'Panel de administración',
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  // Verificar rol admin y redirigir al dashboard principal
  const role = session.user.role?.toLowerCase();
  const allowedRoles = ['super_admin', 'administrador'];
  if (!role || !allowedRoles.includes(role)) {
    redirect('/unauthorized');
  }

  // Redirigir al dashboard principal de admin que tiene el sidebar completo
  redirect('/admin/dashboard');
}
