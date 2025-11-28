'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Building2, MapPin, Calendar, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function EdificioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const [building, setBuilding] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBuilding = async () => {
      try {
        const response = await fetch(`/api/buildings/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          setBuilding(data);
        }
      } catch (error) {
        console.error('Error fetching building:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && params?.id) {
      fetchBuilding();
    }
  }, [status, params]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session || !building) return null;

  const occupiedUnits = building?.units?.filter((u: any) => u?.estado === 'ocupada').length || 0;
  const totalUnits = building?.units?.length || 0;
  const ocupacionPct = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0;

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
                onClick={() => router.push('/edificios')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Edificios
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
                    <BreadcrumbLink href="/edificios">Edificios</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{building?.nombre || 'Detalle'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-black text-white rounded-lg">
                  <Building2 size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{building?.nombre}</h1>
                  <p className="text-gray-600 mt-1">{building?.tipo}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Dirección</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <MapPin size={16} />
                  {building?.direccion}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Año de construcción</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Calendar size={16} />
                  {building?.anoConstructor}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Ocupación</p>
                <p className="text-gray-900 font-medium">
                  {occupiedUnits}/{totalUnits} unidades ({ocupacionPct}%)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Unidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {building?.units?.map((unit: any) => (
                <Link
                  key={unit?.id}
                  href={`/unidades/${unit?.id}`}
                  className="p-4 border border-gray-200 rounded-lg hover:border-black transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Home size={20} />
                      <span className="font-bold text-gray-900">{unit?.numero}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      unit?.estado === 'ocupada' ? 'bg-green-100 text-green-800' :
                      unit?.estado === 'disponible' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {unit?.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{unit?.tipo} • {unit?.superficie}m²</p>
                  {unit?.tenant && (
                    <p className="text-sm text-gray-600 mt-1">{unit.tenant.nombreCompleto}</p>
                  )}
                  <p className="text-sm font-bold text-gray-900 mt-2">
                    €{unit?.rentaMensual?.toLocaleString('es-ES')}/mes
                  </p>
                </Link>
              ))}
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}