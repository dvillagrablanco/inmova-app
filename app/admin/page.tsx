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
  
  // Verificar rol admin
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">
          Gestión y configuración del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          href="/admin/usuarios"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">Usuarios</h3>
          <p className="text-gray-600">Gestión de usuarios del sistema</p>
        </a>

        <a
          href="/admin/configuracion"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">⚙️</div>
          <h3 className="text-xl font-semibold mb-2">Configuración</h3>
          <p className="text-gray-600">Ajustes generales del sistema</p>
        </a>

        <a
          href="/admin/planes"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">💎</div>
          <h3 className="text-xl font-semibold mb-2">Planes</h3>
          <p className="text-gray-600">Gestión de planes y suscripciones</p>
        </a>

        <a
          href="/admin/modulos"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">🧩</div>
          <h3 className="text-xl font-semibold mb-2">Módulos</h3>
          <p className="text-gray-600">Activación/desactivación de módulos</p>
        </a>

        <a
          href="/admin/marketplace"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold mb-2">Marketplace</h3>
          <p className="text-gray-600">Integraciones y extensiones</p>
        </a>

        <a
          href="/reportes"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Reportes</h3>
          <p className="text-gray-600">Análisis y estadísticas</p>
        </a>
      </div>
    </div>
  );
}
