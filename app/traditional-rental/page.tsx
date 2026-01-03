import { Metadata } from 'next';
import { Building2, Home, Users, FileText, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard Alquiler Tradicional | Inmova',
  description: 'Dashboard de alquiler residencial tradicional',
};

export default function TraditionalRentalPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏘️ Alquiler Residencial Tradicional</h1>
        <p className="text-gray-600 mt-2">
          Dashboard completo para gestión de alquiler tradicional a largo plazo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <p className="text-sm text-gray-600">Edificios</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Home className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <p className="text-sm text-gray-600">Unidades</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <p className="text-sm text-gray-600">Inquilinos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <p className="text-sm text-gray-600">Contratos Activos</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏘️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Dashboard de Alquiler Tradicional
          </h2>
          <p className="text-gray-600 mb-6">
            Este módulo está en desarrollo activo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Edificios</h3>
              <p className="text-sm text-gray-600">Gestiona edificios completos</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Unidades</h3>
              <p className="text-sm text-gray-600">Gestiona pisos y locales</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Contratos</h3>
              <p className="text-sm text-gray-600">Contratos a largo plazo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
