'use client';

/**
 * Reportes Financieros - Inmova App
 * 
 * Dashboard financiero completo con:
 * - Estado de resultados (P&L)
 * - Flujo de caja
 * - Balance general
 * - Análisis de rentabilidad por propiedad
 * - Reportes fiscales y contables
 */

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Euro,
  Building2,
  PieChart,
  BarChart3,
  LineChart,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  CreditCard,
  Banknote,
  Calculator,
  FileSpreadsheet,
  RefreshCw,
  Filter,
  Loader2,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle,
  Home,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface FinancialSummary {
  ingresosTotales: number;
  gastosTotales: number;
  beneficioNeto: number;
  margenBeneficio: number;
  rentasPendientes: number;
  rentasCobradas: number;
  tasaCobro: number;
  variacionMensual: number;
}

interface CashFlowItem {
  mes: string;
  ingresos: number;
  gastos: number;
  neto: number;
}

interface PropertyPerformance {
  id: string;
  nombre: string;
  direccion: string;
  ingresos: number;
  gastos: number;
  beneficio: number;
  roi: number;
  ocupacion: number;
}

interface ExpenseCategory {
  categoria: string;
  monto: number;
  porcentaje: number;
  color: string;
}

interface IncomeBreakdown {
  concepto: string;
  monto: number;
  porcentaje: number;
}

// Mock Data
const mockSummary: FinancialSummary = {
  ingresosTotales: 125840,
  gastosTotales: 42350,
  beneficioNeto: 83490,
  margenBeneficio: 66.3,
  rentasPendientes: 4200,
  rentasCobradas: 121640,
  tasaCobro: 96.7,
  variacionMensual: 8.5,
};

const mockCashFlow: CashFlowItem[] = [
  { mes: 'Ene', ingresos: 18500, gastos: 6200, neto: 12300 },
  { mes: 'Feb', ingresos: 19200, gastos: 5800, neto: 13400 },
  { mes: 'Mar', ingresos: 20100, gastos: 7100, neto: 13000 },
  { mes: 'Abr', ingresos: 19800, gastos: 6500, neto: 13300 },
  { mes: 'May', ingresos: 21500, gastos: 7200, neto: 14300 },
  { mes: 'Jun', ingresos: 22340, gastos: 6850, neto: 15490 },
];

const mockPropertyPerformance: PropertyPerformance[] = [
  { id: '1', nombre: 'Edificio Residencial Sol', direccion: 'Calle Mayor 15', ingresos: 45000, gastos: 12000, beneficio: 33000, roi: 8.2, ocupacion: 95 },
  { id: '2', nombre: 'Apartamentos Luna', direccion: 'Av. Principal 42', ingresos: 32500, gastos: 9800, beneficio: 22700, roi: 7.8, ocupacion: 88 },
  { id: '3', nombre: 'Oficinas Centro', direccion: 'Plaza Central 5', ingresos: 28000, gastos: 8500, beneficio: 19500, roi: 9.1, ocupacion: 100 },
  { id: '4', nombre: 'Local Comercial Norte', direccion: 'Calle Norte 23', ingresos: 15200, gastos: 6050, beneficio: 9150, roi: 6.5, ocupacion: 100 },
  { id: '5', nombre: 'Viviendas Mar', direccion: 'Paseo Marítimo 8', ingresos: 5140, gastos: 6000, beneficio: -860, roi: -1.2, ocupacion: 60 },
];

const mockExpenseCategories: ExpenseCategory[] = [
  { categoria: 'Mantenimiento', monto: 15200, porcentaje: 35.9, color: 'bg-blue-500' },
  { categoria: 'Seguros', monto: 8500, porcentaje: 20.1, color: 'bg-green-500' },
  { categoria: 'Impuestos', monto: 7800, porcentaje: 18.4, color: 'bg-yellow-500' },
  { categoria: 'Suministros', monto: 5200, porcentaje: 12.3, color: 'bg-purple-500' },
  { categoria: 'Administración', monto: 3650, porcentaje: 8.6, color: 'bg-orange-500' },
  { categoria: 'Otros', monto: 2000, porcentaje: 4.7, color: 'bg-gray-500' },
];

const mockIncomeBreakdown: IncomeBreakdown[] = [
  { concepto: 'Alquileres Residenciales', monto: 85400, porcentaje: 67.9 },
  { concepto: 'Alquileres Comerciales', monto: 28000, porcentaje: 22.3 },
  { concepto: 'Parking', monto: 6500, porcentaje: 5.2 },
  { concepto: 'Servicios Adicionales', monto: 4200, porcentaje: 3.3 },
  { concepto: 'Otros Ingresos', monto: 1740, porcentaje: 1.4 },
];

// Component
export default function ReportesFinancierosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Data states
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<IncomeBreakdown[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      // En producción cargar desde API
      // const response = await fetch('/api/reportes/financieros');
      
      // Mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setSummary(mockSummary);
      setCashFlow(mockCashFlow);
      setPropertyPerformance(mockPropertyPerformance);
      setExpenseCategories(mockExpenseCategories);
      setIncomeBreakdown(mockIncomeBreakdown);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.info('Generando reporte PDF...');
    // En producción: generar y descargar PDF
    setTimeout(() => {
      toast.success('Reporte exportado correctamente');
    }, 1500);
  };

  const handleExportExcel = () => {
    toast.info('Generando archivo Excel...');
    // En producción: generar y descargar Excel
    setTimeout(() => {
      toast.success('Excel exportado correctamente');
    }, 1500);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Euro className="h-8 w-8 text-green-600" />
            Reportes Financieros
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis financiero y contable de tu cartera inmobiliaria
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mes</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
              <SelectItem value="ytd">Año actual</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-400">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-green-800 dark:text-green-300">
                    {formatCurrency(summary.ingresosTotales)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">+{summary.variacionMensual}% vs mes anterior</span>
                  </div>
                </div>
                <div className="bg-green-200 dark:bg-green-700 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-400">Gastos Totales</p>
                  <p className="text-3xl font-bold text-red-800 dark:text-red-300">
                    {formatCurrency(summary.gastosTotales)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">-3.2% vs mes anterior</span>
                  </div>
                </div>
                <div className="bg-red-200 dark:bg-red-700 p-3 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-red-700 dark:text-red-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Beneficio Neto</p>
                  <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">
                    {formatCurrency(summary.beneficioNeto)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm text-blue-600">Margen: {summary.margenBeneficio}%</span>
                  </div>
                </div>
                <div className="bg-blue-200 dark:bg-blue-700 p-3 rounded-xl">
                  <Wallet className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-400">Tasa de Cobro</p>
                  <p className="text-3xl font-bold text-purple-800 dark:text-purple-300">
                    {summary.tasaCobro}%
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm text-purple-600">
                      Pendiente: {formatCurrency(summary.rentasPendientes)}
                    </span>
                  </div>
                </div>
                <div className="bg-purple-200 dark:bg-purple-700 p-3 rounded-xl">
                  <Receipt className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resumen">
            <PieChart className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <LineChart className="h-4 w-4 mr-2" />
            Flujo de Caja
          </TabsTrigger>
          <TabsTrigger value="propiedades">
            <Building2 className="h-4 w-4 mr-2" />
            Por Propiedad
          </TabsTrigger>
          <TabsTrigger value="pl">
            <Calculator className="h-4 w-4 mr-2" />
            P&L
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Desglose de Ingresos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Desglose de Ingresos
                </CardTitle>
                <CardDescription>
                  Distribución de ingresos por concepto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incomeBreakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.concepto}</span>
                        <div className="text-right">
                          <span className="font-semibold">{formatCurrency(item.monto)}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.porcentaje}%)</span>
                        </div>
                      </div>
                      <Progress value={item.porcentaje} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Desglose de Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Desglose de Gastos
                </CardTitle>
                <CardDescription>
                  Distribución de gastos por categoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseCategories.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", item.color)} />
                          <span className="text-sm font-medium">{item.categoria}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{formatCurrency(item.monto)}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.porcentaje}%)</span>
                        </div>
                      </div>
                      <Progress value={item.porcentaje} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métricas Clave */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas Financieras Clave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">NOI</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.beneficioNeto || 0)}</p>
                    <p className="text-xs text-muted-foreground">Net Operating Income</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Cap Rate</p>
                    <p className="text-2xl font-bold">7.8%</p>
                    <p className="text-xs text-muted-foreground">Tasa de Capitalización</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">ROI Promedio</p>
                    <p className="text-2xl font-bold">8.2%</p>
                    <p className="text-xs text-muted-foreground">Return on Investment</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">DSCR</p>
                    <p className="text-2xl font-bold">1.45x</p>
                    <p className="text-xs text-muted-foreground">Debt Service Coverage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Flujo de Caja */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Caja Mensual</CardTitle>
              <CardDescription>
                Evolución de ingresos, gastos y neto por mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tabla de Cash Flow */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlow.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.mes} 2026</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(item.ingresos)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(item.gastos)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-semibold",
                        item.neto >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(item.neto)}
                      </TableCell>
                      <TableCell className="text-right">
                        {((item.neto / item.ingresos) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(cashFlow.reduce((sum, i) => sum + i.ingresos, 0))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(cashFlow.reduce((sum, i) => sum + i.gastos, 0))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      {formatCurrency(cashFlow.reduce((sum, i) => sum + i.neto, 0))}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {(
                        (cashFlow.reduce((sum, i) => sum + i.neto, 0) /
                          cashFlow.reduce((sum, i) => sum + i.ingresos, 0)) *
                        100
                      ).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              {/* Gráfico visual simplificado */}
              <div className="mt-8">
                <h4 className="text-sm font-medium mb-4">Evolución Visual</h4>
                <div className="flex items-end gap-4 h-40">
                  {cashFlow.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col gap-1">
                        <div
                          className="w-full bg-green-500 rounded-t"
                          style={{ height: `${(item.ingresos / 25000) * 100}px` }}
                          title={`Ingresos: ${formatCurrency(item.ingresos)}`}
                        />
                        <div
                          className="w-full bg-red-500 rounded-b"
                          style={{ height: `${(item.gastos / 25000) * 100}px` }}
                          title={`Gastos: ${formatCurrency(item.gastos)}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.mes}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-sm">Ingresos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span className="text-sm">Gastos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Por Propiedad */}
        <TabsContent value="propiedades">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Propiedad</CardTitle>
              <CardDescription>
                Análisis de rentabilidad individual de cada propiedad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Beneficio</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead className="text-right">Ocupación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyPerformance.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{property.nombre}</p>
                          <p className="text-xs text-muted-foreground">{property.direccion}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(property.ingresos)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(property.gastos)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-semibold",
                        property.beneficio >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(property.beneficio)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        property.roi >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {property.roi >= 0 ? '+' : ''}{property.roi}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={property.ocupacion} className="w-16 h-2" />
                          <span className="text-sm">{property.ocupacion}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {property.beneficio >= 0 ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Rentable
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Revisar
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total Cartera</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(propertyPerformance.reduce((sum, p) => sum + p.ingresos, 0))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(propertyPerformance.reduce((sum, p) => sum + p.gastos, 0))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      {formatCurrency(propertyPerformance.reduce((sum, p) => sum + p.beneficio, 0))}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {(propertyPerformance.reduce((sum, p) => sum + p.roi, 0) / propertyPerformance.length).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {(propertyPerformance.reduce((sum, p) => sum + p.ocupacion, 0) / propertyPerformance.length).toFixed(0)}%
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: P&L */}
        <TabsContent value="pl">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Resultados (P&L)</CardTitle>
              <CardDescription>
                Cuenta de pérdidas y ganancias del período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Ingresos */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    INGRESOS OPERATIVOS
                  </h4>
                  <div className="space-y-2 ml-6">
                    {incomeBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-1 border-b last:border-0">
                        <span className="text-sm">{item.concepto}</span>
                        <span className="font-medium">{formatCurrency(item.monto)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between py-2 mt-2 bg-green-50 px-4 rounded font-semibold">
                    <span>Total Ingresos</span>
                    <span className="text-green-600">{formatCurrency(summary?.ingresosTotales || 0)}</span>
                  </div>
                </div>

                <Separator />

                {/* Gastos */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    GASTOS OPERATIVOS
                  </h4>
                  <div className="space-y-2 ml-6">
                    {expenseCategories.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-1 border-b last:border-0">
                        <span className="text-sm">{item.categoria}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(item.monto)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between py-2 mt-2 bg-red-50 px-4 rounded font-semibold">
                    <span>Total Gastos</span>
                    <span className="text-red-600">-{formatCurrency(summary?.gastosTotales || 0)}</span>
                  </div>
                </div>

                <Separator />

                {/* Resultado */}
                <div className="flex items-center justify-between py-4 bg-blue-50 px-4 rounded">
                  <span className="font-bold text-lg">BENEFICIO NETO OPERATIVO (NOI)</span>
                  <span className="font-bold text-2xl text-blue-600">
                    {formatCurrency(summary?.beneficioNeto || 0)}
                  </span>
                </div>

                {/* Margen */}
                <div className="flex items-center justify-between py-2 px-4">
                  <span className="text-muted-foreground">Margen de Beneficio</span>
                  <Badge className="text-lg px-4 py-1">
                    {summary?.margenBeneficio}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer con info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Los datos mostrados corresponden al período seleccionado. Para información fiscal detallada,
              consulta con tu asesor contable. Última actualización: {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
