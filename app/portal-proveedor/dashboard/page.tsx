'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Briefcase, Clock, CheckCircle, TrendingUp, Euro, Star, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardData {
  proveedor: { id: string; nombre: string; tipo: string; email: string; telefono: string; rating: number };
  kpis: { totalOrdenes: number; ordenesPendientes: number; ordenesEnProgreso: number; ordenesCompletadas: number; ingresosTotales: number; ingresosMes: number; ratingPromedio: number };
  ordenesRecientes: any[];
}

export default function ProveedorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [proveedor, setProveedor] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadDashboard();
  }, [router]);

  const checkAuthAndLoadDashboard = async () => {
    try {
      const res = await fetch('/api/auth-proveedor/me', { credentials: 'include' });
      if (!res.ok) {
        router.push('/portal-proveedor/login');
        return;
      }
      const { proveedor: p } = await res.json();
      setProveedor(p);
      loadDashboard(p.id);
    } catch (error) {
      router.push('/portal-proveedor/login');
    }
  };

  const loadDashboard = async (providerId: string) => {
    try {
      const res = await fetch(`/api/portal-proveedor/dashboard?providerId=${providerId}`);
      if (res.ok) setData(await res.json());
      else toast.error('Error al cargar dashboard');
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth-proveedor/logout', { method: 'POST', credentials: 'include' });
      toast.success('Sesión cerrada exitosamente');
      router.push('/portal-proveedor/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      pendiente: 'secondary',
      'en-progreso': 'default',
      completado: 'default',
      cancelado: 'outline',
    };
    return <Badge variant={variants[estado] || 'default'}>{estado}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Portal Proveedor</h1>
              <p className="text-muted-foreground">{data.proveedor.nombre}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.totalOrdenes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.ordenesPendientes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.ordenesEnProgreso}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.ordenesCompletadas}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <Euro className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{data.kpis.ingresosTotales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Este Mes</CardTitle>
                <Euro className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{data.kpis.ingresosMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Órdenes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {data.ordenesRecientes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay órdenes de trabajo asignadas</p>
              ) : (
                <div className="space-y-4">
                  {data.ordenesRecientes.map((orden) => (
                    <div key={orden.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium">{orden.titulo}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{orden.descripcion}</p>
                        </div>
                        {getEstadoBadge(orden.estado)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-3">
                        <div>
                          <span className="text-muted-foreground">Edificio:</span>
                          <p className="font-medium">{orden.building?.nombre || 'N/A'}</p>
                        </div>
                        {orden.unit && (
                          <div>
                            <span className="text-muted-foreground">Unidad:</span>
                            <p className="font-medium">{orden.unit.numero}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Fecha:</span>
                          <p className="font-medium">{format(new Date(orden.createdAt), 'dd/MM/yyyy', { locale: es })}</p>
                        </div>
                        {orden.costoTotal && (
                          <div>
                            <span className="text-muted-foreground">Costo:</span>
                            <p className="font-medium">€{orden.costoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
