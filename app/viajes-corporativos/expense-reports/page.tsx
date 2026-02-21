'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data para gastos
const GASTOS_MENSUALES = [
  { mes: 'Enero', presupuesto: 100000, gastado: 84500, ahorro: 15500 },
  { mes: 'Diciembre', presupuesto: 95000, gastado: 92000, ahorro: 3000 },
  { mes: 'Noviembre', presupuesto: 90000, gastado: 78500, ahorro: 11500 },
  { mes: 'Octubre', presupuesto: 85000, gastado: 81200, ahorro: 3800 },
];

// Gastos por categoría
const GASTOS_CATEGORIA = [
  { categoria: 'Alojamiento', gasto: 48500, porcentaje: 57, icono: Hotel, color: 'bg-blue-500' },
  { categoria: 'Vuelos', gasto: 24200, porcentaje: 29, icono: Plane, color: 'bg-purple-500' },
  { categoria: 'Transporte local', gasto: 6800, porcentaje: 8, icono: Car, color: 'bg-green-500' },
  { categoria: 'Dietas', gasto: 5000, porcentaje: 6, icono: Coffee, color: 'bg-orange-500' },
];

// Gastos por departamento
const GASTOS_DEPARTAMENTO = [
  { departamento: 'Ventas', gasto: 28500, presupuesto: 30000, empleados: 12, viajes: 45 },
  { departamento: 'Dirección', gasto: 22000, presupuesto: 25000, empleados: 3, viajes: 18 },
  { departamento: 'Operaciones', gasto: 18500, presupuesto: 20000, empleados: 8, viajes: 22 },
  { departamento: 'Marketing', gasto: 12000, presupuesto: 15000, empleados: 6, viajes: 15 },
  { departamento: 'IT', gasto: 3500, presupuesto: 10000, empleados: 5, viajes: 8 },
];

// Informes disponibles
const INFORMES = [
  { id: 'INF001', nombre: 'Informe Mensual Enero 2026', tipo: 'mensual', fecha: '2026-01-31', estado: 'generado' },
  { id: 'INF002', nombre: 'Informe por Departamentos Q1', tipo: 'trimestral', fecha: '2026-01-15', estado: 'generado' },
  { id: 'INF003', nombre: 'Análisis de Proveedores', tipo: 'analisis', fecha: '2026-01-10', estado: 'generado' },
  { id: 'INF004', nombre: 'Comparativa Interanual', tipo: 'anual', fecha: '2026-01-05', estado: 'generado' },
];

// Alertas de presupuesto
const ALERTAS_PRESUPUESTO = [
  { id: 1, departamento: 'Ventas', porcentaje: 95, tipo: 'warning' },
  { id: 2, departamento: 'Dirección', porcentaje: 88, tipo: 'info' },
  { id: 3, departamento: 'Operaciones', porcentaje: 92, tipo: 'warning' },
];

export default function ViajesCorporativosExpenseReportsPage() {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('enero-2026');
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'departamentos' | 'informes'>('resumen');
  const [apiStats, setApiStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/viajes-corporativos/stats');
        if (res.ok) {
          const data = await res.json();
          setApiStats(data.data || data);
        }
      } catch { /* use defaults */ }
    })();
  }, []);

  const stats = apiStats || {
    gastoMes: 0,
    presupuestoMes: 0,
    ahorro: 0,
    ahorroVsMercado: 0,
    viajesRealizados: 0,
    costoPromedio: 0,
  };

  const porcentajePresupuesto = stats.presupuestoMes > 0 ? (stats.gastoMes / stats.presupuestoMes) * 100 : 0;

  const handleDescargarInforme = (informe: typeof INFORMES[0], formato: string) => {
    toast.success(`Descargando ${informe.nombre} en formato ${formato.toUpperCase()}`);
  };

  const handleGenerarInforme = () => {
    toast.success('Generando nuevo informe personalizado...');
  };

  const handleExportarDatos = (formato: string) => {
    toast.success(`Exportando datos en formato ${formato.toUpperCase()}`);
  };

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
              <SelectItem value="enero-2026">Enero 2026</SelectItem>
              <SelectItem value="diciembre-2025">Diciembre 2025</SelectItem>
              <SelectItem value="noviembre-2025">Noviembre 2025</SelectItem>
              <SelectItem value="q4-2025">Q4 2025</SelectItem>
              <SelectItem value="anual-2025">Anual 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleExportarDatos('excel')}>
            <Download className="h-4 w-4 mr-2" />
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
                {GASTOS_CATEGORIA.map((cat) => {
                  const Icon = cat.icono;
                  return (
                    <div key={cat.categoria} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{cat.categoria}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{cat.gasto.toLocaleString()}€</span>
                          <span className="text-sm text-muted-foreground ml-2">({cat.porcentaje}%)</span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute h-full ${cat.color} rounded-full`}
                          style={{ width: `${cat.porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
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
                {ALERTAS_PRESUPUESTO.map((alerta) => (
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
                ))}

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
                    2 departamentos bajo control (&lt;80%)
                  </p>
                </div>
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
                  {GASTOS_MENSUALES.map((mes) => {
                    const porcentaje = (mes.gastado / mes.presupuesto) * 100;
                    return (
                      <TableRow key={mes.mes}>
                        <TableCell className="font-medium">{mes.mes}</TableCell>
                        <TableCell className="text-right">{mes.presupuesto.toLocaleString()}€</TableCell>
                        <TableCell className="text-right">{mes.gastado.toLocaleString()}€</TableCell>
                        <TableCell className="text-right text-green-600">+{mes.ahorro.toLocaleString()}€</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={porcentaje} className="w-24" />
                            <span className="text-sm">{porcentaje.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                {GASTOS_DEPARTAMENTO.map((dept) => {
                  const porcentaje = (dept.gasto / dept.presupuesto) * 100;
                  const mediaViaje = Math.round(dept.gasto / dept.viajes);
                  return (
                    <TableRow key={dept.departamento}>
                      <TableCell className="font-medium">{dept.departamento}</TableCell>
                      <TableCell className="text-right">{dept.empleados}</TableCell>
                      <TableCell className="text-right">{dept.viajes}</TableCell>
                      <TableCell className="text-right">{dept.presupuesto.toLocaleString()}€</TableCell>
                      <TableCell className="text-right">{dept.gasto.toLocaleString()}€</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={porcentaje}
                            className={`w-20 ${porcentaje >= 90 ? 'bg-red-100' : ''}`}
                          />
                          <span className={`text-sm ${porcentaje >= 90 ? 'text-red-600 font-medium' : ''}`}>
                            {porcentaje.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{mediaViaje}€</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Gastado</p>
                    <p className="text-2xl font-bold">
                      {GASTOS_DEPARTAMENTO.reduce((sum, d) => sum + d.gasto, 0).toLocaleString()}€
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Presupuesto</p>
                    <p className="text-2xl font-bold">
                      {GASTOS_DEPARTAMENTO.reduce((sum, d) => sum + d.presupuesto, 0).toLocaleString()}€
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Media por Viaje Global</p>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        GASTOS_DEPARTAMENTO.reduce((sum, d) => sum + d.gasto, 0) /
                        GASTOS_DEPARTAMENTO.reduce((sum, d) => sum + d.viajes, 0)
                      )}€
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
            <Button onClick={handleGenerarInforme}>
              <FileText className="h-4 w-4 mr-2" />
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
                {INFORMES.map((informe) => (
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
                        onClick={() => handleDescargarInforme(informe, 'pdf')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDescargarInforme(informe, 'excel')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Excel
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
                            <p className="text-sm">Descarga el informe para ver su contenido completo</p>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleDescargarInforme(informe, 'pdf')}>
                              Descargar PDF
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tipos de informes disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleGenerarInforme}>
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

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleGenerarInforme}>
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

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleGenerarInforme}>
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
