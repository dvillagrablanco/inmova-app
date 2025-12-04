'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, DoorOpen, Users, Euro, TrendingUp, Plus, Eye, BarChart3 } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import logger, { logError } from '@/lib/logger';

function RoomRentalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [units, setUnits] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [unitsRes, analyticsRes] = await Promise.all([
        fetch('/api/units?tipo=vivienda'),
        fetch('/api/room-rental/analytics'),
      ]);

      if (unitsRes.ok) setUnits(await unitsRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <div className="text-center py-12">Cargando...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Alquiler por Habitaciones</h1>
              <p className="text-gray-600">Gestiona habitaciones, contratos y prorrateo de suministros</p>
            </div>

            {/* Analytics KPIs */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Tasa Ocupación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.occupancyRate}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      €{analytics.totalRevenue.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Precio Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      €{analytics.averageRoomPrice.toFixed(0)}/mes
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Estancia Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics.averageStayDuration.toFixed(0)} días
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Lista de Unidades con Habitaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Unidades con Habitaciones</CardTitle>
                <CardDescription>Selecciona una unidad para gestionar sus habitaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {units.map((unit) => (
                    <Card key={unit.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/room-rental/${unit.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{unit.building?.nombre}</h3>
                            <p className="text-sm text-gray-600">Unidad {unit.numero}</p>
                          </div>
                          <Building2 className="h-8 w-8 text-blue-500" />
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Superficie:</span>
                            <span className="font-medium">{unit.superficie}m²</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Estado:</span>
                            <Badge variant={unit.estado === 'disponible' ? 'default' : 'secondary'}>
                              {unit.estado}
                            </Badge>
                          </div>
                        </div>

                        <Button className="w-full mt-4" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Habitaciones
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                  {units.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <DoorOpen className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                      <p>No hay unidades disponibles para alquiler por habitaciones</p>
                      <Button className="mt-4" onClick={() => router.push('/unidades/nuevo')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Nueva Unidad
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function RoomRentalPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <RoomRentalPage />
    </ErrorBoundary>
  );
}
