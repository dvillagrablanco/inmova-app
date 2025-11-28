'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Building2, Plus, MapPin, Calendar, Hash } from 'lucide-react';
import Link from 'next/link';

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  anoConstructor: number;
  numeroUnidades: number;
  metrics?: {
    totalUnits: number;
    occupiedUnits: number;
    ocupacionPct: number;
    ingresosMensuales: number;
  };
}

export default function EdificiosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch('/api/buildings');
        if (response.ok) {
          const data = await response.json();
          setBuildings(data);
        }
      } catch (error) {
        console.error('Error fetching buildings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchBuildings();
    }
  }, [status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edificios</h1>
              <p className="text-gray-600 mt-1">
                Gestiona todos los edificios de tu cartera
              </p>
            </div>
            <button
              onClick={() => router.push('/edificios/nuevo')}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
              Nuevo Edificio
            </button>
          </div>

          {/* Buildings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <Link
                key={building.id}
                href={`/edificios/${building.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <Building2 size={24} />
                  </div>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                    {building.tipo}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-black">
                  {building.nombre}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{building.direccion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Construido en {building.anoConstructor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash size={16} />
                    <span>{building.numeroUnidades} unidades</span>
                  </div>
                </div>

                {building.metrics && (
                  <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Ocupación</p>
                      <p className="text-lg font-bold text-gray-900">
                        {building.metrics.ocupacionPct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Ingresos/mes</p>
                      <p className="text-lg font-bold text-gray-900">
                        €{building.metrics.ingresosMensuales.toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {buildings.length === 0 && (
            <div className="text-center py-12">
              <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay edificios registrados</p>
              <button
                onClick={() => router.push('/edificios/nuevo')}
                className="mt-4 text-black font-medium hover:underline"
              >
                Crear el primer edificio
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}