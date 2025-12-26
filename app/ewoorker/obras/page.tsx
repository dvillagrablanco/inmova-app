'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, Plus, MapPin, Calendar, Euro, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Obra {
  id: string;
  titulo: string;
  descripcion: string;
  provincia: string;
  municipio: string;
  categoria: string;
  presupuestoMinimo: number;
  presupuestoMaximo: number;
  fechaInicioDeseada: string;
  estado: string;
  _count: {
    ofertas: number;
  };
}

export default function ObrasPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mis-obras' | 'disponibles'>('mis-obras');

  useEffect(() => {
    fetchObras();
  }, [tab]);

  const fetchObras = async () => {
    try {
      const res = await fetch(`/api/ewoorker/obras?tab=${tab}`);
      if (res.ok) {
        const data = await res.json();
        setObras(data.obras || []);
      }
    } catch (error) {
      toast.error('Error al cargar obras');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              {tab === 'mis-obras' ? 'Mis Obras' : 'Obras Disponibles'}
            </h1>
            <p className="text-gray-600 mt-2">
              {tab === 'mis-obras' ? 'Gestiona tus proyectos' : 'Encuentra nuevas oportunidades'}
            </p>
          </div>
          {tab === 'mis-obras' && (
            <button
              onClick={() => router.push('/ewoorker/obras/nueva')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nueva Obra
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setTab('mis-obras')}
            className={`pb-3 px-4 font-medium ${
              tab === 'mis-obras' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            Mis Obras
          </button>
          <button
            onClick={() => setTab('disponibles')}
            className={`pb-3 px-4 font-medium ${
              tab === 'disponibles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            Obras Disponibles
          </button>
        </div>

        {/* Lista de obras */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : obras.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No hay obras disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {obras.map((obra) => (
              <div
                key={obra.id}
                onClick={() => router.push(`/ewoorker/obras/${obra.id}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="mb-4">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {obra.categoria}
                  </span>
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      obra.estado === 'PUBLICADA'
                        ? 'bg-green-100 text-green-800'
                        : obra.estado === 'EN_LICITACION'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {obra.estado}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{obra.titulo}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{obra.descripcion}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {obra.municipio}, {obra.provincia}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(obra.fechaInicioDeseada).toLocaleDateString('es-ES')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />€{obra.presupuestoMinimo?.toLocaleString()} - €
                    {obra.presupuestoMaximo?.toLocaleString()}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {obra._count?.ofertas || 0} oferta(s)
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                    <Eye className="h-4 w-4" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
