import { Metadata } from 'next';
import { Calendar, CheckSquare, Users, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Limpieza y Housekeeping | Inmova',
  description: 'Gestión de limpieza y mantenimiento para STR',
};

export default function HousekeepingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🧹 Limpieza y Housekeeping</h1>
        <p className="text-gray-600 mt-2">
          Gestión de limpieza y mantenimiento para alquileres de corta estancia
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧹</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Módulo de Housekeeping
          </h2>
          <p className="text-gray-600 mb-6">
            Este módulo está en desarrollo. Próximamente disponible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="border rounded-lg p-4">
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold mb-2">Calendario</h3>
              <p className="text-sm text-gray-600">Programa limpiezas automáticamente</p>
            </div>
            <div className="border rounded-lg p-4">
              <CheckSquare className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold mb-2">Checklist</h3>
              <p className="text-sm text-gray-600">Listas de verificación</p>
            </div>
            <div className="border rounded-lg p-4">
              <Users className="h-8 w-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold mb-2">Personal</h3>
              <p className="text-sm text-gray-600">Gestiona tu equipo</p>
            </div>
            <div className="border rounded-lg p-4">
              <Clock className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold mb-2">Turnos</h3>
              <p className="text-sm text-gray-600">Asignación de turnos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
