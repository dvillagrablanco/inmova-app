'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Percent,
  DollarSign,
  AlertTriangle,
  Clock,
  FileText,
  Wrench,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Target,
  Wallet,
  Home,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
} from 'recharts';

interface RentalKPIs {
  operational: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    averageVacancyDays: number;
    turnoverRate: number;
    renewalRate: number;
    activeContracts: number;
    expiringContracts30Days: number;
    expiringContracts60Days: number;
    expiringContracts90Days: number;
  };
  financial: {
    monthlyGrossIncome: number;
    monthlyOperatingExpenses: number;
    monthlyNOI: number;
    annualizedNOI: number;
    grossYield: number;
    netYield: number;
    averageRentPerUnit: number;
    averageRentPerSqm: number;
    portfolioValue: number;
    capRate: number;
    netMargin: number;
  };
  collection: {
    totalReceivables: number;
    currentMonthCollected: number;
    collectionRate: number;
    delinquencyRate: number;
    delinquencyCount: number;
    averageDaysToCollect: number;
    aging: {
      current: number;
      days30to60: number;
      days60to90: number;
      over90Days: number;
    };
  };
  maintenance: {
    pendingRequests: number;
    inProgressRequests: number;
    completedThisMonth: number;
    averageResolutionDays: number;
    maintenanceCostMTD: number;
    maintenanceCostPerUnit: number;
    maintenanceAsPercentOfRevenue: number;
  };
  trends: {
    occupancyChange: number;
    incomeChange: number;
    noiChange: number;
    delinquencyChange: number;
  };
  charts: {
    monthlyIncome: Array<{ month: string; income: number; expenses: number; noi: number }>;
    occupancyHistory: Array<{ month: string; rate: number }>;
    collectionAging: Array<{ category: string; amount: number; count: number }>;
    incomeByPropertyType: Array<{ type: string; income: number; units: number }>;
    topPerformingProperties: Array<{ name: string; noi: number; yield: number; occupancy: number }>;
  };
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

// Helper para formatear moneda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper para formatear porcentaje
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

// Componente de tendencia
const TrendIndicator = ({ value, invertColors = false }: { value: number; invertColors?: boolean }) => {
  if (value === 0) {
    return <Minus className="h-4 w-4 text-gray-400" />;
  }
  
  const isPositive = invertColors ? value < 0 : value > 0;
  
  return (
    <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {value > 0 ? (
        <ArrowUpRight className="h-4 w-4 mr-1" />
      ) : (
        <ArrowDownRight className="h-4 w-4 mr-1" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

// KPI Card mejorado
const KPICardAdvanced = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  invertTrend = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  invertTrend?: boolean;
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-100',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
  };

  const iconStyles = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
  };

  return (
    <Card className={`${variantStyles[variant]} border shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="mt-2">
                <TrendIndicator value={trend} invertColors={invertTrend} />
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${iconStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function RentalKPIDashboard() {
  const [kpis, setKpis] = useState<RentalKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/rental-kpis');
      
      if (!res.ok) {
        throw new Error('Error al cargar KPIs');
      }
      
      const data = await res.json();
      setKpis(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">{error || 'No hay datos disponibles'}</p>
        <button
          onClick={fetchKPIs}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </button>
      </Card>
    );
  }

  const { operational, financial, collection, maintenance, charts, trends } = kpis;

  // Preparar datos para gráfico de aging
  const agingData = charts.collectionAging.map((item, index) => ({
    ...item,
    fill: COLORS[index],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Alquiler</h2>
          <p className="text-muted-foreground">Métricas profesionales de gestión inmobiliaria</p>
        </div>
        <button
          onClick={fetchKPIs}
          className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* Tabs para organizar KPIs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          <TabsTrigger value="collection">Cobranza</TabsTrigger>
          <TabsTrigger value="operations">Operaciones</TabsTrigger>
        </TabsList>

        {/* TAB: Resumen General */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPIs Principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICardAdvanced
              title="Tasa de Ocupación"
              value={formatPercent(operational.occupancyRate)}
              subtitle={`${operational.occupiedUnits}/${operational.totalUnits} unidades`}
              icon={Home}
              variant={operational.occupancyRate >= 90 ? 'success' : operational.occupancyRate >= 75 ? 'warning' : 'danger'}
            />
            <KPICardAdvanced
              title="NOI Mensual"
              value={formatCurrency(financial.monthlyNOI)}
              subtitle="Net Operating Income"
              icon={DollarSign}
              trend={trends.noiChange}
              variant={financial.monthlyNOI > 0 ? 'success' : 'danger'}
            />
            <KPICardAdvanced
              title="Tasa de Morosidad"
              value={formatPercent(collection.delinquencyRate)}
              subtitle={`${collection.delinquencyCount} pagos pendientes`}
              icon={AlertTriangle}
              invertTrend
              variant={collection.delinquencyRate <= 5 ? 'success' : collection.delinquencyRate <= 15 ? 'warning' : 'danger'}
            />
            <KPICardAdvanced
              title="Cap Rate"
              value={formatPercent(financial.capRate)}
              subtitle="Tasa de capitalización"
              icon={Target}
              variant={financial.capRate >= 6 ? 'success' : 'warning'}
            />
          </div>

          {/* Segunda fila de KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICardAdvanced
              title="Ingresos Brutos"
              value={formatCurrency(financial.monthlyGrossIncome)}
              subtitle="Este mes"
              icon={Wallet}
              trend={trends.incomeChange}
            />
            <KPICardAdvanced
              title="Margen Neto"
              value={formatPercent(financial.netMargin)}
              subtitle="(NOI / Ingresos)"
              icon={Percent}
              variant={financial.netMargin >= 60 ? 'success' : financial.netMargin >= 40 ? 'warning' : 'danger'}
            />
            <KPICardAdvanced
              title="ARPU"
              value={formatCurrency(financial.averageRentPerUnit)}
              subtitle="Ingreso por unidad"
              icon={Building2}
            />
            <KPICardAdvanced
              title="Días Cobro (DSO)"
              value={`${collection.averageDaysToCollect} días`}
              subtitle="Tiempo medio de cobro"
              icon={Clock}
              variant={collection.averageDaysToCollect <= 7 ? 'success' : collection.averageDaysToCollect <= 15 ? 'warning' : 'danger'}
            />
          </div>

          {/* Gráfico de Ingresos vs Gastos vs NOI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolución Financiera (6 meses)
              </CardTitle>
              <CardDescription>
                Ingresos, gastos y NOI mensual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={charts.monthlyIncome}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="noi"
                    name="NOI"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Contratos por vencer y Aging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contratos por vencer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Contratos por Vencer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span>Próximos 30 días</span>
                  </div>
                  <Badge variant="destructive">{operational.expiringContracts30Days}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    <span>31-60 días</span>
                  </div>
                  <Badge className="bg-amber-500">{operational.expiringContracts60Days}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span>61-90 días</span>
                  </div>
                  <Badge className="bg-blue-500">{operational.expiringContracts90Days}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tasa de Renovación</span>
                    <span className="font-semibold">{formatPercent(operational.renewalRate)}</span>
                  </div>
                  <Progress value={operational.renewalRate} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Aging de cobranza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Aging de Cuentas por Cobrar
                </CardTitle>
                <CardDescription>
                  Total pendiente: {formatCurrency(collection.totalReceivables)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={agingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                    >
                      {agingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {charts.collectionAging.map((item, index) => (
                    <div key={item.category} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-muted-foreground">{item.category}:</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Financiero */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <KPICardAdvanced
              title="Ingresos Brutos"
              value={formatCurrency(financial.monthlyGrossIncome)}
              subtitle="Mensual"
              icon={TrendingUp}
              trend={trends.incomeChange}
            />
            <KPICardAdvanced
              title="Gastos Operativos"
              value={formatCurrency(financial.monthlyOperatingExpenses)}
              subtitle="Mensual"
              icon={TrendingDown}
            />
            <KPICardAdvanced
              title="NOI Mensual"
              value={formatCurrency(financial.monthlyNOI)}
              subtitle="Net Operating Income"
              icon={DollarSign}
              trend={trends.noiChange}
              variant={financial.monthlyNOI > 0 ? 'success' : 'danger'}
            />
            <KPICardAdvanced
              title="NOI Anualizado"
              value={formatCurrency(financial.annualizedNOI)}
              subtitle="Proyección anual"
              icon={Activity}
            />
            <KPICardAdvanced
              title="Gross Yield"
              value={formatPercent(financial.grossYield)}
              subtitle="Rendimiento bruto"
              icon={Percent}
            />
            <KPICardAdvanced
              title="Net Yield"
              value={formatPercent(financial.netYield)}
              subtitle="Rendimiento neto"
              icon={Target}
              variant={financial.netYield >= 5 ? 'success' : 'warning'}
            />
            <KPICardAdvanced
              title="Cap Rate"
              value={formatPercent(financial.capRate)}
              subtitle="Tasa capitalización"
              icon={BarChart3}
            />
            <KPICardAdvanced
              title="Margen Neto"
              value={formatPercent(financial.netMargin)}
              subtitle="NOI / Ingresos"
              icon={Percent}
              variant={financial.netMargin >= 60 ? 'success' : 'warning'}
            />
            <KPICardAdvanced
              title="ARPU"
              value={formatCurrency(financial.averageRentPerUnit)}
              subtitle="Ingreso por unidad"
              icon={Building2}
            />
            <KPICardAdvanced
              title="€/m²"
              value={`€${financial.averageRentPerSqm.toFixed(2)}`}
              subtitle="Precio por metro"
              icon={Home}
            />
            <KPICardAdvanced
              title="Valor Portfolio"
              value={formatCurrency(financial.portfolioValue)}
              subtitle="Valor estimado"
              icon={Wallet}
            />
          </div>

          {/* Top Propiedades */}
          {charts.topPerformingProperties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Propiedades por Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {charts.topPerformingProperties.map((prop, index) => (
                    <div
                      key={prop.name}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{prop.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Ocupación: {formatPercent(prop.occupancy)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(prop.noi)}</p>
                        <p className="text-sm text-muted-foreground">
                          Yield: {formatPercent(prop.yield)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Cobranza */}
        <TabsContent value="collection" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPICardAdvanced
              title="Tasa de Cobro"
              value={formatPercent(collection.collectionRate)}
              subtitle="Este mes"
              icon={Percent}
              variant={collection.collectionRate >= 95 ? 'success' : collection.collectionRate >= 80 ? 'warning' : 'danger'}
            />
            <KPICardAdvanced
              title="Cobrado Este Mes"
              value={formatCurrency(collection.currentMonthCollected)}
              icon={DollarSign}
            />
            <KPICardAdvanced
              title="Pendiente de Cobro"
              value={formatCurrency(collection.totalReceivables)}
              subtitle={`${collection.delinquencyCount} pagos`}
              icon={AlertTriangle}
              variant={collection.totalReceivables === 0 ? 'success' : 'warning'}
            />
            <KPICardAdvanced
              title="Tasa de Morosidad"
              value={formatPercent(collection.delinquencyRate)}
              subtitle="% del total facturado"
              icon={AlertTriangle}
              variant={collection.delinquencyRate <= 5 ? 'success' : collection.delinquencyRate <= 15 ? 'warning' : 'danger'}
            />
            <KPICardAdvanced
              title="DSO"
              value={`${collection.averageDaysToCollect} días`}
              subtitle="Days Sales Outstanding"
              icon={Clock}
              variant={collection.averageDaysToCollect <= 7 ? 'success' : collection.averageDaysToCollect <= 15 ? 'warning' : 'danger'}
            />
          </div>

          {/* Detalle de Aging */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Aging</CardTitle>
              <CardDescription>
                Desglose de cuentas por cobrar por antigüedad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium">0-30 días (Corriente)</p>
                    <p className="text-sm text-muted-foreground">
                      {charts.collectionAging[0]?.count || 0} pagos
                    </p>
                  </div>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(collection.aging.current)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium">31-60 días</p>
                    <p className="text-sm text-muted-foreground">
                      {charts.collectionAging[1]?.count || 0} pagos
                    </p>
                  </div>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(collection.aging.days30to60)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="font-medium">61-90 días</p>
                    <p className="text-sm text-muted-foreground">
                      {charts.collectionAging[2]?.count || 0} pagos
                    </p>
                  </div>
                  <p className="text-xl font-bold text-amber-700">
                    {formatCurrency(collection.aging.days60to90)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium">+90 días (Crítico)</p>
                    <p className="text-sm text-muted-foreground">
                      {charts.collectionAging[3]?.count || 0} pagos
                    </p>
                  </div>
                  <p className="text-xl font-bold text-red-700">
                    {formatCurrency(collection.aging.over90Days)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Operaciones */}
        <TabsContent value="operations" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <KPICardAdvanced
              title="Propiedades"
              value={operational.totalProperties}
              icon={Building2}
            />
            <KPICardAdvanced
              title="Unidades Totales"
              value={operational.totalUnits}
              icon={Home}
            />
            <KPICardAdvanced
              title="Ocupadas"
              value={operational.occupiedUnits}
              subtitle={formatPercent(operational.occupancyRate)}
              icon={Users}
              variant="success"
            />
            <KPICardAdvanced
              title="Vacantes"
              value={operational.vacantUnits}
              subtitle={`${operational.averageVacancyDays} días promedio`}
              icon={Home}
              variant={operational.vacantUnits === 0 ? 'success' : 'warning'}
            />
            <KPICardAdvanced
              title="Contratos Activos"
              value={operational.activeContracts}
              icon={FileText}
            />
            <KPICardAdvanced
              title="Tasa Rotación"
              value={formatPercent(operational.turnoverRate)}
              subtitle="Inquilinos/año"
              icon={Activity}
              variant={operational.turnoverRate <= 20 ? 'success' : 'warning'}
            />
            <KPICardAdvanced
              title="Tasa Renovación"
              value={formatPercent(operational.renewalRate)}
              subtitle="Contratos renovados"
              icon={FileText}
              variant={operational.renewalRate >= 70 ? 'success' : 'warning'}
            />
            <KPICardAdvanced
              title="Días Vacancia"
              value={`${operational.averageVacancyDays}`}
              subtitle="Promedio por unidad"
              icon={Clock}
              variant={operational.averageVacancyDays <= 30 ? 'success' : 'warning'}
            />
          </div>

          {/* Mantenimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">
                    {maintenance.pendingRequests}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {maintenance.inProgressRequests}
                  </p>
                  <p className="text-sm text-muted-foreground">En Proceso</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {maintenance.completedThisMonth}
                  </p>
                  <p className="text-sm text-muted-foreground">Completados (mes)</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    {maintenance.averageResolutionDays}
                  </p>
                  <p className="text-sm text-muted-foreground">Días resolución</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">
                      {formatCurrency(maintenance.maintenanceCostMTD)}
                    </p>
                    <p className="text-xs text-muted-foreground">Coste este mes</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {formatCurrency(maintenance.maintenanceCostPerUnit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Coste por unidad</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {formatPercent(maintenance.maintenanceAsPercentOfRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">% de ingresos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingresos por tipo */}
          {charts.incomeByPropertyType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo de Propiedad</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.incomeByPropertyType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="type" type="category" width={100} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="income" name="Ingresos" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RentalKPIDashboard;
