'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  LogOut,
  Bell,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/logger';
import { toast } from 'sonner';
import {
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {

  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

interface Owner {
  id: string;
  nombreCompleto: string;
  email: string;
  company: {
    id: string;
    nombre: string;
    logoUrl: string | null;
  };
  ownerBuildings: Array<{
    id: string;
    porcentajePropiedad: number;
    verIngresos: boolean;
    verGastos: boolean;
    verOcupacion: boolean;
    verMantenimiento: boolean;
    verDocumentos: boolean;
    building: {
      id: string;
      nombre: string;
      direccion: string;
      tipo: string;
      imagenes: string[];
    };
  }>;
}

export default function PortalPropietarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('current'); // 'current', 'previous', 'comparison'

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth-propietario/me', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setOwner(data.owner);
        await fetchData(data.owner);
      } else {
        router.push('/portal-propietario/login');
      }
    } catch (error) {
      logger.error('Error al verificar autenticación:', error);
      router.push('/portal-propietario/login');
    }
  };

  const fetchData = async (ownerData: Owner) => {
    try {
      setLoading(true);

      // Obtener IDs de edificios asignados al propietario
      const buildingIds = ownerData.ownerBuildings.map((ob) => ob.building.id);

      // Cargar datos solo de los edificios asignados
      const [buildingsRes, unitsRes, contractsRes, paymentsRes, expensesRes, notificationsRes] =
        await Promise.all([
          fetch('/api/buildings'),
          fetch('/api/units'),
          fetch('/api/contracts'),
          fetch('/api/payments'),
          fetch('/api/expenses'),
          fetch('/api/owner-notifications'),
        ]);

      if (buildingsRes.ok) {
        const allBuildings = await buildingsRes.json();
        // Filtrar solo edificios asignados
        const filteredBuildings = allBuildings.filter((b: any) => buildingIds.includes(b.id));
        setBuildings(filteredBuildings);
      }

      if (unitsRes.ok) {
        const allUnits = await unitsRes.json();
        // Filtrar unidades de edificios asignados
        const filteredUnits = allUnits.filter((u: any) => buildingIds.includes(u.buildingId));
        setUnits(filteredUnits);
      }

      if (contractsRes.ok) {
        const allContracts = await contractsRes.json();
        // Filtrar contratos de edificios asignados
        const filteredContracts = allContracts.filter(
          (c: any) => c.unit && buildingIds.includes(c.unit.buildingId)
        );
        setContracts(filteredContracts);
      }

      // Verificar permisos antes de cargar pagos
      const canViewIngresos = ownerData.ownerBuildings.some((ob) => ob.verIngresos);
      if (paymentsRes.ok && canViewIngresos) {
        const allPayments = await paymentsRes.json();
        // Filtrar pagos de contratos de edificios asignados
        const filteredPayments = allPayments.filter((p: any) => {
          const contract = contracts.find((c) => c.id === p.contractId);
          return contract && buildingIds.includes(contract.unit?.buildingId);
        });
        setPayments(filteredPayments);
      } else {
        setPayments([]);
      }

      // Verificar permisos antes de cargar gastos
      const canViewGastos = ownerData.ownerBuildings.some((ob) => ob.verGastos);
      if (expensesRes.ok && canViewGastos) {
        const allExpenses = await expensesRes.json();
        // Filtrar gastos de edificios asignados
        const filteredExpenses = allExpenses.filter((e: any) => buildingIds.includes(e.buildingId));
        setExpenses(filteredExpenses);
      } else {
        setExpenses([]);
      }

      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth-propietario/logout', {
        method: 'POST',
        credentials: 'include',
      });

      toast.success('Sesión cerrada exitosamente');
      router.push('/portal-propietario/login');
    } catch (error) {
      logger.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  // Cálculos
  const totalPropiedades = buildings.length;
  const totalUnidades = units.length;
  const unidadesOcupadas = units.filter((u) => u.estado === 'ocupada').length;
  const tasaOcupacion = totalUnidades > 0 ? (unidadesOcupadas / totalUnidades) * 100 : 0;

  const contratosActivos = contracts.filter((c) => c.estado === 'activo').length;
  const contratosPorVencer = contracts.filter((c) => {
    if (c.fechaFin) {
      const daysUntilEnd = Math.ceil(
        (new Date(c.fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilEnd > 0 && daysUntilEnd <= 60;
    }
    return false;
  }).length;

  // Filtrar datos por periodo
  const getPeriodData = (data: any[], dateField: string, period: string) => {
    const now = new Date();
    const currentStart = startOfMonth(now);
    const currentEnd = endOfMonth(now);
    const previousStart = startOfMonth(subMonths(now, 1));
    const previousEnd = endOfMonth(subMonths(now, 1));

    if (period === 'current') {
      return data.filter((item) => {
        const date = new Date(item[dateField]);
        return isWithinInterval(date, { start: currentStart, end: currentEnd });
      });
    } else if (period === 'previous') {
      return data.filter((item) => {
        const date = new Date(item[dateField]);
        return isWithinInterval(date, { start: previousStart, end: previousEnd });
      });
    }
    return data;
  };

  // Calcular datos del periodo actual
  const currentPayments = getPeriodData(payments, 'fechaPago', 'current');
  const currentExpenses = getPeriodData(expenses, 'fecha', 'current');
  const previousPayments = getPeriodData(payments, 'fechaPago', 'previous');
  const previousExpenses = getPeriodData(expenses, 'fecha', 'previous');

  const ingresosMensual = currentPayments
    .filter((p) => p.estado === 'pagado')
    .reduce((sum, p) => sum + (p.monto || 0), 0);

  const ingresosMesAnterior = previousPayments
    .filter((p) => p.estado === 'pagado')
    .reduce((sum, p) => sum + (p.monto || 0), 0);

  const gastosMensual = currentExpenses.reduce((sum, e) => sum + (e.monto || 0), 0);
  const gastosMesAnterior = previousExpenses.reduce((sum, e) => sum + (e.monto || 0), 0);

  const variacionIngresos =
    ingresosMesAnterior > 0
      ? ((ingresosMensual - ingresosMesAnterior) / ingresosMesAnterior) * 100
      : 0;

  const variacionGastos =
    gastosMesAnterior > 0 ? ((gastosMensual - gastosMesAnterior) / gastosMesAnterior) * 100 : 0;

  const beneficioNeto = ingresosMensual - gastosMensual;
  const margenBeneficio = ingresosMensual > 0 ? (beneficioNeto / ingresosMensual) * 100 : 0;

  const notificacionesNoLeidas = notifications.filter((n: any) => !n.leida).length;

  // Datos para gráficos
  const ingresosHistoricos = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.fechaPago);
      return isWithinInterval(paymentDate, { start, end }) && p.estado === 'pagado';
    });

    const monthExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.fecha);
      return isWithinInterval(expenseDate, { start, end });
    });

    return {
      mes: format(date, 'MMM', { locale: es }),
      ingresos: monthPayments.reduce((sum, p) => sum + (p.monto || 0), 0),
      gastos: monthExpenses.reduce((sum, e) => sum + (e.monto || 0), 0),
    };
  });

  const ocupacionPorPropiedad = buildings.map((building) => {
    const buildingUnits = units.filter((u) => u.buildingId === building.id);
    const occupiedUnits = buildingUnits.filter((u) => u.estado === 'ocupada').length;
    const occupancyRate =
      buildingUnits.length > 0 ? (occupiedUnits / buildingUnits.length) * 100 : 0;

    return {
      nombre: building.nombre,
      ocupacion: Math.round(occupancyRate),
    };
  });

  const distribucionIngresos = [
    {
      nombre: 'Alquileres',
      valor: payments
        .filter((p) => p.tipo === 'alquiler' && p.estado === 'pagado')
        .reduce((sum, p) => sum + (p.monto || 0), 0),
    },
    {
      nombre: 'Servicios',
      valor: payments
        .filter((p) => p.tipo === 'servicio' && p.estado === 'pagado')
        .reduce((sum, p) => sum + (p.monto || 0), 0),
    },
    {
      nombre: 'Otros',
      valor: payments
        .filter((p) => p.tipo !== 'alquiler' && p.tipo !== 'servicio' && p.estado === 'pagado')
        .reduce((sum, p) => sum + (p.monto || 0), 0),
    },
  ].filter((item) => item.valor > 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const handleExportReport = () => {
    toast.info('Generando reporte personalizado...');
    // TODO: Implementar generación de reporte
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Cargando portal...</p>
        </div>
      </div>
    );
  }

  if (!owner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      {/* Header Personalizado */}
      <header className="bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {owner.company.nombre}
                </h1>
                <p className="text-xs text-muted-foreground">Portal del Propietario</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notificaciones */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notificacionesNoLeidas > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {notificacionesNoLeidas}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif: any) => (
                      <DropdownMenuItem key={notif.id} className="flex-col items-start">
                        <div className="font-medium">{notif.titulo}</div>
                        <div className="text-xs text-muted-foreground">{notif.mensaje}</div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menú de Usuario */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getInitials(owner.nombreCompleto)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block">{owner.nombreCompleto}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header con Selector de Periodo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Mis Propiedades
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Análisis detallado de {buildings.length}{' '}
                {buildings.length === 1 ? 'propiedad' : 'propiedades'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mes Actual</SelectItem>
                  <SelectItem value="previous">Mes Anterior</SelectItem>
                  <SelectItem value="comparison">Comparativa</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExportReport} className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>

          {/* KPIs Principales con Comparativas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
                <Building2 className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{totalPropiedades}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'} totales
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {unidadesOcupadas} ocupadas
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                    {totalUnidades - unidadesOcupadas} disponibles
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {owner?.ownerBuildings.some((ob) => ob.verIngresos) && (
              <Card className="border-l-4 border-l-emerald-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                  <Euro className="h-5 w-5 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-700">
                    {formatCurrency(ingresosMensual)}
                  </div>
                  <div className="flex items-center mt-2 text-xs">
                    {variacionIngresos >= 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                        <span className="font-semibold text-green-700">
                          +{variacionIngresos.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                        <span className="font-semibold text-red-700">
                          {variacionIngresos.toFixed(1)}%
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground ml-1">vs mes anterior</span>
                  </div>
                  {selectedPeriod === 'comparison' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Mes anterior: {formatCurrency(ingresosMesAnterior)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {owner?.ownerBuildings.some((ob) => ob.verIngresos) &&
              owner?.ownerBuildings.some((ob) => ob.verGastos) && (
                <Card className="border-l-4 border-l-purple-600">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-700">
                      {formatCurrency(beneficioNeto)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Margen: {margenBeneficio.toFixed(1)}%
                    </p>
                    <div className="flex items-center mt-2 text-xs">
                      {variacionGastos >= 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1 text-red-600" />
                          <span className="font-semibold text-red-700">
                            Gastos +{variacionGastos.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
                          <span className="font-semibold text-green-700">
                            Gastos {variacionGastos.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {owner?.ownerBuildings.some((ob) => ob.verOcupacion) && (
              <Card className="border-l-4 border-l-amber-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
                  <Percent className="h-5 w-5 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-700">
                    {tasaOcupacion.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {contratosActivos} contratos activos
                  </p>
                  {contratosPorVencer > 0 && (
                    <div className="mt-2 flex items-center text-xs text-amber-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {contratosPorVencer} por vencer en 60 días
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                          <RechartsTooltip
                            formatter={(value: any) => formatCurrency(Number(value))}
                          />
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
                          <RechartsTooltip />
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
                        <RechartsTooltip
                          formatter={(value: any) => formatCurrency(Number(value))}
                        />
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
                  const occupancyRate =
                    buildingUnits.length > 0 ? (occupiedUnits / buildingUnits.length) * 100 : 0;

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
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-2 rounded bg-gray-50"
                          >
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
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-2 rounded bg-gray-50"
                          >
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
                    <Button
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      onClick={handleExportReport}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <div className="text-left">
                          <p className="font-semibold">Reporte Mensual</p>
                          <p className="text-xs text-muted-foreground">
                            Resumen de ingresos y gastos
                          </p>
                        </div>
                        <Download className="h-4 w-4 ml-auto" />
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      onClick={handleExportReport}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        <div className="text-left">
                          <p className="font-semibold">Análisis de Rentabilidad</p>
                          <p className="text-xs text-muted-foreground">
                            ROI y métricas de inversión
                          </p>
                        </div>
                        <Download className="h-4 w-4 ml-auto" />
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      onClick={handleExportReport}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Building2 className="h-6 w-6 text-purple-600" />
                        <div className="text-left">
                          <p className="font-semibold">Estado de Propiedades</p>
                          <p className="text-xs text-muted-foreground">
                            Ocupación y mantenimientos
                          </p>
                        </div>
                        <Download className="h-4 w-4 ml-auto" />
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      onClick={handleExportReport}
                    >
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
  );
}
