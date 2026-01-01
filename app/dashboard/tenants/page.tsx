import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inquilinos | Inmova',
  description: 'Gestión de inquilinos',
};

export default function TenantsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inquilinos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona la información de tus inquilinos
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Módulo de Inquilinos
          </h2>
          <p className="text-gray-600 mb-6">
            Esta página está en desarrollo. Próximamente disponible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Listar inquilinos</h3>
              <p className="text-sm text-gray-600">Ver todos los inquilinos activos</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Perfil completo</h3>
              <p className="text-sm text-gray-600">Información detallada de cada inquilino</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Historial</h3>
              <p className="text-sm text-gray-600">Pagos, incidencias y comunicaciones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
