'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { KPICard } from '@/components/ui/kpi-card';
import { ContextualHelp } from '@/components/ui/contextual-help';
import {
  TrendingUp,
  Building2,
  Percent,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  FileText,
  Wrench,
  Home,
} from 'lucide-react';
import { AdvancedAnalytics } from './components/advanced-analytics';
import { PendingApprovals } from './components/pending-approvals';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';

interface DashboardData {
  kpis: {
    ingresosTotalesMensuales: number;
    numeroPropiedades: number;
    tasaOcupacion: number;
    tasaMorosidad: number;
    ingresosNetos: number;
    gastosTotales: number;
    margenNeto: number;
  };
  monthlyIncome: Array<{ mes: string; ingresos: number }>;
  occupancyChartData: Array<{ name: string; ocupadas: number; disponibles: number; total: number }>;
  expensesChartData: Array<{ name: string; value: number }>;
  pagosPendientes: any[];
  contractsExpiringSoon: any[];
  maintenanceRequests: any[];
  unidadesDisponibles: any[];
}

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#8B5CF6', '#A78BFA']; // Indigo, Violet, Pink gradients

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const dashboardData = await response.json();

        // Fetch analytics data
        const analyticsResponse = await fetch('/api/dashboard/analytics');
        if (analyticsResponse.ok) {
          const analytics = await analyticsResponse.json();
          setAnalyticsData(analytics);
        }
          setData(dashboardData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen bg-gradient-bg items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || !data || !data.kpis) {
    return (
      <div className="flex h-screen bg-gradient-bg items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, {session?.user?.name || 'Usuario'}
            </p>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Ingresos Mensuales"
              value={`€${data.kpis.ingresosTotalesMensuales.toLocaleString('es-ES')}`}
              icon={TrendingUp}
            />
            <KPICard
              title="Total Propiedades"
              value={data.kpis.numeroPropiedades}
              icon={Building2}
            />
            <KPICard
              title="Tasa de Ocupación"
              value={data.kpis.tasaOcupacion}
              suffix="%"
              icon={Percent}
            />
            <KPICard
              title="Tasa de Morosidad"
              value={data.kpis.tasaMorosidad}
              suffix="%"
              icon={AlertTriangle}
            />
          </div>

          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KPICard
              title="Ingresos Netos"
              value={`€${data.kpis.ingresosNetos.toLocaleString('es-ES')}`}
              icon={DollarSign}
            />
            <KPICard
              title="Gastos Totales"
              value={`€${data.kpis.gastosTotales.toLocaleString('es-ES')}`}
              icon={TrendingDown}
            />
            <KPICard
              title="Margen Neto"
              value={data.kpis.margenNeto}
              suffix="%"
              icon={Percent}
            />
          </div>

          {/* Monthly Income Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Ingresos Mensuales</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyIncome}>
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Mes', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <YAxis
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Ingresos (€)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <Tooltip wrapperStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ingresos" fill="#000000" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Additional Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Occupancy by Unit Type */}
            {data.occupancyChartData && data.occupancyChartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ocupación por Tipo de Unidad</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.occupancyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip wrapperStyle={{ fontSize: 11 }} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ocupadas" fill="#000000" name="Ocupadas" stackId="a" />
                    <Bar dataKey="disponibles" fill="#9CA3AF" name="Disponibles" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Expenses by Category */}
            {data.expensesChartData && data.expensesChartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Gastos por Categoría</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.expensesChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.expensesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {data.expensesChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold">€{item.value.toLocaleString('es-ES')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Data Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Payments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} />
                  Pagos Pendientes
                </h2>
                <Link href="/pagos" className="text-sm text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="space-y-3">
                {data.pagosPendientes?.slice(0, 5)?.map((pago) => (
                  <div key={pago?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{pago?.periodo}</p>
                      <p className="text-sm text-gray-600">€{pago?.monto?.toLocaleString('es-ES')}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pago?.nivelRiesgo === 'alto'
                          ? 'bg-red-100 text-red-800'
                          : pago?.nivelRiesgo === 'medio'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {pago?.nivelRiesgo}
                    </span>
                  </div>
                )) ?? <p className="text-gray-500 text-sm">No hay pagos pendientes</p>}
              </div>
            </div>

            {/* Contracts Expiring Soon */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} />
                  Contratos por Vencer
                </h2>
                <Link href="/contratos" className="text-sm text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="space-y-3">
                {data.contractsExpiringSoon?.map((contract) => {
                  const diasHastaVencimiento = Math.ceil(
                    (new Date(contract?.fechaFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={contract?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {contract?.unit?.building?.nombre} - {contract?.unit?.numero}
                        </p>
                        <p className="text-sm text-gray-600">{contract?.tenant?.nombreCompleto}</p>
                      </div>
                      <span className="text-sm font-medium text-orange-600">
                        {diasHastaVencimiento} días
                      </span>
                    </div>
                  );
                }) ?? <p className="text-gray-500 text-sm">No hay contratos próximos a vencer</p>}
              </div>
            </div>

            {/* Active Maintenance Requests */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wrench size={20} />
                  Mantenimiento Activo
                </h2>
                <Link href="/mantenimiento" className="text-sm text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="space-y-3">
                {data.maintenanceRequests?.slice(0, 5)?.map((req) => (
                  <div key={req?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{req?.titulo}</p>
                      <p className="text-sm text-gray-600">{req?.unit?.numero}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req?.prioridad === 'alta'
                          ? 'bg-red-100 text-red-800'
                          : req?.prioridad === 'media'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {req?.prioridad}
                    </span>
                  </div>
                )) ?? <p className="text-gray-500 text-sm">No hay solicitudes de mantenimiento</p>}
              </div>
            </div>

            {/* Available Units */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Home size={20} />
                  Unidades Disponibles
                </h2>
                <Link href="/unidades" className="text-sm text-blue-600 hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="space-y-3">
                {data.unidadesDisponibles?.slice(0, 5)?.map((unit) => (
                  <div key={unit?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {unit?.building?.nombre} - {unit?.numero}
                      </p>
                      <p className="text-sm text-gray-600">
                        {unit?.tipo} • {unit?.superficie}m²
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      €{unit?.rentaMensual?.toLocaleString('es-ES')}/mes
                    </span>
                  </div>
                )) ?? <p className="text-gray-500 text-sm">No hay unidades disponibles</p>}
              </div>
            </div>
          </div>

          {/* Pending Approvals Section (Solo Administradores) */}
          {session?.user?.role === 'administrador' && (
            <div className="mt-8">
              <PendingApprovals />
            </div>
          )}

          {/* Advanced Analytics Section */}
          {analyticsData && analyticsData.monthlyData && (
            <div className="mt-8">
              <h2 className="mb-4 text-2xl font-bold">Analytics Avanzados</h2>
              <AdvancedAnalytics monthlyData={analyticsData.monthlyData} />
            </div>
          )}
          </div>
          
          {/* Contextual Help */}
          <ContextualHelp
            title="Dashboard"
            resources={[
              {
                title: 'Introducción al Dashboard',
                description: 'Aprende a interpretar los KPIs principales',
                type: 'tutorial',
                link: '/landing/modulos'
              },
              {
                title: 'Personalizar vistas',
                description: 'Configura tu dashboard a medida',
                type: 'doc'
              },
              {
                title: 'Análisis financiero',
                description: 'Guía completa de reportes financieros',
                type: 'video'
              }
            ]}
            quickTips={[
              'Haz clic en cualquier KPI para ver más detalles y análisis histórico',
              'Usa los filtros de fecha para comparar períodos diferentes',
              'Los datos se actualizan automáticamente cada 5 minutos',
              'Puedes exportar cualquier gráfico haciendo clic derecho sobre él'
            ]}
          />
        </main>
      </div>
    </div>
  );
}