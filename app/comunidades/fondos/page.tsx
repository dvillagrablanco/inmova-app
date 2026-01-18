'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Wallet,
  Plus,
  Search,
  Euro,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Shield,
  Wrench,
  Building2,
  Calendar,
  FileText,
  RefreshCw,
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

interface Fondo {
  id: string;
  nombre: string;
  tipo: 'reserva' | 'mantenimiento' | 'obras' | 'seguro' | 'emergencia' | 'otro';
  saldoActual: number;
  saldoObjetivo: number;
  descripcion: string;
  fechaCreacion: string;
  ultimoMovimiento?: string;
}

interface Movimiento {
  id: string;
  fondoId: string;
  fondoNombre: string;
  tipo: 'ingreso' | 'gasto' | 'transferencia';
  concepto: string;
  importe: number;
  fecha: string;
  referencia?: string;
  aprobadoPor?: string;
}

const tipoFondoConfig: Record<string, { color: string; icon: any; label: string }> = {
  reserva: { color: 'bg-blue-100 text-blue-800', icon: PiggyBank, label: 'Fondo de Reserva' },
  mantenimiento: { color: 'bg-green-100 text-green-800', icon: Wrench, label: 'Mantenimiento' },
  obras: { color: 'bg-amber-100 text-amber-800', icon: Building2, label: 'Obras' },
  seguro: { color: 'bg-purple-100 text-purple-800', icon: Shield, label: 'Seguro' },
  emergencia: { color: 'bg-red-100 text-red-800', icon: Shield, label: 'Emergencia' },
  otro: { color: 'bg-gray-100 text-gray-800', icon: Wallet, label: 'Otro' },
};

const tipoMovimientoConfig: Record<string, { color: string; icon: any }> = {
  ingreso: { color: 'text-green-600', icon: ArrowDownRight },
  gasto: { color: 'text-red-600', icon: ArrowUpRight },
  transferencia: { color: 'text-blue-600', icon: RefreshCw },
};

export default function FondosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [showCreateFondo, setShowCreateFondo] = useState(false);
  const [showCreateMovimiento, setShowCreateMovimiento] = useState(false);
  const [activeTab, setActiveTab] = useState('fondos');

  const [newFondo, setNewFondo] = useState({
    nombre: '',
    tipo: 'reserva' as const,
    saldoObjetivo: 0,
    descripcion: '',
  });

  const [newMovimiento, setNewMovimiento] = useState({
    fondoId: '',
    tipo: 'ingreso' as const,
    concepto: '',
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
      // const response = await fetch('/api/comunidades/fondos');
      // const data = await response.json();
      // setFondos(data.fondos);
      // setMovimientos(data.movimientos);
      
      // Estado vacío inicial
      setFondos([]);
      setMovimientos([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFondo = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Fondo creado correctamente');
      setShowCreateFondo(false);
      setNewFondo({
        nombre: '',
        tipo: 'reserva',
        saldoObjetivo: 0,
        descripcion: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear el fondo');
    }
  };

  const handleCreateMovimiento = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Movimiento registrado correctamente');
      setShowCreateMovimiento(false);
      setNewMovimiento({
        fondoId: '',
        tipo: 'ingreso',
        concepto: '',
        importe: 0,
        referencia: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al registrar el movimiento');
    }
  };

  const filteredFondos = fondos.filter((fondo) => {
    const matchesSearch = fondo.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || fondo.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  // KPIs
  const saldoTotal = fondos.reduce((sum, f) => sum + f.saldoActual, 0);
  const objetivoTotal = fondos.reduce((sum, f) => sum + f.saldoObjetivo, 0);
  const porcentajeObjetivo = objetivoTotal > 0 ? (saldoTotal / objetivoTotal) * 100 : 0;
  const ingresosMes = movimientos
    .filter(m => m.tipo === 'ingreso' && new Date(m.fecha).getMonth() === new Date().getMonth())
    .reduce((sum, m) => sum + m.importe, 0);
  const gastosMes = movimientos
    .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() === new Date().getMonth())
    .reduce((sum, m) => sum + m.importe, 0);

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
                <Wallet className="h-8 w-8 text-green-600" />
                Gestión de Fondos
              </h1>
              <p className="text-muted-foreground mt-1">
                Control de fondos de reserva, mantenimiento y obras
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateMovimiento(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Movimiento
            </Button>
            <Dialog open={showCreateFondo} onOpenChange={setShowCreateFondo}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Fondo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Fondo</DialogTitle>
                  <DialogDescription>
                    Crear un nuevo fondo de reserva
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Nombre del Fondo</Label>
                    <Input
                      value={newFondo.nombre}
                      onChange={(e) => setNewFondo({...newFondo, nombre: e.target.value})}
                      placeholder="Ej: Fondo de Reserva Principal"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={newFondo.tipo} onValueChange={(v: any) => setNewFondo({...newFondo, tipo: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reserva">Fondo de Reserva</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="obras">Obras</SelectItem>
                        <SelectItem value="seguro">Seguro</SelectItem>
                        <SelectItem value="emergencia">Emergencia</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Saldo Objetivo (€)</Label>
                    <Input
                      type="number"
                      value={newFondo.saldoObjetivo || ''}
                      onChange={(e) => setNewFondo({...newFondo, saldoObjetivo: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={newFondo.descripcion}
                      onChange={(e) => setNewFondo({...newFondo, descripcion: e.target.value})}
                      placeholder="Descripción del fondo y su finalidad..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateFondo(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateFondo}>
                    Crear Fondo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Total</p>
                  <p className="text-2xl font-bold">{saldoTotal.toLocaleString('es-ES')}€</p>
                </div>
                <Wallet className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Objetivo Total</p>
                  <p className="text-2xl font-bold">{objetivoTotal.toLocaleString('es-ES')}€</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
              <Progress value={porcentajeObjetivo} className="h-1 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fondos Activos</p>
                  <p className="text-2xl font-bold">{fondos.length}</p>
                </div>
                <PiggyBank className="h-8 w-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Mes</p>
                  <p className="text-2xl font-bold text-green-600">+{ingresosMes.toLocaleString('es-ES')}€</p>
                </div>
                <ArrowDownRight className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gastos Mes</p>
                  <p className="text-2xl font-bold text-red-600">-{gastosMes.toLocaleString('es-ES')}€</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="fondos">Fondos</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="proyecciones">Proyecciones</TabsTrigger>
          </TabsList>

          <TabsContent value="fondos" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar fondo..."
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
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="reserva">Reserva</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="obras">Obras</SelectItem>
                      <SelectItem value="seguro">Seguro</SelectItem>
                      <SelectItem value="emergencia">Emergencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Fondos */}
            {filteredFondos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay fondos</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea fondos para gestionar las reservas de la comunidad
                  </p>
                  <Button onClick={() => setShowCreateFondo(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Fondo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFondos.map((fondo) => {
                  const config = tipoFondoConfig[fondo.tipo];
                  const IconComponent = config.icon;
                  const porcentaje = fondo.saldoObjetivo > 0 ? (fondo.saldoActual / fondo.saldoObjetivo) * 100 : 0;
                  
                  return (
                    <Card key={fondo.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{fondo.nombre}</CardTitle>
                              <Badge variant="outline" className="mt-1">
                                {config.label}
                              </Badge>
                            </div>
                          </div>
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
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                Ver movimientos
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Saldo Actual</span>
                            <span className="font-bold text-xl">{fondo.saldoActual.toLocaleString('es-ES')}€</span>
                          </div>
                          <Progress value={porcentaje} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{porcentaje.toFixed(0)}% del objetivo</span>
                            <span>Meta: {fondo.saldoObjetivo.toLocaleString('es-ES')}€</span>
                          </div>
                        </div>
                        {fondo.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {fondo.descripcion}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCreateMovimiento(true)}>
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            Ingreso
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCreateMovimiento(true)}>
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Gasto
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="movimientos" className="space-y-4">
            {movimientos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay movimientos</h3>
                  <p className="text-muted-foreground mb-4">
                    Los movimientos de fondos aparecerán aquí
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
                          <th className="text-left p-4 font-medium">Fondo</th>
                          <th className="text-left p-4 font-medium">Concepto</th>
                          <th className="text-left p-4 font-medium">Tipo</th>
                          <th className="text-right p-4 font-medium">Importe</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map((mov) => {
                          const config = tipoMovimientoConfig[mov.tipo];
                          const IconComponent = config.icon;
                          
                          return (
                            <tr key={mov.id} className="border-b hover:bg-gray-50">
                              <td className="p-4">{mov.fecha}</td>
                              <td className="p-4">{mov.fondoNombre}</td>
                              <td className="p-4">{mov.concepto}</td>
                              <td className="p-4">
                                <div className={`flex items-center gap-1 ${config.color}`}>
                                  <IconComponent className="h-4 w-4" />
                                  {mov.tipo}
                                </div>
                              </td>
                              <td className={`p-4 text-right font-medium ${config.color}`}>
                                {mov.tipo === 'gasto' ? '-' : '+'}{mov.importe.toLocaleString('es-ES')}€
                              </td>
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

          <TabsContent value="proyecciones" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Proyecciones</h3>
                <p className="text-muted-foreground">
                  Análisis y proyecciones de fondos próximamente
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Crear Movimiento */}
        <Dialog open={showCreateMovimiento} onOpenChange={setShowCreateMovimiento}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Movimiento</DialogTitle>
              <DialogDescription>
                Registrar un ingreso o gasto en un fondo
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Fondo</Label>
                <Select value={newMovimiento.fondoId} onValueChange={(v) => setNewMovimiento({...newMovimiento, fondoId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar fondo" />
                  </SelectTrigger>
                  <SelectContent>
                    {fondos.map(fondo => (
                      <SelectItem key={fondo.id} value={fondo.id}>
                        {fondo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Movimiento</Label>
                <Select value={newMovimiento.tipo} onValueChange={(v: any) => setNewMovimiento({...newMovimiento, tipo: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="gasto">Gasto</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Label>Importe (€)</Label>
                  <Input
                    type="number"
                    value={newMovimiento.importe || ''}
                    onChange={(e) => setNewMovimiento({...newMovimiento, importe: parseFloat(e.target.value) || 0})}
                  />
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateMovimiento(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMovimiento}>
                Registrar Movimiento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
