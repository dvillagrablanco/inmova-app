'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  Home,
  DoorOpen,
  Users,
  Euro,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  AlertCircle,
  Building,
  User,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

interface DashboardData {
  unit: {
    id: string;
    nombre: string;
    direccion: string;
  };
  stats: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    totalTenants: number;
    occupancyRate: number;
    monthlyRevenue: number;
    averageRoomPrice: number;
    upcomingCheckouts: number;
  };
  roomsOverview: {
    roomId: string;
    numero: string;
    superficie: number;
    precio: number;
    estado: string;
    tenantName: string | null;
    tenantEmail: string | null;
    contratoFin: string | null;
    numOcupantes: number;
    diasRestantes: number | null;
  }[];
  recentPayments: {
    id: string;
    monto: number;
    fecha: string;
    tenantName: string;
    roomNumero: string;
  }[];
  expensesSummary: {
    total: number;
    electricidad: number;
    agua: number;
    gas: number;
    internet: number;
    limpieza: number;
  };
}

export default function CoLivingDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const unitId = params?.unitId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && unitId) {
      loadDashboard();
    }
  }, [status, unitId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/room-rental/${unitId}/dashboard`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error('Error al cargar dashboard');
      }
    } catch (error) {
      logger.error('Error loading dashboard:', error);
      toast.error('Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <LoadingState message="Cargando dashboard..." />;
  }

  const { unit, stats, roomsOverview, recentPayments, expensesSummary } = data;

  return (
    <div className="flex min-h-screen bg-gradient-bg">
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/room-rental">Co-Living</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard - {unit.nombre}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{unit.nombre}</h1>
                  <p className="text-sm text-gray-600 mt-1">{unit.direccion}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(`/room-rental/${unitId}`)}>
                  Ver Habitaciones
                </Button>
                <Button
                  className="gradient-primary shadow-primary"
                  onClick={() => router.push(`/room-rental/${unitId}/proration`)}
                >
                  Prorratear Gastos
                </Button>
              </div>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tasa de Ocupación</p>
                      <p className="text-3xl font-bold text-indigo-900">
                        {stats.occupancyRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {stats.occupiedRooms} de {stats.totalRooms} habitaciones
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-600 rounded-xl">
                      <PieChart className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ingresos Mensuales</p>
                      <p className="text-3xl font-bold text-green-900">
                        {stats.monthlyRevenue.toFixed(0)}€
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Ø {stats.averageRoomPrice.toFixed(0)}€ por habitación
                      </p>
                    </div>
                    <div className="p-3 bg-green-600 rounded-xl">
                      <Euro className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Inquilinos</p>
                      <p className="text-3xl font-bold text-purple-900">{stats.totalTenants}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {stats.availableRooms} habitación{stats.availableRooms !== 1 ? 'es' : ''}{' '}
                        disponible{stats.availableRooms !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-600 rounded-xl">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Próximas Salidas</p>
                      <p className="text-3xl font-bold text-orange-900">
                        {stats.upcomingCheckouts}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">En los próximos 30 días</p>
                    </div>
                    <div className="p-3 bg-orange-600 rounded-xl">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gastos compartidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Resumen de Gastos Compartidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {expensesSummary.total.toFixed(2)}€
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Electricidad</p>
                      <p className="text-lg font-bold text-blue-900">
                        {expensesSummary.electricidad.toFixed(2)}€
                      </p>
                    </div>
                    <div className="text-center p-3 bg-cyan-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Agua</p>
                      <p className="text-lg font-bold text-cyan-900">
                        {expensesSummary.agua.toFixed(2)}€
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Gas</p>
                      <p className="text-lg font-bold text-red-900">
                        {expensesSummary.gas.toFixed(2)}€
                      </p>
                    </div>
                    <div className="text-center p-3 bg-violet-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Internet</p>
                      <p className="text-lg font-bold text-violet-900">
                        {expensesSummary.internet.toFixed(2)}€
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Limpieza</p>
                      <p className="text-lg font-bold text-green-900">
                        {expensesSummary.limpieza.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vista general de habitaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DoorOpen className="h-5 w-5 text-indigo-600" />
                  Estado de Habitaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roomsOverview.map((room) => (
                    <div
                      key={room.roomId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            room.estado === 'ocupada' ? 'bg-green-100' : 'bg-gray-100'
                          }`}
                        >
                          <DoorOpen
                            className={`h-5 w-5 ${
                              room.estado === 'ocupada' ? 'text-green-600' : 'text-gray-400'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">Habitación {room.numero}</p>
                            <Badge variant={room.estado === 'ocupada' ? 'default' : 'secondary'}>
                              {room.estado}
                            </Badge>
                          </div>
                          {room.tenantName ? (
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {room.tenantName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {room.numOcupantes} ocupante{room.numOcupantes !== 1 ? 's' : ''}
                              </span>
                              {room.diasRestantes !== null && (
                                <span
                                  className={`flex items-center gap-1 ${
                                    room.diasRestantes <= 30 ? 'text-orange-600 font-medium' : ''
                                  }`}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {room.diasRestantes} días restantes
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Habitación disponible</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {room.precio}€<span className="text-sm text-gray-500">/mes</span>
                        </p>
                        <p className="text-xs text-gray-500">{room.superficie}m²</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pagos recientes */}
            {recentPayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Pagos Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{payment.tenantName}</p>
                          <p className="text-sm text-gray-500">Habitación {payment.roomNumero}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{payment.monto.toFixed(2)}€</p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
