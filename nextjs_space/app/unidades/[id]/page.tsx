'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Home, ArrowLeft, Building2, User, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Image from 'next/image';

export default function UnidadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const [unit, setUnit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const response = await fetch(`/api/units/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          setUnit(data);
        }
      } catch (error) {
        console.error('Error fetching unit:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && params?.id) {
      fetchUnit();
    }
  }, [status, params]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session || !unit) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/unidades')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Unidades
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/unidades">Unidades</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Unidad {unit?.numero || 'Detalle'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-black text-white rounded-lg">
                  <Home size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {unit?.building?.nombre} - {unit?.numero}
                  </h1>
                  <p className="text-gray-600 mt-1">{unit?.tipo}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                unit?.estado === 'ocupada' ? 'bg-green-100 text-green-800' :
                unit?.estado === 'disponible' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {unit?.estado}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Superficie</p>
                <p className="text-2xl font-bold text-gray-900">{unit?.superficie}m²</p>
              </div>
              {unit?.habitaciones && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Habitaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{unit.habitaciones}</p>
                </div>
              )}
              {unit?.banos && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Baños</p>
                  <p className="text-2xl font-bold text-gray-900">{unit.banos}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Renta Mensual</p>
                <p className="text-2xl font-bold text-gray-900">€{unit?.rentaMensual?.toLocaleString('es-ES')}</p>
              </div>
            </div>
          </div>

          {/* Galería de Fotos y Multimedia */}
          {(unit?.imagenes?.length > 0 || unit?.tourVirtual || unit?.planos?.length > 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon size={24} />
                Galería y Multimedia
              </h2>

              {/* Fotos */}
              {unit?.imagenes?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Fotos de la Unidad</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {unit.imagenes.map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                        <Image
                          src={img}
                          alt={`Foto ${idx + 1} de ${unit.numero}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tour Virtual */}
              {unit?.tourVirtual && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Video size={20} />
                    Tour Virtual
                  </h3>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      src={unit.tourVirtual}
                      className="w-full h-full"
                      allowFullScreen
                      title="Tour Virtual"
                    />
                  </div>
                </div>
              )}

              {/* Planos */}
              {unit?.planos?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText size={20} />
                    Planos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unit.planos.map((plano: string, idx: number) => (
                      <a
                        key={idx}
                        href={plano}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="text-gray-400" size={24} />
                        <span className="text-sm font-medium">Plano {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {unit?.tenant && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={24} />
                Inquilino Actual
              </h2>
              <p className="text-lg font-medium text-gray-900">{unit.tenant.nombreCompleto}</p>
              <p className="text-gray-600">{unit.tenant.email}</p>
              <p className="text-gray-600">{unit.tenant.telefono}</p>
            </div>
          )}

          {unit?.contracts && unit.contracts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Historial de Contratos</h2>
              <div className="space-y-4">
                {unit.contracts.map((contract: any) => (
                  <div key={contract?.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{contract?.tenant?.nombreCompleto}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(contract?.fechaInicio).toLocaleDateString('es-ES')} -{' '}
                          {new Date(contract?.fechaFin).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{contract?.estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}