'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Wrench, Plus, AlertTriangle } from 'lucide-react';

export default function MantenimientoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ estado: '', prioridad: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const params = new URLSearchParams();
        if (filter.estado) params.append('estado', filter.estado);
        if (filter.prioridad) params.append('prioridad', filter.prioridad);
        
        const response = await fetch(`/api/maintenance?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        }
      } catch (error) {
        console.error('Error fetching maintenance requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchRequests();
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

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800';
      case 'en_progreso': return 'bg-blue-100 text-blue-800';
      case 'programado': return 'bg-yellow-100 text-yellow-800';
      case 'pendiente': return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
              <p className="text-gray-600 mt-1">Gestiona las solicitudes de mantenimiento</p>
            </div>
            <button
              onClick={() => router.push('/mantenimiento/nuevo')}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Plus size={20} />
              Nueva Solicitud
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filter.estado}
                onChange={(e) => setFilter({ ...filter, estado: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="programado">Programado</option>
                <option value="completado">Completado</option>
              </select>
              <select
                value={filter.prioridad}
                onChange={(e) => setFilter({ ...filter, prioridad: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              >
                <option value="">Todas las prioridades</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          {/* Requests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <div
                key={req?.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    {req?.prioridad === 'alta' ? (
                      <AlertTriangle size={24} className="text-red-600" />
                    ) : (
                      <Wrench size={24} />
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPrioridadColor(req?.prioridad)}`}>
                    {req?.prioridad}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{req?.titulo}</h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Unidad:</span>
                    <span>{req?.unit?.building?.nombre} - {req?.unit?.numero}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{req?.descripcion}</p>
                  {req?.proveedorAsignado && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Proveedor:</span>
                      <span>{req.proveedorAsignado}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(req?.estado)}`}>
                    {req?.estado?.replace('_', ' ')}
                  </span>
                  {req?.costoEstimado && (
                    <span className="text-sm font-bold text-gray-900">
                      €{req.costoEstimado.toLocaleString('es-ES')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {requests.length === 0 && (
            <div className="text-center py-12">
              <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay solicitudes de mantenimiento</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}