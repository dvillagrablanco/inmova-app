'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Euro,
  Wallet,
  Receipt,
  PiggyBank,
  Building2,
  Calendar,
  Filter,
  Plus,
  Eye,
  Printer,
  Mail,
  RefreshCw,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';

interface EstadoResultados {
  id: string;
  periodo: string;
  ingresos: {
    alquileres: number;
    servicios: number;
    otros: number;
    total: number;
  };
  gastos: {
    mantenimiento: number;
    administracion: number;
    seguros: number;
    impuestos: number;
    servicios: number;
    otros: number;
    total: number;
  };
  resultadoOperativo: number;
  intereses: number;
  depreciacion: number;
  resultadoNeto: number;
}

interface FlujoCaja {
  id: string;
  periodo: string;
  saldoInicial: number;
  entradas: {
    cobrosAlquiler: number;
    cobrosServicios: number;
    depositos: number;
    otros: number;
    total: number;
  };
  salidas: {
    pagosProveedores: number;
    nominas: number;
    impuestos: number;
    prestamos: number;
    otros: number;
    total: number;
  };
  flujoNeto: number;
  saldoFinal: number;
}

interface BalanceGeneral {
  id: string;
  fecha: string;
  activos: {
    corrientes: {
      caja: number;
      cuentasCobrar: number;
      inventarios: number;
      total: number;
    };
    noCorrientes: {
      propiedades: number;
      depreciacionAcumulada: number;
      equipos: number;
      total: number;
    };
    total: number;
  };
  pasivos: {
    corrientes: {
      cuentasPagar: number;
      impuestosPagar: number;
      depositosInquilinos: number;
      total: number;
    };
    noCorrientes: {
      hipotecas: number;
      prestamos: number;
      total: number;
    };
    total: number;
  };
  patrimonio: {
    capital: number;
    utilidadesRetenidas: number;
    total: number;
  };
}

interface RentabilidadPropiedad {
  id: string;
  propiedad: string;
  tipo: string;
  ingresos: number;
  gastos: number;
  noi: number; // Net Operating Income
  roi: number;
  capRate: number;
  valorActivo: number;
  ocupacion: number;
}

export default function ReportesFinancierosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pyl');
  const [periodoFilter, setPeriodoFilter] = useState('mensual');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [showExportDialog, setShowExportDialog] = useState(false);

  const [estadoResultados, setEstadoResultados] = useState<EstadoResultados[]>([]);
  const [flujosCaja, setFlujosCaja] = useState<FlujoCaja[]>([]);
  const [balance, setBalance] = useState<BalanceGeneral | null>(null);
  const [rentabilidades, setRentabilidades] = useState<RentabilidadPropiedad[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, periodoFilter, yearFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const [pylRes, cashRes, balanceRes, roiRes] = await Promise.all([
      //   fetch(`/api/reportes/estado-resultados?periodo=${periodoFilter}&year=${yearFilter}`),
      //   fetch(`/api/reportes/flujo-caja?periodo=${periodoFilter}&year=${yearFilter}`),
      //   fetch(`/api/reportes/balance?year=${yearFilter}`),
      //   fetch(`/api/reportes/rentabilidad`),
      // ]);
      
      // Estado vacío inicial
      setEstadoResultados([]);
      setFlujosCaja([]);
      setBalance(null);
      setRentabilidades([]);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      toast.error('Error al cargar reportes financieros');
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = (formato: 'pdf' | 'excel') => {
    // TODO: Implementar exportación
    toast.success(`Reporte exportado en formato ${formato.toUpperCase()}`);
    setShowExportDialog(false);
  };

  // KPIs calculados
  const ingresosTotales = estadoResultados.reduce((acc, er) => acc + er.ingresos.total, 0);
  const gastosTotales = estadoResultados.reduce((acc, er) => acc + er.gastos.total, 0);
  const resultadoNeto = estadoResultados.reduce((acc, er) => acc + er.resultadoNeto, 0);
  const margenNeto = ingresosTotales > 0 ? (resultadoNeto / ingresosTotales) * 100 : 0;
  const flujoNetoPeriodo = flujosCaja.reduce((acc, fc) => acc + fc.flujoNeto, 0);
  const roiPromedio = rentabilidades.length > 0 
    ? rentabilidades.reduce((acc, r) => acc + r.roi, 0) / rentabilidades.length 
    : 0;

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando reportes financieros...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/reportes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Wallet className="h-8 w-8 text-green-600" />
                Reportes Financieros
              </h1>
              <p className="text-muted-foreground mt-1">
                Estados de resultados, flujo de caja y análisis de rentabilidad
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ingresos Totales</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{ingresosTotales.toLocaleString('es-ES')}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Gastos Totales</span>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold">{gastosTotales.toLocaleString('es-ES')}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Resultado Neto</span>
                <Euro className="h-4 w-4 text-blue-600" />
              </div>
              <p className={`text-2xl font-bold ${resultadoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {resultadoNeto.toLocaleString('es-ES')}€
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Margen Neto</span>
                <PieChart className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{margenNeto.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Flujo de Caja</span>
                <Wallet className="h-4 w-4 text-amber-600" />
              </div>
              <p className={`text-2xl font-bold ${flujoNetoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {flujoNetoPeriodo.toLocaleString('es-ES')}€
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">ROI Promedio</span>
                <BarChart3 className="h-4 w-4 text-cyan-600" />
              </div>
              <p className="text-2xl font-bold">{roiPromedio.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="pyl">
              <Receipt className="h-4 w-4 mr-2" />
              Estado de Resultados
            </TabsTrigger>
            <TabsTrigger value="cashflow">
              <Wallet className="h-4 w-4 mr-2" />
              Flujo de Caja
            </TabsTrigger>
            <TabsTrigger value="balance">
              <PiggyBank className="h-4 w-4 mr-2" />
              Balance General
            </TabsTrigger>
            <TabsTrigger value="rentabilidad">
              <Building2 className="h-4 w-4 mr-2" />
              Rentabilidad por Propiedad
            </TabsTrigger>
          </TabsList>

          {/* Estado de Resultados (P&L) */}
          <TabsContent value="pyl" className="space-y-6">
            {estadoResultados.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos del estado de resultados</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    El estado de resultados se generará automáticamente cuando haya transacciones de ingresos y gastos registradas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Resultados (P&L)</CardTitle>
                  <CardDescription>Período: {yearFilter} - {periodoFilter}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        {estadoResultados.map((er) => (
                          <TableHead key={er.id} className="text-right">{er.periodo}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-semibold bg-gray-50">
                        <TableCell>INGRESOS OPERATIVOS</TableCell>
                        {estadoResultados.map((er) => (
                          <TableCell key={er.id} className="text-right"></TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Alquileres</TableCell>
                        {estadoResultados.map((er) => (
                          <TableCell key={er.id} className="text-right">
                            {er.ingresos.alquileres.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Servicios</TableCell>
                        {estadoResultados.map((er) => (
                          <TableCell key={er.id} className="text-right">
                            {er.ingresos.servicios.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell>Total Ingresos</TableCell>
                        {estadoResultados.map((er) => (
                          <TableCell key={er.id} className="text-right text-green-600">
                            {er.ingresos.total.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-semibold bg-gray-50">
                        <TableCell>GASTOS OPERATIVOS</TableCell>
                        {estadoResultados.map((er) => (
                          <TableCell key={er.id} className="text-right"></TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Mantenimiento</TableCell>
                        {estadoResultados.map((er) => (
                          <TableCell key={er.id} className="text-right text-red-600">
                            -{er.gastos.mantenimiento.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-bold border-t-2">
                        <TableCell>RESULTADO NETO</TableCell>
                        {estadoResultados.map((er) => (
                          <TableCell 
                            key={er.id} 
                            className={`text-right font-bold ${er.resultadoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {er.resultadoNeto.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Flujo de Caja */}
          <TabsContent value="cashflow" className="space-y-6">
            {flujosCaja.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos de flujo de caja</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    El flujo de caja se generará automáticamente cuando haya movimientos de dinero registrados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Flujo de Caja (Cash Flow)</CardTitle>
                  <CardDescription>Período: {yearFilter} - {periodoFilter}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        {flujosCaja.map((fc) => (
                          <TableHead key={fc.id} className="text-right">{fc.periodo}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Saldo Inicial</TableCell>
                        {flujosCaja.map((fc) => (
                          <TableCell key={fc.id} className="text-right">
                            {fc.saldoInicial.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-semibold bg-green-50">
                        <TableCell>ENTRADAS</TableCell>
                        {flujosCaja.map((fc) => (
                          <TableCell key={fc.id} className="text-right text-green-600">
                            +{fc.entradas.total.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-semibold bg-red-50">
                        <TableCell>SALIDAS</TableCell>
                        {flujosCaja.map((fc) => (
                          <TableCell key={fc.id} className="text-right text-red-600">
                            -{fc.salidas.total.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>Flujo Neto</TableCell>
                        {flujosCaja.map((fc) => (
                          <TableCell 
                            key={fc.id} 
                            className={`text-right ${fc.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {fc.flujoNeto.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="font-bold bg-blue-50 border-t-2">
                        <TableCell>Saldo Final</TableCell>
                        {flujosCaja.map((fc) => (
                          <TableCell key={fc.id} className="text-right text-blue-600">
                            {fc.saldoFinal.toLocaleString('es-ES')}€
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Balance General */}
          <TabsContent value="balance" className="space-y-6">
            {!balance ? (
              <Card>
                <CardContent className="text-center py-12">
                  <PiggyBank className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos del balance general</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    El balance general se generará automáticamente cuando haya activos, pasivos y patrimonio registrados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Activos Corrientes</h4>
                        <div className="space-y-2 pl-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Caja y Bancos</span>
                            <span>{balance.activos.corrientes.caja.toLocaleString('es-ES')}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cuentas por Cobrar</span>
                            <span>{balance.activos.corrientes.cuentasCobrar.toLocaleString('es-ES')}€</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2">
                            <span>Subtotal</span>
                            <span>{balance.activos.corrientes.total.toLocaleString('es-ES')}€</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Activos No Corrientes</h4>
                        <div className="space-y-2 pl-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Propiedades</span>
                            <span>{balance.activos.noCorrientes.propiedades.toLocaleString('es-ES')}€</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2">
                            <span>Subtotal</span>
                            <span>{balance.activos.noCorrientes.total.toLocaleString('es-ES')}€</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t-2 pt-4">
                        <span>TOTAL ACTIVOS</span>
                        <span className="text-blue-600">{balance.activos.total.toLocaleString('es-ES')}€</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pasivos y Patrimonio */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pasivos y Patrimonio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Pasivos Corrientes</h4>
                        <div className="space-y-2 pl-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cuentas por Pagar</span>
                            <span>{balance.pasivos.corrientes.cuentasPagar.toLocaleString('es-ES')}€</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2">
                            <span>Subtotal</span>
                            <span>{balance.pasivos.corrientes.total.toLocaleString('es-ES')}€</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Pasivos No Corrientes</h4>
                        <div className="space-y-2 pl-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hipotecas</span>
                            <span>{balance.pasivos.noCorrientes.hipotecas.toLocaleString('es-ES')}€</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2">
                            <span>Subtotal</span>
                            <span>{balance.pasivos.noCorrientes.total.toLocaleString('es-ES')}€</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Patrimonio</h4>
                        <div className="space-y-2 pl-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capital</span>
                            <span>{balance.patrimonio.capital.toLocaleString('es-ES')}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Utilidades Retenidas</span>
                            <span>{balance.patrimonio.utilidadesRetenidas.toLocaleString('es-ES')}€</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2">
                            <span>Subtotal</span>
                            <span>{balance.patrimonio.total.toLocaleString('es-ES')}€</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t-2 pt-4">
                        <span>TOTAL P+P</span>
                        <span className="text-blue-600">
                          {(balance.pasivos.total + balance.patrimonio.total).toLocaleString('es-ES')}€
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Rentabilidad por Propiedad */}
          <TabsContent value="rentabilidad" className="space-y-6">
            {rentabilidades.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos de rentabilidad</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Los análisis de rentabilidad se generarán automáticamente cuando haya propiedades con ingresos y gastos registrados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Rentabilidad por Propiedad</CardTitle>
                  <CardDescription>ROI, Cap Rate y NOI de cada propiedad</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Propiedad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">NOI</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right">Cap Rate</TableHead>
                        <TableHead className="text-right">Ocupación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentabilidades.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.propiedad}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{r.tipo}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {r.ingresos.toLocaleString('es-ES')}€
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {r.gastos.toLocaleString('es-ES')}€
                          </TableCell>
                          <TableCell className={`text-right font-medium ${r.noi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {r.noi.toLocaleString('es-ES')}€
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={r.roi >= 8 ? 'default' : r.roi >= 5 ? 'secondary' : 'destructive'}>
                              {r.roi.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{r.capRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">{r.ocupacion}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de Exportación */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Reportes Financieros</DialogTitle>
              <DialogDescription>
                Selecciona el formato de exportación
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button variant="outline" className="h-24" onClick={() => exportarReporte('pdf')}>
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <span>PDF</span>
                </div>
              </Button>
              <Button variant="outline" className="h-24" onClick={() => exportarReporte('excel')}>
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <span>Excel</span>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
