'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Receipt,
  Plus,
  Search,
  Euro,
  Calendar,
  Users,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  Send,
  Filter,
  Home,
  TrendingUp,
  FileText,
  CreditCard,
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

interface Cuota {
  id: string;
  propietario: string;
  vivienda: string;
  coeficiente: number;
  cuotaOrdinaria: number;
  cuotaExtraordinaria: number;
  total: number;
  estado: 'pagada' | 'pendiente' | 'vencida' | 'parcial';
  fechaEmision: string;
  fechaVencimiento: string;
  fechaPago?: string;
  periodo: string;
  metodoPago?: string;
}

interface Derrama {
  id: string;
  concepto: string;
  importeTotal: number;
  importeRecaudado: number;
  numCuotas: number;
  cuotasPagadas: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'activa' | 'completada' | 'cancelada';
}

const estadoColors: Record<string, string> = {
  pagada: 'bg-green-100 text-green-800',
  pendiente: 'bg-amber-100 text-amber-800',
  vencida: 'bg-red-100 text-red-800',
  parcial: 'bg-blue-100 text-blue-800',
};

const derramaEstadoColors: Record<string, string> = {
  activa: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-100 text-gray-800',
};

export default function CuotasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [derramas, setDerramas] = useState<Derrama[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [periodoFilter, setPeriodoFilter] = useState('actual');
  const [showCreateCuota, setShowCreateCuota] = useState(false);
  const [showCreateDerrama, setShowCreateDerrama] = useState(false);
  const [activeTab, setActiveTab] = useState('cuotas');

  const [newCuota, setNewCuota] = useState({
    propietario: '',
    vivienda: '',
    coeficiente: 0,
    cuotaOrdinaria: 0,
    cuotaExtraordinaria: 0,
    fechaVencimiento: '',
    periodo: '',
  });

  const [newDerrama, setNewDerrama] = useState({
    concepto: '',
    importeTotal: 0,
    numCuotas: 1,
    fechaInicio: '',
    fechaFin: '',
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
      // const response = await fetch('/api/comunidades/cuotas');
      // const data = await response.json();
      // setCuotas(data.cuotas);
      // setDerramas(data.derramas);
      
      // Estado vacío inicial
      setCuotas([]);
      setDerramas([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCuota = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Cuota generada correctamente');
      setShowCreateCuota(false);
      setNewCuota({
        propietario: '',
        vivienda: '',
        coeficiente: 0,
        cuotaOrdinaria: 0,
        cuotaExtraordinaria: 0,
        fechaVencimiento: '',
        periodo: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear la cuota');
    }
  };

  const handleCreateDerrama = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Derrama creada correctamente');
      setShowCreateDerrama(false);
      setNewDerrama({
        concepto: '',
        importeTotal: 0,
        numCuotas: 1,
        fechaInicio: '',
        fechaFin: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear la derrama');
    }
  };

  const filteredCuotas = cuotas.filter((cuota) => {
    const matchesSearch = cuota.propietario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cuota.vivienda.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || cuota.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  // KPIs
  const totalCuotas = cuotas.length;
  const cuotasPagadas = cuotas.filter(c => c.estado === 'pagada').length;
  const cuotasPendientes = cuotas.filter(c => c.estado === 'pendiente').length;
  const cuotasVencidas = cuotas.filter(c => c.estado === 'vencida').length;
  const importeRecaudado = cuotas.filter(c => c.estado === 'pagada').reduce((sum, c) => sum + c.total, 0);
  const importePendiente = cuotas.filter(c => c.estado !== 'pagada').reduce((sum, c) => sum + c.total, 0);
  const tasaCobro = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                <Receipt className="h-8 w-8 text-blue-600" />
                Cuotas de Comunidad
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestión de cuotas ordinarias, extraordinarias y derramas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateDerrama(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Derrama
            </Button>
            <Dialog open={showCreateCuota} onOpenChange={setShowCreateCuota}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generar Cuotas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generar Cuotas</DialogTitle>
                  <DialogDescription>
                    Genera cuotas para el periodo seleccionado
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Periodo</Label>
                    <Select value={newCuota.periodo} onValueChange={(v) => setNewCuota({...newCuota, periodo: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2026-01">Enero 2026</SelectItem>
                        <SelectItem value="2026-02">Febrero 2026</SelectItem>
                        <SelectItem value="2026-03">Marzo 2026</SelectItem>
                        <SelectItem value="2026-Q1">1º Trimestre 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Cuota Base Ordinaria (€)</Label>
                    <Input
                      type="number"
                      value={newCuota.cuotaOrdinaria || ''}
                      onChange={(e) => setNewCuota({...newCuota, cuotaOrdinaria: parseFloat(e.target.value) || 0})}
                      placeholder="Importe base antes de coeficiente"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Cuota Extraordinaria (€)</Label>
                    <Input
                      type="number"
                      value={newCuota.cuotaExtraordinaria || ''}
                      onChange={(e) => setNewCuota({...newCuota, cuotaExtraordinaria: parseFloat(e.target.value) || 0})}
                      placeholder="0 si no aplica"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={newCuota.fechaVencimiento}
                      onChange={(e) => setNewCuota({...newCuota, fechaVencimiento: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateCuota(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCuota}>
                    Generar Cuotas
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cuotas</p>
                  <p className="text-2xl font-bold">{totalCuotas}</p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pagadas</p>
                  <p className="text-2xl font-bold text-green-600">{cuotasPagadas}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{cuotasPendientes}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vencidas</p>
                  <p className="text-2xl font-bold text-red-600">{cuotasVencidas}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recaudado</p>
                  <p className="text-2xl font-bold">{importeRecaudado.toLocaleString('es-ES')}€</p>
                </div>
                <Euro className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendiente</p>
                  <p className="text-2xl font-bold">{importePendiente.toLocaleString('es-ES')}€</p>
                </div>
                <Euro className="h-8 w-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasa Cobro</p>
                  <p className="text-2xl font-bold">{tasaCobro.toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
              <Progress value={tasaCobro} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="cuotas">Cuotas</TabsTrigger>
            <TabsTrigger value="derramas">Derramas</TabsTrigger>
            <TabsTrigger value="morosos">Morosos</TabsTrigger>
            <TabsTrigger value="historial">Historial de Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="cuotas" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por propietario o vivienda..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="pagada">Pagadas</SelectItem>
                      <SelectItem value="pendiente">Pendientes</SelectItem>
                      <SelectItem value="vencida">Vencidas</SelectItem>
                      <SelectItem value="parcial">Pago Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actual">Periodo Actual</SelectItem>
                      <SelectItem value="anterior">Periodo Anterior</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Cuotas */}
            {filteredCuotas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay cuotas</h3>
                  <p className="text-muted-foreground mb-4">
                    Genera cuotas para el periodo actual
                  </p>
                  <Button onClick={() => setShowCreateCuota(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generar Cuotas
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
                          <th className="text-left p-4 font-medium">Vivienda</th>
                          <th className="text-left p-4 font-medium">Propietario</th>
                          <th className="text-left p-4 font-medium">Coef.</th>
                          <th className="text-left p-4 font-medium">Ordinaria</th>
                          <th className="text-left p-4 font-medium">Extra</th>
                          <th className="text-left p-4 font-medium">Total</th>
                          <th className="text-left p-4 font-medium">Vencimiento</th>
                          <th className="text-left p-4 font-medium">Estado</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCuotas.map((cuota) => (
                          <tr key={cuota.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-gray-400" />
                                {cuota.vivienda}
                              </div>
                            </td>
                            <td className="p-4">{cuota.propietario}</td>
                            <td className="p-4">{cuota.coeficiente}%</td>
                            <td className="p-4">{cuota.cuotaOrdinaria}€</td>
                            <td className="p-4">{cuota.cuotaExtraordinaria}€</td>
                            <td className="p-4 font-medium">{cuota.total}€</td>
                            <td className="p-4">{cuota.fechaVencimiento}</td>
                            <td className="p-4">
                              <Badge className={estadoColors[cuota.estado]}>
                                {cuota.estado}
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
                                    Ver detalle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Registrar pago
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar recordatorio
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Generar recibo
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

          <TabsContent value="derramas" className="space-y-4">
            {derramas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay derramas activas</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea una derrama para gastos extraordinarios
                  </p>
                  <Button onClick={() => setShowCreateDerrama(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Derrama
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {derramas.map((derrama) => (
                  <Card key={derrama.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{derrama.concepto}</CardTitle>
                          <CardDescription>
                            {derrama.fechaInicio} - {derrama.fechaFin}
                          </CardDescription>
                        </div>
                        <Badge className={derramaEstadoColors[derrama.estado]}>
                          {derrama.estado}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Importe Total</span>
                        <span className="font-medium">{derrama.importeTotal.toLocaleString('es-ES')}€</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Recaudado</span>
                        <span className="font-medium text-green-600">{derrama.importeRecaudado.toLocaleString('es-ES')}€</span>
                      </div>
                      <Progress value={(derrama.importeRecaudado / derrama.importeTotal) * 100} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cuotas pagadas</span>
                        <span>{derrama.cuotasPagadas} / {derrama.numCuotas}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="morosos" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Gestión de Morosos</h3>
                <p className="text-muted-foreground">
                  No hay propietarios con cuotas vencidas
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Historial de Pagos</h3>
                <p className="text-muted-foreground">
                  El historial de pagos aparecerá aquí
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Crear Derrama */}
        <Dialog open={showCreateDerrama} onOpenChange={setShowCreateDerrama}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Derrama</DialogTitle>
              <DialogDescription>
                Crear una derrama para gastos extraordinarios
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Concepto</Label>
                <Input
                  value={newDerrama.concepto}
                  onChange={(e) => setNewDerrama({...newDerrama, concepto: e.target.value})}
                  placeholder="Ej: Reparación de fachada"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Importe Total (€)</Label>
                  <Input
                    type="number"
                    value={newDerrama.importeTotal || ''}
                    onChange={(e) => setNewDerrama({...newDerrama, importeTotal: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Nº Cuotas</Label>
                  <Input
                    type="number"
                    value={newDerrama.numCuotas}
                    onChange={(e) => setNewDerrama({...newDerrama, numCuotas: parseInt(e.target.value) || 1})}
                    min={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={newDerrama.fechaInicio}
                    onChange={(e) => setNewDerrama({...newDerrama, fechaInicio: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={newDerrama.fechaFin}
                    onChange={(e) => setNewDerrama({...newDerrama, fechaFin: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDerrama(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateDerrama}>
                Crear Derrama
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
