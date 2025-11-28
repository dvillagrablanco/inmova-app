'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Home, Plus, Building2, User } from 'lucide-react';
import Link from 'next/link';

export default function UnidadesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ estado: '', tipo: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const params = new URLSearchParams();
        if (filter.estado) params.append('estado', filter.estado);
        if (filter.tipo) params.append('tipo', filter.tipo);
        
        const response = await fetch(`/api/units?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setUnits(data);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchUnits();
    }
  }, [status, filter]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session) return null;

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'ocupada': return 'bg-green-100 text-green-800';
      case 'disponible': return 'bg-blue-100 text-blue-800';
      case 'en_mantenimiento': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unidades</h1>
              <p className="text-gray-600 mt-1">Gestiona todas las unidades</p>
            </div>
            <button
              onClick={() => router.push('/unidades/nuevo')}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Plus size={20} />
              Nueva Unidad
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filter.estado}
                onChange={(e) => setFilter({ ...filter, estado: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              >
                <option value="">Todos los estados</option>
                <option value="ocupada">Ocupada</option>
                <option value="disponible">Disponible</option>
                <option value="en_mantenimiento">En Mantenimiento</option>
              </select>
              <select
                value={filter.tipo}
                onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              >
                <option value="">Todos los tipos</option>
                <option value="vivienda">Vivienda</option>
                <option value="local">Local</option>
                <option value="garaje">Garaje</option>
                <option value="trastero">Trastero</option>
              </select>
            </div>
          </div>

          {/* Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <Link
                key={unit?.id}
                href={`/unidades/${unit?.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <Home size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadgeColor(unit?.estado)}`}>
                    {unit?.estado?.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {unit?.building?.nombre} - {unit?.numero}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} />
                    <span>{unit?.tipo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{unit?.superficie}m²</span>
                    {unit?.habitaciones && <span>• {unit.habitaciones} hab.</span>}
                    {unit?.banos && <span>• {unit.banos} baños</span>}
                  </div>
                  {unit?.tenant && (
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{unit.tenant.nombreCompleto}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Renta mensual</p>
                  <p className="text-lg font-bold text-gray-900">
                    €{unit?.rentaMensual?.toLocaleString('es-ES')}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {units.length === 0 && (
            <div className="text-center py-12">
              <Home size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay unidades registradas</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}