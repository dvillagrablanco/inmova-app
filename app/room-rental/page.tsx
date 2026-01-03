import { Metadata } from 'next';
import { Home, Users, DollarSign, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Room Rental | Inmova',
  description: 'Alquiler de habitaciones individuales',
};

export default function RoomRentalPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🚪 Room Rental</h1>
        <p className="text-gray-600 mt-2">
          Gestión de alquiler de habitaciones individuales en pisos compartidos
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚪</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Módulo de Room Rental
          </h2>
          <p className="text-gray-600 mb-6">
            Este módulo está en desarrollo. Próximamente disponible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="border rounded-lg p-4">
              <Home className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold mb-2">Habitaciones</h3>
              <p className="text-sm text-gray-600">Gestiona habitaciones individuales</p>
            </div>
            <div className="border rounded-lg p-4">
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold mb-2">Compañeros</h3>
              <p className="text-sm text-gray-600">Gestiona inquilinos compartidos</p>
            </div>
            <div className="border rounded-lg p-4">
              <DollarSign className="h-8 w-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold mb-2">Rentas</h3>
              <p className="text-sm text-gray-600">Pagos individuales por habitación</p>
            </div>
            <div className="border rounded-lg p-4">
              <Calendar className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold mb-2">Rotación</h3>
              <p className="text-sm text-gray-600">Gestiona cambios de inquilinos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
