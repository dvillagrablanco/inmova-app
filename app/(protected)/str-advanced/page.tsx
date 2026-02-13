/**
 * Página principal del módulo STR Avanzado
 * Dashboard central con resumen de todas las áreas
 */

'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  DollarSign,
  Users,
  Home,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Shield,
  Sparkles,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';

export default function STRAdvancedDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalListings: 0,
    activeBookings: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    pendingTasks: 0,
    legalCompliance: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.companyId) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar datos reales desde API STR
      const [listingsRes, bookingsRes] = await Promise.all([
        fetch('/api/str/listings').catch(() => null),
        fetch('/api/str/bookings').catch(() => null),
      ]);

      let totalListings = 0;
      let activeBookings = 0;
      let monthlyRevenue = 0;
      let occupancyRate = 0;

      if (listingsRes?.ok) {
        const data = await listingsRes.json();
        const listings = data.data || data || [];
        totalListings = Array.isArray(listings) ? listings.length : 0;
        const activos = Array.isArray(listings) ? listings.filter((l: any) => l.activo).length : 0;
        occupancyRate = totalListings > 0 ? Math.round((activos / totalListings) * 100) : 0;
      }

      if (bookingsRes?.ok) {
        const data = await bookingsRes.json();
        const bookings = data.data || data || [];
        if (Array.isArray(bookings)) {
          activeBookings = bookings.filter((b: any) => 
            b.estado === 'confirmada' || b.estado === 'checked_in'
          ).length;
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          monthlyRevenue = bookings
            .filter((b: any) => new Date(b.checkInDate || b.checkIn) >= monthStart)
            .reduce((sum: number, b: any) => sum + (Number(b.precioTotal) || 0), 0);
        }
      }

      setDashboardData({
        totalListings,
        activeBookings,
        monthlyRevenue,
        occupancyRate,
        pendingTasks: 0,
        legalCompliance: 0,
      });
    } catch (error) {
      logger.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">STR Avanzado</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Gestión profesional de alquileres de corta duración
              </p>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Propiedades Activas</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardData.totalListings}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboardData.activeBookings} reservas activas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    €{dashboardData.monthlyRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600 mt-1">+12% vs mes anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardData.occupancyRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Tasa de ocupación promedio</p>
                </CardContent>
              </Card>
            </div>

            {/* Módulos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Channel Manager */}
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/str-advanced/channel-manager')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Channel Manager</CardTitle>
                      <CardDescription>Gestión unificada de canales</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Canales conectados</span>
                      <Badge variant="secondary">4</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Última sincronización</span>
                      <span className="text-sm">Hace 15 min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Management */}
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/str-advanced/revenue')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Revenue Management</CardTitle>
                      <CardDescription>Optimización de ingresos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estrategias activas</span>
                      <Badge variant="secondary">3</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">RevPAR promedio</span>
                      <span className="text-sm font-medium">€127</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Housekeeping */}
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/str-advanced/housekeeping')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ClipboardCheck className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Housekeeping</CardTitle>
                      <CardDescription>Gestión de limpieza</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tareas pendientes</span>
                      <Badge variant="destructive">{dashboardData.pendingTasks}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Hoy</span>
                      <span className="text-sm">3 limpiezas programadas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Experience */}
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/str-advanced/guest-experience')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Star className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>Guest Experience</CardTitle>
                      <CardDescription>Experiencia del huésped</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rating promedio</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">4.8</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Guías digitales</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas y Cumplimiento Legal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alertas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Alertas Recientes</CardTitle>
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Check-out pendiente</p>
                        <p className="text-xs text-muted-foreground">
                          Piso Malasaña - Confirmación de limpieza requerida
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Licencia próxima a caducar</p>
                        <p className="text-xs text-muted-foreground">
                          Apartamento Retiro - Caduca en 25 días
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cumplimiento Legal */}
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/str-advanced/legal')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Shield className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle>Cumplimiento Legal</CardTitle>
                        <CardDescription>Regulación STR</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Cumplimiento Global</span>
                        <span className="font-medium">{dashboardData.legalCompliance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${dashboardData.legalCompliance}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Con licencia</span>
                      <Badge variant="default">11/12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Partes pendientes</span>
                      <Badge variant="secondary">2</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones rápidas */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/str/listings/new')}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Nueva Propiedad
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/str/bookings/new')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Nueva Reserva
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/str-advanced/revenue')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Ver Ingresos
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/str-advanced/housekeeping')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Gestionar Tareas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
