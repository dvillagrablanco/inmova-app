import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal de Proveedores | Inmova',
  description: 'Portal para proveedores de servicios',
};

export default function PortalProveedorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Portal de Proveedores</h1>
        <p className="text-gray-600 mt-2">
          Gestión de servicios y órdenes de trabajo
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔨</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Portal de Proveedores
          </h2>
          <p className="text-gray-600 mb-6">
            Esta página está en desarrollo. Próximamente disponible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Órdenes de trabajo</h3>
              <p className="text-sm text-gray-600">Gestión de solicitudes</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Presupuestos</h3>
              <p className="text-sm text-gray-600">Enviar y gestionar presupuestos</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Facturación</h3>
              <p className="text-sm text-gray-600">Gestión de facturas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/portal-proveedor/ordenes"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">Órdenes</h3>
          <p className="text-gray-600">Ver todas las órdenes asignadas</p>
        </a>

        <a
          href="/portal-proveedor/presupuestos"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-xl font-semibold mb-2">Presupuestos</h3>
          <p className="text-gray-600">Gestionar presupuestos</p>
        </a>

        <a
          href="/portal-proveedor/facturas"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">🧾</div>
          <h3 className="text-xl font-semibold mb-2">Facturas</h3>
          <p className="text-gray-600">Facturación y cobros</p>
        </a>

        <a
          href="/portal-proveedor/chat"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-xl font-semibold mb-2">Chat</h3>
          <p className="text-gray-600">Comunicación con clientes</p>
        </a>
      </div>
    </div>
  );
}
