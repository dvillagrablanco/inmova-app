'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { KPICard } from '@/components/ui/kpi-card';
import { LoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import logger, { logError } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Download,
  Calendar,
  ArrowLeft,
  Home,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from '@/components/ui/lazy-charts-extended';

interface GlobalReport {
  ingresosBrutos: number;
  gastos: number;
  ingresosNetos: number;
  rentabilidadBruta: number;
  rentabilidadNeta: number;
  roi: number;
  unidades: number;
  unidadesOcupadas: number;
  tasaOcupacion: number;
}

interface PropertyReport {
  id: string;
  nombre: string;
  direccion: string;
  ingresosBrutos: number;
  gastos: number;
  ingresosNetos: number;
  rentabilidadBruta: number;
  rentabilidadNeta: number;
  roi: number;
  unidades: number;
  unidadesOcupadas: number;
  tasaOcupacion: number;
}

interface FlujoCajaItem {
  mes: string;
  ingresos: number;
  gastos: number;
  neto: number;
}

function ReportesPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [tipoReporte, setTipoReporte] = useState<'global' | 'por_propiedad' | 'flujo_caja'>(
    'global'
  );
  const [periodo, setPeriodo] = useState('12');
  const [globalData, setGlobalData] = useState<GlobalReport | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyReport[]>([]);
  const [flujoCaja, setFlujoCaja] = useState<FlujoCajaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchReportes = async () => {
      if (status !== 'authenticated') return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/reports?tipo=${tipoReporte}&periodo=${periodo}`);
        if (response.ok) {
          const data = await response.json();

          if (tipoReporte === 'global') {
            setGlobalData(data.global);
          } else if (tipoReporte === 'por_propiedad') {
            setPropertyData(data.reportes || []);
          } else if (tipoReporte === 'flujo_caja') {
            setFlujoCaja(data.flujoCaja || []);
          }
        }
      } catch (error) {
        logger.error('Error fetching reportes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportes();
  }, [status, tipoReporte, periodo]);

  const exportToCSV = () => {
    let csvContent = '';
    let filename = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.csv`;

    if (tipoReporte === 'global' && globalData) {
      csvContent = 'Métrica,Valor\\n';
      csvContent += `Ingresos Brutos,€${globalData.ingresosBrutos.toLocaleString('es-ES')}\\n`;
      csvContent += `Gastos,€${globalData.gastos.toLocaleString('es-ES')}\\n`;
      csvContent += `Ingresos Netos,€${globalData.ingresosNetos.toLocaleString('es-ES')}\\n`;
      csvContent += `Rentabilidad Bruta,${globalData.rentabilidadBruta}%\\n`;
      csvContent += `Rentabilidad Neta,${globalData.rentabilidadNeta}%\\n`;
      csvContent += `ROI,${globalData.roi}%\\n`;
      csvContent += `Tasa de Ocupación,${globalData.tasaOcupacion}%\\n`;
    } else if (tipoReporte === 'por_propiedad') {
      csvContent =
        'Propiedad,Dirección,Ingresos Brutos,Gastos,Ingresos Netos,Rentabilidad Bruta %,Rentabilidad Neta %,ROI %,Unidades,Ocupadas,Tasa Ocupación %\\n';
      propertyData.forEach((prop) => {
        csvContent += `"${prop.nombre}","${prop.direccion}",€${prop.ingresosBrutos},€${prop.gastos},€${prop.ingresosNetos},${prop.rentabilidadBruta},${prop.rentabilidadNeta},${prop.roi},${prop.unidades},${prop.unidadesOcupadas},${prop.tasaOcupacion}\\n`;
      });
    } else if (tipoReporte === 'flujo_caja') {
      csvContent = 'Mes,Ingresos,Gastos,Flujo Neto\\n';
      flujoCaja.forEach((item) => {
        csvContent += `${item.mes},€${item.ingresos},€${item.gastos},€${item.neto}\\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState message="Cargando reportes..." size="lg" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
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
                    <BreadcrumbPage>Reportes</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reportes Financieros</h1>
              <p className="text-muted-foreground">
                Análisis detallado de rentabilidad y flujo de caja
              </p>
            </div>

            {/* Controles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Reporte
                  </label>
                  <select
                    value={tipoReporte}
                    onChange={(e) => setTipoReporte(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="global">Reporte Global</option>
                    <option value="por_propiedad">Por Propiedad</option>
                    <option value="flujo_caja">Flujo de Caja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="3">Últimos 3 meses</option>
                    <option value="6">Últimos 6 meses</option>
                    <option value="12">Últimos 12 meses</option>
                    <option value="24">Últimos 24 meses</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={exportToCSV}
                    className="w-full px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all shadow-primary flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Exportar CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Reporte Global */}
            {tipoReporte === 'global' && globalData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <KPICard
                    title="Ingresos Brutos"
                    value={`€${globalData.ingresosBrutos.toLocaleString('es-ES')}`}
                    icon={DollarSign}
                  />
                  <KPICard
                    title="Ingresos Netos"
                    value={`€${globalData.ingresosNetos.toLocaleString('es-ES')}`}
                    icon={TrendingUp}
                  />
                  <KPICard title="ROI" value={`${globalData.roi.toFixed(1)}%`} icon={TrendingUp} />
                  <KPICard
                    title="Rentabilidad Neta"
                    value={`${globalData.rentabilidadNeta.toFixed(1)}%`}
                    icon={PieChartIcon}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Métricas Financieras</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Ingresos Brutos</span>
                        <span className="font-semibold text-gray-900">
                          €{globalData.ingresosBrutos.toLocaleString('es-ES')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Gastos Totales</span>
                        <span className="font-semibold text-red-600">
                          €{globalData.gastos.toLocaleString('es-ES')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <span className="text-gray-900 font-medium">Ingresos Netos</span>
                        <span className="font-bold text-green-700 text-lg">
                          €{globalData.ingresosNetos.toLocaleString('es-ES')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Rentabilidad Bruta</span>
                        <span className="font-semibold text-gray-900">
                          {globalData.rentabilidadBruta}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Rentabilidad Neta</span>
                        <span className="font-semibold text-gray-900">
                          {globalData.rentabilidadNeta}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Métricas de Ocupación</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Total Unidades</span>
                        <span className="font-semibold text-gray-900">{globalData.unidades}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Unidades Ocupadas</span>
                        <span className="font-semibold text-green-600">
                          {globalData.unidadesOcupadas}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Unidades Disponibles</span>
                        <span className="font-semibold text-blue-600">
                          {globalData.unidades - globalData.unidadesOcupadas}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <span className="text-gray-900 font-medium">Tasa de Ocupación</span>
                        <span className="font-bold text-blue-700 text-lg">
                          {globalData.tasaOcupacion}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${globalData.tasaOcupacion}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Reporte Por Propiedad */}
            {tipoReporte === 'por_propiedad' && propertyData.length > 0 && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Comparativa por Propiedad
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={propertyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip wrapperStyle={{ fontSize: 11 }} />
                      <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="ingresosBrutos" fill="#000000" name="Ingresos Brutos" />
                      <Bar dataKey="gastos" fill="#EF4444" name="Gastos" />
                      <Bar dataKey="ingresosNetos" fill="#10B981" name="Ingresos Netos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Detalle por Propiedad</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Propiedad
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">
                            Ing. Brutos
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">
                            Gastos
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">
                            Ing. Netos
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">
                            ROI %
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">
                            Rent. Neta %
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">
                            Ocupación %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertyData.map((prop) => (
                          <tr key={prop.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{prop.nombre}</p>
                                <p className="text-sm text-gray-500">{prop.direccion}</p>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 text-gray-900">
                              €{prop.ingresosBrutos.toLocaleString('es-ES')}
                            </td>
                            <td className="text-right py-3 px-4 text-red-600">
                              €{prop.gastos.toLocaleString('es-ES')}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-green-600">
                              €{prop.ingresosNetos.toLocaleString('es-ES')}
                            </td>
                            <td className="text-right py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-sm font-medium ${
                                  prop.roi > 20
                                    ? 'bg-green-100 text-green-800'
                                    : prop.roi > 10
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {prop.roi.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-right py-3 px-4 text-gray-900">
                              {prop.rentabilidadNeta.toFixed(1)}%
                            </td>
                            <td className="text-right py-3 px-4 text-gray-900">
                              {prop.tasaOcupacion.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Flujo de Caja */}
            {tipoReporte === 'flujo_caja' && flujoCaja.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Flujo de Caja Mensual</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={flujoCaja}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip wrapperStyle={{ fontSize: 11 }} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      stroke="#000000"
                      name="Ingresos"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="gastos"
                      stroke="#EF4444"
                      name="Gastos"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="neto"
                      stroke="#10B981"
                      name="Flujo Neto"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Mes</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">
                          Ingresos
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Gastos</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">
                          Flujo Neto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {flujoCaja.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{item.mes}</td>
                          <td className="text-right py-3 px-4 text-gray-900">
                            €{item.ingresos.toLocaleString('es-ES')}
                          </td>
                          <td className="text-right py-3 px-4 text-red-600">
                            €{item.gastos.toLocaleString('es-ES')}
                          </td>
                          <td className="text-right py-3 px-4">
                            <span
                              className={`font-semibold ${
                                item.neto > 0
                                  ? 'text-green-600'
                                  : item.neto < 0
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                              }`}
                            >
                              €{item.neto.toLocaleString('es-ES')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {((tipoReporte === 'por_propiedad' && propertyData.length === 0) ||
              (tipoReporte === 'flujo_caja' && flujoCaja.length === 0)) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <BarChartIcon className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay datos disponibles
                </h3>
                <p className="text-gray-600">
                  No se encontraron datos para el período seleccionado. Intenta con otro rango de
                  fechas.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ReportesPage() {
  return (
    <ErrorBoundary>
      <ReportesPageContent />
    </ErrorBoundary>
  );
}
