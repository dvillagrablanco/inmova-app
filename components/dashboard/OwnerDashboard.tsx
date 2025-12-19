'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Home,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Clock,
  Users,
  CheckCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardData {
  kpis: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: string;
    monthlyIncome: number;
    monthlyExpenses: number;
    netProfit: number;
    pendingPayments: number;
    pendingPaymentsCount: number;
    urgentMaintenance: number;
  };
  charts: {
    monthlyData: Array<{
      month: string;
      income: number;
      expenses: number;
      profit: number;
    }>;
    occupancyByProperty: Array<{
      name: string;
      totalUnits: number;
      occupiedUnits: number;
      occupancyRate: string;
    }>;
    paymentDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  alerts: {
    upcomingExpirations: Array<{
      id: string;
      property: string;
      tenant: string;
      expirationDate: string;
      daysLeft: number;
    }>;
    vacantUnits: Array<{
      id: string;
      name: string;
    }>;
  };
}

export function OwnerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/owner');
        if (!response.ok) {
          throw new Error('Error al cargar datos del dashboard');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error al cargar dashboard:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'No se pudieron cargar los datos'}</p>
        </div>
      </div>
    );
  }

  const { kpis, charts, alerts } = data;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Propiedades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalProperties}</div>
            <p className="text-xs text-muted-foreground">{kpis.totalUnits} unidades totales</p>
          </CardContent>
        </Card>

        {/* Tasa de ocupación */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {kpis.occupiedUnits} de {kpis.totalUnits} unidades
            </p>
          </CardContent>
        </Card>

        {/* Ingresos del mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ganancia neta: {formatCurrency(kpis.netProfit)}
            </p>
          </CardContent>
        </Card>

        {/* Pagos pendientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(kpis.pendingPayments)}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.pendingPaymentsCount} pagos pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Gastos (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  name="Ingresos"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  name="Gastos"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ocupación por propiedad */}
        <Card>
          <CardHeader>
            <CardTitle>Ocupación por Propiedad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.occupancyByProperty}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupiedUnits" fill="#6366f1" name="Ocupadas" />
                <Bar dataKey="totalUnits" fill="#e5e7eb" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.paymentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {charts.paymentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ganancia neta */}
        <Card>
          <CardHeader>
            <CardTitle>Ganancia Neta (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar
                  dataKey="profit"
                  fill="#10b981"
                  name="Ganancia Neta"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y avisos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos vencimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Próximos Vencimientos de Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.upcomingExpirations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay contratos próximos a vencer</p>
            ) : (
              <div className="space-y-3">
                {alerts.upcomingExpirations.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{exp.property}</p>
                      <p className="text-xs text-muted-foreground">{exp.tenant}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        Vence en {exp.daysLeft} días
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(exp.expirationDate), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unidades vacantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-gray-600" />
              Unidades Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.vacantUnits.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm">Todas las unidades están ocupadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.vacantUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <p className="text-sm font-medium">{unit.name}</p>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      Disponible
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mantenimiento urgente */}
      {kpis.urgentMaintenance > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Mantenimiento Urgente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              Tienes {kpis.urgentMaintenance} solicitudes de mantenimiento urgente pendientes.
              Es importante atenderlas lo antes posible.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
