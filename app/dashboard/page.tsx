'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { KPICard } from '@/components/ui/kpi-card';
import { ContextualHelp } from '@/components/ui/contextual-help';
import { LoadingState } from '@/components/ui/loading-state';
import { SkeletonKPICards, SkeletonChart, SkeletonList } from '@/components/ui/skeleton-loaders';
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
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from '@/components/ui/lazy-charts-extended';
import Link from 'next/link';
import { AIAssistant } from '@/components/automation/AIAssistant';
import SmartOnboardingWizard from '@/components/automation/SmartOnboardingWizard';
import ProactiveSuggestions from '@/components/automation/ProactiveSuggestions';
import IntelligentSupportChatbot from '@/components/automation/IntelligentSupportChatbot';
import InactiveModules from './components/InactiveModules';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { VerticalSpecificWidgets } from '@/components/dashboard/VerticalSpecificWidgets';
import DemoDataGenerator from '@/components/automation/DemoDataGenerator';
import logger, { logError } from '@/lib/logger';
import { ContextualQuickActions } from '@/components/navigation/contextual-quick-actions';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

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
  esEmpresaPrueba?: boolean; // Flag para mostrar generador de datos demo
}

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#8B5CF6', '#A78BFA']; // Indigo, Violet, Pink gradients

// Helper function to safely format numbers
const safeFormatNumber = (value: number | null | undefined, locale: string = 'es-ES'): string => {
  const numValue = value ?? 0;
  return numValue.toLocaleString(locale);
};

function DashboardPageContent() {
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
      } catch (error: any) {
        logger.error('Error fetching dashboard data:', {
          message: error?.message || 'Unknown error',
          name: error?.name,
          stack: error?.stack?.substring(0, 200),
        });
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
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* KPIs Grid */}
          <div className="mb-8">
            <SkeletonKPICards count={4} />
          </div>

          {/* Financial KPIs */}
          <div className="mb-8">
            <div className="grid gap-4 md:grid-cols-3">
              <SkeletonKPICards count={3} />
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <SkeletonChart height={300} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart height={300} />
              <SkeletonChart height={300} />
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session || !data || !data.kpis) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600">No hay datos disponibles</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout maxWidth="7xl">
          <div className="max-w-7xl mx-auto">
            {/* Header con Quick Actions */}
            <div className="mb-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1">Bienvenido, {session?.user?.name || 'Usuario'}</p>
                </div>
                
                {/* Quick Actions */}
                <ContextualQuickActions
                  pendingPayments={data?.pagosPendientes?.length || 0}
                />
              </div>
            </div>

            {/* Smart Onboarding Wizard - Sistema automatizado de configuración inicial */}
            <SmartOnboardingWizard />
            {/* Demo Data Generator - Solo visible para empresas de prueba/demo sin datos */}
            {data?.esEmpresaPrueba && data?.kpis?.numeroPropiedades === 0 && <DemoDataGenerator />}

            {/* Vertical-Specific Widgets - Accesos rápidos personalizados por tipo de negocio */}
            <div data-tour="quick-actions">
              <VerticalSpecificWidgets className="mb-8" />
            </div>

            {/* Proactive Suggestions - Sugerencias inteligentes personalizadas */}

            {/* Inactive Modules - Módulos disponibles para activar */}
            <InactiveModules />
            <ProactiveSuggestions />

            {/* KPIs Grid */}
            <div data-tour="kpi-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard
                title="Ingresos Mensuales"
                value={`€${safeFormatNumber(Number(data.kpis.ingresosTotalesMensuales || 0))}`}
                icon={TrendingUp}
              />
              <KPICard
                title="Total Propiedades"
                value={Number(data.kpis.numeroPropiedades || 0)}
                icon={Building2}
              />
              <KPICard
                title="Tasa de Ocupación"
                value={Number(data.kpis.tasaOcupacion || 0).toFixed(1)}
                suffix="%"
                icon={Percent}
              />
              <KPICard
                title="Tasa de Morosidad"
                value={Number(data.kpis.tasaMorosidad || 0).toFixed(1)}
                suffix="%"
                icon={AlertTriangle}
              />
            </div>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard
                title="Ingresos Netos"
                value={`€${safeFormatNumber(Number(data.kpis.ingresosNetos || 0))}`}
                icon={DollarSign}
              />
              <KPICard
                title="Gastos Totales"
                value={`€${safeFormatNumber(Number(data.kpis.gastosTotales || 0))}`}
                icon={TrendingDown}
              />
              <KPICard title="Margen Neto" value={Number(data.kpis.margenNeto || 0).toFixed(1)} suffix="%" icon={Percent} />
            </div>

            {/* Monthly Income Chart - Optimizado para móvil */}
            <div data-tour="charts" className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                Ingresos Mensuales
              </h2>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart
                  data={data.monthlyIncome}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#666' }}
                    className="sm:text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#666' }}
                    className="sm:text-xs"
                    width={40}
                  />
                  <Tooltip
                    wrapperStyle={{ fontSize: 11 }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: 10, paddingBottom: 10 }}
                    className="sm:text-xs"
                  />
                  <Bar dataKey="ingresos" fill="#000000" name="Ingresos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Additional Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Occupancy by Unit Type - Optimizado para móvil */}
              {data.occupancyChartData && data.occupancyChartData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Ocupación por Tipo
                  </h2>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <BarChart
                      data={data.occupancyChartData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#666' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tickLine={false} tick={{ fontSize: 9, fill: '#666' }} width={35} />
                      <Tooltip
                        wrapperStyle={{ fontSize: 11 }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        wrapperStyle={{ fontSize: 10, paddingBottom: 10 }}
                      />
                      <Bar
                        dataKey="ocupadas"
                        fill="#000000"
                        name="Ocupadas"
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar dataKey="disponibles" fill="#9CA3AF" name="Disponibles" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Expenses by Category - Optimizado para móvil */}
              {data.expensesChartData && data.expensesChartData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Gastos por Categoría
                  </h2>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <PieChart>
                      <Pie
                        data={data.expensesChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={70}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {data.expensesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        wrapperStyle={{ fontSize: 11 }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                    {data.expensesChartData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">€{safeFormatNumber(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Data Tables Grid */}
            <div data-tour="alerts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div
                      key={pago?.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{pago?.periodo}</p>
                        <p className="text-sm text-gray-600">
                          €{Number(pago?.monto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
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
                      (new Date(contract?.fechaFin).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={contract?.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {contract?.unit?.building?.nombre} - {contract?.unit?.numero}
                          </p>
                          <p className="text-sm text-gray-600">
                            {contract?.tenant?.nombreCompleto}
                          </p>
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
                    <div
                      key={req?.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
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
                  )) ?? (
                    <p className="text-gray-500 text-sm">No hay solicitudes de mantenimiento</p>
                  )}
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
                    <div
                      key={unit?.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
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
            module="dashboard"
            title="Dashboard"
            description="Panel principal con métricas y análisis de tu negocio inmobiliario"
            sections={[
              {
                title: 'Recursos de ayuda',
                content:
                  'Aprende a interpretar los KPIs principales, personalizar vistas y generar reportes financieros completos.',
                tips: [
                  'Consulta la guía de introducción en la sección de módulos',
                  'Personaliza tu dashboard desde configuración',
                  'Accede a tutoriales de análisis financiero',
                ],
              },
              {
                title: 'Consejos rápidos',
                content:
                  'Maximiza tu productividad con estos consejos útiles para el uso del dashboard.',
                tips: [
                  'Haz clic en cualquier KPI para ver más detalles y análisis histórico',
                  'Usa los filtros de fecha para comparar períodos diferentes',
                  'Los datos se actualizan automáticamente cada 5 minutos',
                  'Puedes exportar cualquier gráfico haciendo clic derecho sobre él',
                ],
              },
            ]}
          />

          <AIAssistant />
          {/* Chatbot inteligente de soporte 24/7 - Sistema automatizado sin intervenci\u00f3n humana */}
          <IntelligentSupportChatbot />
          
          {/* Onboarding Tour Guiado */}
          <OnboardingTour role={session?.user?.role} />
        </AuthenticatedLayout>
      );
    }

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardPageContent />
    </ErrorBoundary>
  );
}
