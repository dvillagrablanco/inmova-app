'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Landmark,
  Plus,
  Search,
  Euro,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  Download,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  CreditCard,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ResumenFinanciero {
  saldoBancario: number;
  ingresosMes: number;
  gastosMes: number;
  fondoReserva: number;
  cuotasPendientes: number;
  facturasApagar: number;
  presupuestoAnual: number;
  ejecutadoAnual: number;
}

interface Movimiento {
  id: string;
  fecha: string;
  concepto: string;
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  importe: number;
  saldo: number;
  referencia?: string;
  factura?: string;
  estado: 'confirmado' | 'pendiente' | 'conciliado';
}

interface Factura {
  id: string;
  numero: string;
  proveedor: string;
  concepto: string;
  fechaEmision: string;
  fechaVencimiento: string;
  importe: number;
  iva: number;
  total: number;
  estado: 'pendiente' | 'pagada' | 'vencida' | 'parcial';
}

interface PresupuestoPartida {
  id: string;
  categoria: string;
  descripcion: string;
  presupuestado: number;
  ejecutado: number;
  porcentaje: number;
}

const estadoFacturaColors: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  pagada: 'bg-green-100 text-green-800',
  vencida: 'bg-red-100 text-red-800',
  parcial: 'bg-blue-100 text-blue-800',
};

const tipoMovimientoConfig: Record<string, { color: string; icon: any }> = {
  ingreso: { color: 'text-green-600', icon: ArrowDownRight },
  gasto: { color: 'text-red-600', icon: ArrowUpRight },
};

export default function FinanzasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [partidas, setPartidas] = useState<PresupuestoPartida[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [showCreateMovimiento, setShowCreateMovimiento] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');

  const [newMovimiento, setNewMovimiento] = useState({
    fecha: '',
    concepto: '',
    tipo: 'gasto' as const,
    categoria: '',
    importe: 0,
    referencia: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/comunidades/finanzas');
      // const data = await response.json();
      // setResumen(data.resumen);
      // setMovimientos(data.movimientos);
      // setFacturas(data.facturas);
      // setPartidas(data.partidas);
      
      // Estado vacío inicial
      setResumen(null);
      setMovimientos([]);
      setFacturas([]);
      setPartidas([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovimiento = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Movimiento registrado correctamente');
      setShowCreateMovimiento(false);
      setNewMovimiento({
        fecha: '',
        concepto: '',
        tipo: 'gasto',
        categoria: '',
        importe: 0,
        referencia: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al registrar el movimiento');
    }
  };

  const filteredMovimientos = movimientos.filter((mov) => {
    const matchesSearch = mov.concepto.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || mov.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Landmark className="h-8 w-8 text-green-600" />
                Gestión de Finanzas
              </h1>
              <p className="text-muted-foreground mt-1">
                Control financiero, presupuestos y contabilidad
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Dialog open={showCreateMovimiento} onOpenChange={setShowCreateMovimiento}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Movimiento</DialogTitle>
                  <DialogDescription>
                    Registrar un ingreso o gasto
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={newMovimiento.fecha}
                        onChange={(e) => setNewMovimiento({...newMovimiento, fecha: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tipo</Label>
                      <Select value={newMovimiento.tipo} onValueChange={(v: any) => setNewMovimiento({...newMovimiento, tipo: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingreso">Ingreso</SelectItem>
                          <SelectItem value="gasto">Gasto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Concepto</Label>
                    <Input
                      value={newMovimiento.concepto}
                      onChange={(e) => setNewMovimiento({...newMovimiento, concepto: e.target.value})}
                      placeholder="Descripción del movimiento"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Categoría</Label>
                      <Select value={newMovimiento.categoria} onValueChange={(v) => setNewMovimiento({...newMovimiento, categoria: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cuotas">Cuotas</SelectItem>
                          <SelectItem value="suministros">Suministros</SelectItem>
                          <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                          <SelectItem value="seguros">Seguros</SelectItem>
                          <SelectItem value="limpieza">Limpieza</SelectItem>
                          <SelectItem value="administracion">Administración</SelectItem>
                          <SelectItem value="otros">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Importe (€)</Label>
                      <Input
                        type="number"
                        value={newMovimiento.importe || ''}
                        onChange={(e) => setNewMovimiento({...newMovimiento, importe: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Referencia</Label>
                    <Input
                      value={newMovimiento.referencia}
                      onChange={(e) => setNewMovimiento({...newMovimiento, referencia: e.target.value})}
                      placeholder="Nº factura, recibo..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateMovimiento(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateMovimiento}>
                    Registrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        {resumen ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Bancario</p>
                    <p className="text-2xl font-bold">{resumen.saldoBancario.toLocaleString('es-ES')}€</p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos Mes</p>
                    <p className="text-2xl font-bold text-green-600">+{resumen.ingresosMes.toLocaleString('es-ES')}€</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gastos Mes</p>
                    <p className="text-2xl font-bold text-red-600">-{resumen.gastosMes.toLocaleString('es-ES')}€</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fondo Reserva</p>
                    <p className="text-2xl font-bold">{resumen.fondoReserva.toLocaleString('es-ES')}€</p>
                  </div>
                  <Landmark className="h-8 w-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Bancario</p>
                    <p className="text-2xl font-bold">0€</p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos Mes</p>
                    <p className="text-2xl font-bold text-green-600">0€</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gastos Mes</p>
                    <p className="text-2xl font-bold text-red-600">0€</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fondo Reserva</p>
                    <p className="text-2xl font-bold">0€</p>
                  </div>
                  <Landmark className="h-8 w-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="facturas">Facturas</TabsTrigger>
            <TabsTrigger value="presupuesto">Presupuesto</TabsTrigger>
            <TabsTrigger value="informes">Informes</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gráfico de ingresos vs gastos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Ingresos vs Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Gráfico de evolución mensual
                  </p>
                </CardContent>
              </Card>

              {/* Distribución de gastos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribución de Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Gráfico de distribución por categoría
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alertas financieras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Alertas Financieras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay alertas financieras activas</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movimientos" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar movimiento..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ingreso">Ingresos</SelectItem>
                      <SelectItem value="gasto">Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Más filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de movimientos */}
            {filteredMovimientos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay movimientos</h3>
                  <p className="text-muted-foreground mb-4">
                    Registra los movimientos financieros de la comunidad
                  </p>
                  <Button onClick={() => setShowCreateMovimiento(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Movimiento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium">Fecha</th>
                          <th className="text-left p-4 font-medium">Concepto</th>
                          <th className="text-left p-4 font-medium">Categoría</th>
                          <th className="text-left p-4 font-medium">Tipo</th>
                          <th className="text-right p-4 font-medium">Importe</th>
                          <th className="text-right p-4 font-medium">Saldo</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMovimientos.map((mov) => {
                          const config = tipoMovimientoConfig[mov.tipo];
                          const IconComponent = config.icon;
                          
                          return (
                            <tr key={mov.id} className="border-b hover:bg-gray-50">
                              <td className="p-4">{mov.fecha}</td>
                              <td className="p-4">{mov.concepto}</td>
                              <td className="p-4">
                                <Badge variant="outline">{mov.categoria}</Badge>
                              </td>
                              <td className="p-4">
                                <div className={`flex items-center gap-1 ${config.color}`}>
                                  <IconComponent className="h-4 w-4" />
                                  {mov.tipo}
                                </div>
                              </td>
                              <td className={`p-4 text-right font-medium ${config.color}`}>
                                {mov.tipo === 'gasto' ? '-' : '+'}{mov.importe.toLocaleString('es-ES')}€
                              </td>
                              <td className="p-4 text-right">{mov.saldo.toLocaleString('es-ES')}€</td>
                              <td className="p-4 text-right">
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="facturas" className="space-y-4">
            {facturas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay facturas</h3>
                  <p className="text-muted-foreground">
                    Las facturas de proveedores aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium">Nº Factura</th>
                          <th className="text-left p-4 font-medium">Proveedor</th>
                          <th className="text-left p-4 font-medium">Concepto</th>
                          <th className="text-left p-4 font-medium">Emisión</th>
                          <th className="text-left p-4 font-medium">Vencimiento</th>
                          <th className="text-right p-4 font-medium">Total</th>
                          <th className="text-left p-4 font-medium">Estado</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facturas.map((factura) => (
                          <tr key={factura.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{factura.numero}</td>
                            <td className="p-4">{factura.proveedor}</td>
                            <td className="p-4">{factura.concepto}</td>
                            <td className="p-4">{factura.fechaEmision}</td>
                            <td className="p-4">{factura.fechaVencimiento}</td>
                            <td className="p-4 text-right font-medium">{factura.total.toLocaleString('es-ES')}€</td>
                            <td className="p-4">
                              <Badge className={estadoFacturaColors[factura.estado]}>
                                {factura.estado}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver factura
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Registrar pago
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="presupuesto" className="space-y-4">
            {partidas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay presupuesto</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea el presupuesto anual de la comunidad
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Presupuesto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {partidas.map((partida) => (
                  <Card key={partida.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{partida.categoria}</h3>
                          <p className="text-sm text-muted-foreground">{partida.descripcion}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{partida.ejecutado.toLocaleString('es-ES')}€</p>
                          <p className="text-sm text-muted-foreground">de {partida.presupuestado.toLocaleString('es-ES')}€</p>
                        </div>
                      </div>
                      <Progress value={partida.porcentaje} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1 text-right">{partida.porcentaje}%</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="informes" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Informes Financieros</h3>
                <p className="text-muted-foreground mb-4">
                  Genera informes financieros para la comunidad
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline">
                    Balance Mensual
                  </Button>
                  <Button variant="outline">
                    Estado de Cuentas
                  </Button>
                  <Button variant="outline">
                    Cierre Anual
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
