'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Euro,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  Download,
  DollarSign,
  Percent,
  Home,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export default function PortalPropietarioPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [buildingsRes, unitsRes, contractsRes, paymentsRes, expensesRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/units'),
        fetch('/api/contracts'),
        fetch('/api/payments'),
        fetch('/api/expenses'),
      ]);
      
      if (buildingsRes.ok) setBuildings(await buildingsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
    } catch (error) {
      logger.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos
  const totalPropiedades = buildings.length;
  const totalUnidades = units.length;
  const unidadesOcupadas = units.filter((u) => u.estado === 'ocupada').length;
  const tasaOcupacion = totalUnidades > 0 ? (unidadesOcupadas / totalUnidades) * 100 : 0;
  
  const ingresosMensual = payments
    .filter((p) => p.estado === 'pagado')
    .reduce((sum, p) => sum + (p.monto || 0), 0);
  
  const gastosMensual = expenses
    .reduce((sum, e) => sum + (e.monto || 0), 0);
  
  const beneficioNeto = ingresosMensual - gastosMensual;
  const margenBeneficio = ingresosMensual > 0 ? (beneficioNeto / ingresosMensual) * 100 : 0;
  
  const contratosActivos = contracts.filter((c) => c.estado === 'activo').length;
  const contratosPorVencer = contracts.filter((c) => {
    if (c.fechaFin) {
      const daysUntilEnd = Math.ceil((new Date(c.fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilEnd > 0 && daysUntilEnd <= 60;
    }
    return false;
  }).length;

  // Datos para gráficos (simulados - en producción vendrían del backend)
  const ingresosHistoricos = [
    { mes: 'Ene', ingresos: 12500, gastos: 3200 },
    { mes: 'Feb', ingresos: 13200, gastos: 3400 },
    { mes: 'Mar', ingresos: 12800, gastos: 3100 },
    { mes: 'Abr', ingresos: 14100, gastos: 3600 },
    { mes: 'May', ingresos: 13900, gastos: 3300 },
    { mes: 'Jun', ingresos: 14500, gastos: 3500 },
  ];

  const ocupacionPorPropiedad = buildings.map((building) => {
    const buildingUnits = units.filter((u) => u.buildingId === building.id);
    const occupied = buildingUnits.filter((u) => u.estado === 'ocupada').length;
    const total = buildingUnits.length;
    return {
      nombre: building.nombre,
      ocupacion: total > 0 ? Math.round((occupied / total) * 100) : 0,
      unidades: total,
    };
  });

  const distribucionIngresos = [
    { nombre: 'Alquileres', valor: ingresosMensual * 0.85 },
    { nombre: 'Servicios', valor: ingresosMensual * 0.10 },
    { nombre: 'Otros', valor: ingresosMensual * 0.05 },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const handleExportReport = () => {
    // En producción, esto llamaría a un endpoint que genere el PDF
    alert('Funcionalidad de exportación de reporte - Por implementar endpoint');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="mt-4 text-muted-foreground">Cargando portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Portal del Propietario</h1>
                <p className="text-gray-600 mt-1">
                  Análisis completo de tus inversiones inmobiliarias
                </p>
              </div>
              <Button onClick={handleExportReport} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar Reporte
              </Button>
            </div>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{totalPropiedades}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalUnidades} unidades totales
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {unidadesOcupadas} ocupadas
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                  <Euro className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(ingresosMensual)}
                  </div>
                  <div className="flex items-center mt-2 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    <span className="font-semibold text-green-700">+12%</span>
                    <span className="text-muted-foreground ml-1">vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCurrency(beneficioNeto)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margen: {margenBeneficio.toFixed(1)}%
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Gastos: {formatCurrency(gastosMensual)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-600 bg-gradient-to-br from-amber-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
                  <Percent className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    {tasaOcupacion.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {contratosActivos} contratos activos
                  </p>
                  {contratosPorVencer > 0 && (
                    <div className="mt-2 flex items-center text-xs text-amber-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {contratosPorVencer} por vencer
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabs con Analytics */}
            <Tabs defaultValue="analytics" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="properties">Propiedades</TabsTrigger>
                <TabsTrigger value="financials">Finanzas</TabsTrigger>
                <TabsTrigger value="reports">Reportes</TabsTrigger>
              </TabsList>

              {/* Tab: Analytics */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Gráfico de Ingresos vs Gastos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolución Financiera</CardTitle>
                      <CardDescription>Ingresos y gastos últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={ingresosHistoricos}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="ingresos"
                              name="Ingresos"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.6}
                            />
                            <Area
                              type="monotone"
                              dataKey="gastos"
                              name="Gastos"
                              stroke="#f59e0b"
                              fill="#f59e0b"
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Ocupación por Propiedad */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ocupación por Propiedad</CardTitle>
                      <CardDescription>Porcentaje de ocupación actual</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ocupacionPorPropiedad}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nombre" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="ocupacion" name="Ocupación %" fill="#6366f1" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Distribución de Ingresos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Ingresos</CardTitle>
                    <CardDescription>Desglose por tipo de ingreso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distribucionIngresos}
                            dataKey="valor"
                            nameKey="nombre"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(entry: any) => `${entry.nombre}: ${formatCurrency(entry.valor)}`}
                          >
                            {distribucionIngresos.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Propiedades */}
              <TabsContent value="properties" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {buildings.map((building) => {
                    const buildingUnits = units.filter((u) => u.buildingId === building.id);
                    const occupiedUnits = buildingUnits.filter((u) => u.estado === 'ocupada').length;
                    const occupancyRate = buildingUnits.length > 0
                      ? (occupiedUnits / buildingUnits.length) * 100
                      : 0;

                    return (
                      <Card key={building.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{building.nombre}</CardTitle>
                              <CardDescription>{building.direccion}</CardDescription>
                            </div>
                            <Badge
                              className={
                                occupancyRate >= 90
                                  ? 'bg-green-100 text-green-800'
                                  : occupancyRate >= 70
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {occupancyRate.toFixed(0)}% ocupado
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Unidades</p>
                              <p className="text-2xl font-bold">{buildingUnits.length}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Ocupadas</p>
                              <p className="text-2xl font-bold text-green-600">{occupiedUnits}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Disponibles</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {buildingUnits.length - occupiedUnits}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Tab: Finanzas */}
              <TabsContent value="financials" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Resumen de Ingresos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ingresos del Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Ingresos</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(ingresosMensual)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {payments.slice(0, 5).map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                              <div>
                                <p className="text-sm font-medium">{payment.concepto || 'Pago'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {payment.fechaPago
                                    ? format(new Date(payment.fechaPago), 'PP', { locale: es })
                                    : 'Pendiente'}
                                </p>
                              </div>
                              <span className="font-semibold">{formatCurrency(payment.monto)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resumen de Gastos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Gastos del Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Gastos</span>
                          <span className="text-lg font-bold text-red-600">
                            {formatCurrency(gastosMensual)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {expenses.slice(0, 5).map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                              <div>
                                <p className="text-sm font-medium">{expense.concepto || 'Gasto'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {expense.fecha
                                    ? format(new Date(expense.fecha), 'PP', { locale: es })
                                    : 'Sin fecha'}
                                </p>
                              </div>
                              <span className="font-semibold">{formatCurrency(expense.monto)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Reportes */}
              <TabsContent value="reports" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Reportes Disponibles</CardTitle>
                    <CardDescription>Descarga reportes detallados en PDF</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto p-4 justify-start" onClick={handleExportReport}>
                        <div className="flex items-start gap-3 w-full">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <div className="text-left">
                            <p className="font-semibold">Reporte Mensual</p>
                            <p className="text-xs text-muted-foreground">Resumen de ingresos y gastos</p>
                          </div>
                          <Download className="h-4 w-4 ml-auto" />
                        </div>
                      </Button>

                      <Button variant="outline" className="h-auto p-4 justify-start" onClick={handleExportReport}>
                        <div className="flex items-start gap-3 w-full">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                          <div className="text-left">
                            <p className="font-semibold">Análisis de Rentabilidad</p>
                            <p className="text-xs text-muted-foreground">ROI y métricas de inversión</p>
                          </div>
                          <Download className="h-4 w-4 ml-auto" />
                        </div>
                      </Button>

                      <Button variant="outline" className="h-auto p-4 justify-start" onClick={handleExportReport}>
                        <div className="flex items-start gap-3 w-full">
                          <Building2 className="h-6 w-6 text-purple-600" />
                          <div className="text-left">
                            <p className="font-semibold">Estado de Propiedades</p>
                            <p className="text-xs text-muted-foreground">Ocupación y mantenimientos</p>
                          </div>
                          <Download className="h-4 w-4 ml-auto" />
                        </div>
                      </Button>

                      <Button variant="outline" className="h-auto p-4 justify-start" onClick={handleExportReport}>
                        <div className="flex items-start gap-3 w-full">
                          <Calendar className="h-6 w-6 text-amber-600" />
                          <div className="text-left">
                            <p className="font-semibold">Contratos y Vencimientos</p>
                            <p className="text-xs text-muted-foreground">Renovaciones próximas</p>
                          </div>
                          <Download className="h-4 w-4 ml-auto" />
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
