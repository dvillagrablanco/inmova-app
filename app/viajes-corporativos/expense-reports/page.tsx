'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building,
  CreditCard,
  Hotel,
  Plane,
  Car,
  Coffee,
  Eye,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseStats {
  gastoMes: number;
  presupuestoMes: number;
  ahorro: number;
  ahorroVsMercado: number;
  viajesRealizados: number;
  costoPromedio: number;
}

interface MonthlyExpense {
  periodo: string;
  presupuesto: number;
  gastado: number;
  ahorro: number;
}

interface CategoryExpense {
  categoria: string;
  gasto: number;
  porcentaje: number;
}

interface DepartmentExpense {
  departamento: string;
  gasto: number;
  presupuesto: number;
  empleados: number;
  viajes: number;
}

interface TravelReportSummary {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  estado: string;
  periodo: string;
}

interface BudgetAlert {
  id: string;
  departamento: string;
  porcentaje: number;
  tipo: 'warning' | 'info';
}

interface ExpenseReportsResponse {
  stats: ExpenseStats;
  monthly: MonthlyExpense[];
  categories: CategoryExpense[];
  departments: DepartmentExpense[];
  reports: TravelReportSummary[];
  alerts: BudgetAlert[];
}

const categoryConfig: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  alojamiento: { label: 'Alojamiento', icon: Hotel, color: 'bg-blue-500' },
  vuelos: { label: 'Vuelos', icon: Plane, color: 'bg-purple-500' },
  transporte_local: { label: 'Transporte local', icon: Car, color: 'bg-green-500' },
  dietas: { label: 'Dietas', icon: Coffee, color: 'bg-orange-500' },
  otros: { label: 'Otros', icon: DollarSign, color: 'bg-gray-500' },
};

export default function ViajesCorporativosExpenseReportsPage() {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(currentPeriod);
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'departamentos' | 'informes'>(
    'resumen'
  );
  const [stats, setStats] = useState<ExpenseStats>({
    gastoMes: 0,
    presupuestoMes: 0,
    ahorro: 0,
    ahorroVsMercado: 0,
    viajesRealizados: 0,
    costoPromedio: 0,
  });
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [departmentExpenses, setDepartmentExpenses] = useState<DepartmentExpense[]>([]);
  const [reports, setReports] = useState<TravelReportSummary[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const periodOptions = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return { value, label };
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/viajes-corporativos/expense-reports?period=${periodoSeleccionado}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cargar informes');
        }
        const data = (await response.json()) as ExpenseReportsResponse;
        setStats(data.stats);
        setMonthlyExpenses(data.monthly || []);
        setCategoryExpenses(data.categories || []);
        setDepartmentExpenses(data.departments || []);
        setReports(data.reports || []);
        setAlerts(data.alerts || []);
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar informes');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [periodoSeleccionado]);

  const porcentajePresupuesto =
    stats.presupuestoMes > 0 ? (stats.gastoMes / stats.presupuestoMes) * 100 : 0;
  const totalDepartmentSpent = departmentExpenses.reduce((sum, d) => sum + d.gasto, 0);
  const totalDepartmentBudget = departmentExpenses.reduce((sum, d) => sum + d.presupuesto, 0);
  const totalDepartmentTrips = departmentExpenses.reduce((sum, d) => sum + d.viajes, 0);
  const globalAvgTrip =
    totalDepartmentTrips > 0 ? Math.round(totalDepartmentSpent / totalDepartmentTrips) : 0;

  const normalizeFormat = (format: string) => (format === 'excel' ? 'csv' : format);

  const downloadReport = async (period: string, format: string, name?: string) => {
    try {
      const normalized = normalizeFormat(format);
      setExportingFormat(normalized);
      const url = `/api/viajes-corporativos/expense-reports/export?period=${period}&format=${normalized}`;
      window.open(url, '_blank');
      if (name) {
        toast.success(`Descargando ${name} en formato ${normalized.toUpperCase()}`);
      } else {
        toast.success(`Exportando datos en formato ${normalized.toUpperCase()}`);
      }
    } catch (error) {
      toast.error('Error al exportar datos');
    } finally {
      setTimeout(() => setExportingFormat(null), 400);
    }
  };

  const handleDescargarInforme = (informe: TravelReportSummary, formato: string) => {
    void downloadReport(informe.periodo, formato, informe.nombre);
  };

  const handleGenerarInforme = async () => {
    try {
      setIsGenerating(true);
      await downloadReport(periodoSeleccionado, 'csv');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportarDatos = (formato: string) => {
    void downloadReport(periodoSeleccionado, formato);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando informes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Informes de Gastos</h1>
          <p className="text-muted-foreground">Análisis y reportes de gastos en viajes corporativos</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleExportarDatos('csv')} disabled={exportingFormat !== null}>
            {exportingFormat ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={vistaActiva === 'resumen' ? 'default' : 'ghost'}
          onClick={() => setVistaActiva('resumen')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Resumen
        </Button>
        <Button
          variant={vistaActiva === 'departamentos' ? 'default' : 'ghost'}
          onClick={() => setVistaActiva('departamentos')}
        >
          <Building className="h-4 w-4 mr-2" />
          Por Departamento
        </Button>
        <Button
          variant={vistaActiva === 'informes' ? 'default' : 'ghost'}
          onClick={() => setVistaActiva('informes')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Informes
        </Button>
      </div>

      {/* Vista Resumen */}
      {vistaActiva === 'resumen' && (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gasto del Mes</p>
                    <p className="text-2xl font-bold">{stats.gastoMes.toLocaleString()}€</p>
                    <p className="text-xs text-muted-foreground">
                      de {stats.presupuestoMes.toLocaleString()}€
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ahorro del Mes</p>
                    <p className="text-2xl font-bold text-green-600">+{stats.ahorro.toLocaleString()}€</p>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {((stats.ahorro / stats.presupuestoMes) * 100).toFixed(1)}% bajo presupuesto
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Viajes Realizados</p>
                    <p className="text-2xl font-bold">{stats.viajesRealizados}</p>
                    <p className="text-xs text-muted-foreground">
                      Media: {stats.costoPromedio}€/viaje
                    </p>
                  </div>
                  <Plane className="h-8 w-8 text-purple-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ahorro vs Mercado</p>
                    <p className="text-2xl font-bold text-green-600">{stats.ahorroVsMercado}%</p>
                    <p className="text-xs text-muted-foreground">
                      Gracias a acuerdos corporativos
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desglose y Alertas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gastos por categoría */}
            <Card>
              <CardHeader>
                <CardTitle>Desglose por Categoría</CardTitle>
                <CardDescription>Distribución del gasto mensual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos de categorias.</p>
                ) : (
                  categoryExpenses.map((cat) => {
                    const config = categoryConfig[cat.categoria] || {
                      label: cat.categoria,
                      icon: DollarSign,
                      color: 'bg-gray-500',
                    };
                    const Icon = config.icon;
                    return (
                      <div key={cat.categoria} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{config.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{cat.gasto.toLocaleString()}€</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({cat.porcentaje}%)
                            </span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`absolute h-full ${config.color} rounded-full`}
                            style={{ width: `${cat.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Alertas de presupuesto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Alertas de Presupuesto
                </CardTitle>
                <CardDescription>Departamentos cercanos al límite</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin alertas activas.</p>
                ) : (
                  alerts.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`p-4 rounded-lg ${
                        alerta.tipo === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{alerta.departamento}</span>
                        <Badge variant={alerta.porcentaje >= 90 ? 'destructive' : 'secondary'}>
                          {alerta.porcentaje}% usado
                        </Badge>
                      </div>
                      <Progress
                        value={alerta.porcentaje}
                        className={alerta.porcentaje >= 90 ? 'bg-red-100' : ''}
                      />
                    </div>
                  ))
                )}

                {alerts.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
                      {alerts.length} alertas activas
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Evolución mensual */}
          <Card>
            <CardHeader>
              <CardTitle>Evolución Mensual</CardTitle>
              <CardDescription>Comparativa de gastos vs presupuesto</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Presupuesto</TableHead>
                    <TableHead className="text-right">Gastado</TableHead>
                    <TableHead className="text-right">Ahorro</TableHead>
                    <TableHead>Cumplimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sin datos mensuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlyExpenses.map((mes) => {
                      const porcentaje =
                        mes.presupuesto > 0 ? (mes.gastado / mes.presupuesto) * 100 : 0;
                      const label = new Date(`${mes.periodo}-01`).toLocaleDateString('es-ES', {
                        month: 'long',
                      });
                      return (
                        <TableRow key={mes.periodo}>
                          <TableCell className="font-medium">{label}</TableCell>
                          <TableCell className="text-right">
                            {mes.presupuesto.toLocaleString()}€
                          </TableCell>
                          <TableCell className="text-right">
                            {mes.gastado.toLocaleString()}€
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            +{mes.ahorro.toLocaleString()}€
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={porcentaje} className="w-24" />
                              <span className="text-sm">{porcentaje.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista por Departamentos */}
      {vistaActiva === 'departamentos' && (
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Departamento</CardTitle>
            <CardDescription>Análisis detallado por centro de coste</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Empleados</TableHead>
                  <TableHead className="text-right">Viajes</TableHead>
                  <TableHead className="text-right">Presupuesto</TableHead>
                  <TableHead className="text-right">Gastado</TableHead>
                  <TableHead>% Usado</TableHead>
                  <TableHead className="text-right">Media/Viaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Sin datos de departamentos.
                    </TableCell>
                  </TableRow>
                ) : (
                  departmentExpenses.map((dept) => {
                    const porcentaje =
                      dept.presupuesto > 0 ? (dept.gasto / dept.presupuesto) * 100 : 0;
                    const mediaViaje = dept.viajes > 0 ? Math.round(dept.gasto / dept.viajes) : 0;
                    return (
                      <TableRow key={dept.departamento}>
                        <TableCell className="font-medium">{dept.departamento}</TableCell>
                        <TableCell className="text-right">{dept.empleados}</TableCell>
                        <TableCell className="text-right">{dept.viajes}</TableCell>
                        <TableCell className="text-right">
                          {dept.presupuesto.toLocaleString()}€
                        </TableCell>
                        <TableCell className="text-right">{dept.gasto.toLocaleString()}€</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={porcentaje}
                              className={`w-20 ${porcentaje >= 90 ? 'bg-red-100' : ''}`}
                            />
                            <span
                              className={`text-sm ${
                                porcentaje >= 90 ? 'text-red-600 font-medium' : ''
                              }`}
                            >
                              {porcentaje.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{mediaViaje}€</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Gastado</p>
                    <p className="text-2xl font-bold">
                      {totalDepartmentSpent.toLocaleString()}€
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Presupuesto</p>
                    <p className="text-2xl font-bold">
                      {totalDepartmentBudget.toLocaleString()}€
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Media por Viaje Global</p>
                    <p className="text-2xl font-bold">
                      {globalAvgTrip}€
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista Informes */}
      {vistaActiva === 'informes' && (
        <>
          <div className="flex justify-end">
            <Button onClick={handleGenerarInforme} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generar Informe Personalizado
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informes Disponibles</CardTitle>
              <CardDescription>Descarga informes generados anteriormente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No hay informes generados.
                  </div>
                ) : (
                  reports.map((informe) => (
                    <div
                      key={informe.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{informe.nombre}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(informe.fecha).toLocaleDateString('es-ES')}
                            </span>
                            <Badge variant="outline">{informe.tipo}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDescargarInforme(informe, 'csv')}
                          disabled={exportingFormat !== null}
                        >
                          {exportingFormat ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-1" />
                          )}
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDescargarInforme(informe, 'json')}
                          disabled={exportingFormat !== null}
                        >
                          {exportingFormat ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-1" />
                          )}
                          JSON
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Vista previa: {informe.nombre}</DialogTitle>
                            </DialogHeader>
                            <div className="py-8 text-center text-muted-foreground">
                              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                              <p>Vista previa no disponible</p>
                              <p className="text-sm">
                                Descarga el informe para ver su contenido completo
                              </p>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handleDescargarInforme(informe, 'csv')}>
                                Descargar CSV
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tipos de informes disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => !isGenerating && handleGenerarInforme()}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                  <p className="font-medium">Informe Mensual</p>
                  <p className="text-sm text-muted-foreground">
                    Resumen completo del mes con comparativas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => !isGenerating && handleGenerarInforme()}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <Building className="h-10 w-10 mx-auto mb-3 text-purple-500" />
                  <p className="font-medium">Por Departamento</p>
                  <p className="text-sm text-muted-foreground">
                    Análisis detallado por centro de coste
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => !isGenerating && handleGenerarInforme()}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">Análisis de Ahorro</p>
                  <p className="text-sm text-muted-foreground">
                    Comparativa con precios de mercado
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
