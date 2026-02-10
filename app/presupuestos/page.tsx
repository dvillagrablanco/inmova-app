'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/lazy-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  Plus,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Wrench,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Copy,
  ArrowLeft,
  Home,
  Euro,
  Calendar,
  User,
  Building2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BudgetItem {
  id: string;
  concepto: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  total: number;
}

interface Budget {
  id: string;
  numero: string;
  titulo: string;
  descripcion?: string;
  tipo: 'mantenimiento' | 'reforma' | 'servicio' | 'honorarios';
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'facturado';
  propiedad?: { id: string; direccion: string };
  cliente?: { id: string; nombre: string };
  proveedor?: { id: string; nombre: string };
  fechaCreacion: Date;
  fechaValidez: Date;
  items: BudgetItem[];
  subtotal: number;
  iva: number;
  total: number;
  notas?: string;
}

const initialBudgets: Budget[] = [];

export default function PresupuestosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Form state for new budget
  const [newBudget, setNewBudget] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'mantenimiento' as Budget['tipo'],
    propiedadId: '',
    clienteNombre: '',
    proveedorNombre: '',
    validezDias: '30',
    items: [] as BudgetItem[],
    notas: '',
    ivaRate: '21',
  });

  const [newItem, setNewItem] = useState({
    concepto: '',
    cantidad: '1',
    unidad: 'ud',
    precioUnitario: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadBudgets();
    }
  }, [session]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        const rawBudgets = data.budgets || data || [];
        
        // Mapear ProviderQuote a Budget
        const mappedBudgets: Budget[] = rawBudgets.map((q: any) => ({
          id: q.id,
          numero: `PRES-${q.id?.slice(-6)?.toUpperCase() || '000000'}`,
          titulo: q.titulo,
          descripcion: q.descripcion,
          tipo: 'mantenimiento' as const, // Default
          estado: mapEstado(q.estado),
          proveedor: q.provider ? { id: q.providerId, nombre: q.provider.nombre } : undefined,
          cliente: q.workOrder ? { id: q.workOrderId, nombre: q.workOrder.titulo } : undefined,
          fechaCreacion: new Date(q.createdAt),
          fechaValidez: new Date(q.fechaVencimiento || Date.now()),
          items: Array.isArray(q.conceptos) ? q.conceptos.map((c: any, idx: number) => ({
            id: `item-${idx}`,
            concepto: c.descripcion || c.concepto || '',
            cantidad: c.cantidad || 1,
            unidad: c.unidad || 'ud',
            precioUnitario: c.precioUnitario || 0,
            total: c.total || 0,
          })) : [],
          subtotal: q.subtotal || 0,
          iva: q.montoIva || q.iva || 0,
          total: q.total || 0,
          notas: q.notas,
        }));
        
        setBudgets(mappedBudgets);
      } else {
        console.error('Error fetching budgets');
        setBudgets([]);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error('Error al cargar presupuestos');
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper para mapear estado de API a estado de UI
  const mapEstado = (apiEstado: string): Budget['estado'] => {
    const estadoMap: Record<string, Budget['estado']> = {
      'pendiente': 'enviado',
      'aprobado': 'aprobado',
      'rechazado': 'rechazado',
      'borrador': 'borrador',
      'facturado': 'facturado',
    };
    return estadoMap[apiEstado] || 'borrador';
  };

  const stats = useMemo(() => {
    return {
      total: budgets.length,
      borradores: budgets.filter(b => b.estado === 'borrador').length,
      enviados: budgets.filter(b => b.estado === 'enviado').length,
      aprobados: budgets.filter(b => b.estado === 'aprobado').length,
      rechazados: budgets.filter(b => b.estado === 'rechazado').length,
      valorTotal: budgets.reduce((sum, b) => sum + b.total, 0),
      valorAprobado: budgets.filter(b => b.estado === 'aprobado').reduce((sum, b) => sum + b.total, 0),
    };
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(budget => {
      const matchesSearch = budget.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.numero.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'todos' || budget.estado === filterEstado;
      const matchesTipo = filterTipo === 'todos' || budget.tipo === filterTipo;
      return matchesSearch && matchesEstado && matchesTipo;
    });
  }, [budgets, searchTerm, filterEstado, filterTipo]);

  const addItem = () => {
    if (!newItem.concepto || !newItem.precioUnitario) {
      toast.error('Complete todos los campos del ítem');
      return;
    }

    const item: BudgetItem = {
      id: Date.now().toString(),
      concepto: newItem.concepto,
      cantidad: parseFloat(newItem.cantidad) || 1,
      unidad: newItem.unidad,
      precioUnitario: parseFloat(newItem.precioUnitario),
      total: (parseFloat(newItem.cantidad) || 1) * parseFloat(newItem.precioUnitario),
    };

    setNewBudget(prev => ({
      ...prev,
      items: [...prev.items, item],
    }));

    setNewItem({ concepto: '', cantidad: '1', unidad: 'ud', precioUnitario: '' });
  };

  const removeItem = (itemId: string) => {
    setNewBudget(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== itemId),
    }));
  };

  const calculateTotals = () => {
    const subtotal = newBudget.items.reduce((sum, item) => sum + item.total, 0);
    const ivaAmount = subtotal * (parseFloat(newBudget.ivaRate) / 100);
    const total = subtotal + ivaAmount;
    return { subtotal, ivaAmount, total };
  };

  const handleCreateBudget = async () => {
    if (!newBudget.titulo || newBudget.items.length === 0) {
      toast.error('Añada un título y al menos un ítem');
      return;
    }

    const { subtotal, ivaAmount, total } = calculateTotals();
    
    const budget: Budget = {
      id: Date.now().toString(),
      numero: `PRES-${new Date().getFullYear()}-${String(budgets.length + 1).padStart(4, '0')}`,
      titulo: newBudget.titulo,
      descripcion: newBudget.descripcion,
      tipo: newBudget.tipo,
      estado: 'borrador',
      fechaCreacion: new Date(),
      fechaValidez: new Date(Date.now() + parseInt(newBudget.validezDias) * 24 * 60 * 60 * 1000),
      items: newBudget.items,
      subtotal,
      iva: ivaAmount,
      total,
      notas: newBudget.notas,
      cliente: newBudget.clienteNombre ? { id: '1', nombre: newBudget.clienteNombre } : undefined,
      proveedor: newBudget.proveedorNombre ? { id: '1', nombre: newBudget.proveedorNombre } : undefined,
    };

    setBudgets(prev => [budget, ...prev]);
    setShowNewDialog(false);
    setNewBudget({
      titulo: '',
      descripcion: '',
      tipo: 'mantenimiento',
      propiedadId: '',
      clienteNombre: '',
      proveedorNombre: '',
      validezDias: '30',
      items: [],
      notas: '',
      ivaRate: '21',
    });
    toast.success('Presupuesto creado correctamente');
  };

  const getEstadoBadge = (estado: Budget['estado']) => {
    const config = {
      borrador: { variant: 'secondary' as const, icon: Edit, label: 'Borrador' },
      enviado: { variant: 'default' as const, icon: Send, label: 'Enviado' },
      aprobado: { variant: 'default' as const, icon: CheckCircle, label: 'Aprobado', className: 'bg-green-600' },
      rechazado: { variant: 'destructive' as const, icon: XCircle, label: 'Rechazado' },
      facturado: { variant: 'default' as const, icon: FileText, label: 'Facturado', className: 'bg-blue-600' },
    };
    const { variant, icon: Icon, label, className } = config[estado];
    return (
      <Badge variant={variant} className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: Budget['tipo']) => {
    const config = {
      mantenimiento: { icon: Wrench, label: 'Mantenimiento', color: 'text-orange-600' },
      reforma: { icon: Building, label: 'Reforma', color: 'text-blue-600' },
      servicio: { icon: User, label: 'Servicio', color: 'text-purple-600' },
      honorarios: { icon: Calculator, label: 'Honorarios', color: 'text-green-600' },
    };
    const { icon: Icon, label, color } = config[tipo];
    return (
      <span className={`flex items-center gap-1 text-sm ${color}`}>
        <Icon className="h-4 w-4" />
        {label}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const { subtotal, ivaAmount, total } = calculateTotals();

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="mb-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Presupuestos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calculator className="h-8 w-8 text-primary" />
              Presupuestos
            </h1>
            <p className="text-muted-foreground mt-2">
              Crea y gestiona presupuestos de mantenimiento, reformas y servicios
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadBudgets}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Presupuesto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Presupuesto</DialogTitle>
                  <DialogDescription>
                    Crea un presupuesto para mantenimiento, reforma o servicios
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Información básica */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        placeholder="Ej: Reparación fontanería Piso 3A"
                        value={newBudget.titulo}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, titulo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={newBudget.tipo}
                        onValueChange={(value: Budget['tipo']) => setNewBudget(prev => ({ ...prev, tipo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mantenimiento">
                            <span className="flex items-center gap-2">
                              <Wrench className="h-4 w-4" /> Mantenimiento
                            </span>
                          </SelectItem>
                          <SelectItem value="reforma">
                            <span className="flex items-center gap-2">
                              <Building className="h-4 w-4" /> Reforma
                            </span>
                          </SelectItem>
                          <SelectItem value="servicio">
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4" /> Servicio
                            </span>
                          </SelectItem>
                          <SelectItem value="honorarios">
                            <span className="flex items-center gap-2">
                              <Calculator className="h-4 w-4" /> Honorarios
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Descripción detallada del presupuesto..."
                      value={newBudget.descripcion}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, descripcion: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="clienteNombre">Cliente</Label>
                      <Input
                        id="clienteNombre"
                        placeholder="Nombre del cliente"
                        value={newBudget.clienteNombre}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, clienteNombre: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proveedorNombre">Proveedor</Label>
                      <Input
                        id="proveedorNombre"
                        placeholder="Nombre del proveedor"
                        value={newBudget.proveedorNombre}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, proveedorNombre: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validezDias">Validez (días)</Label>
                      <Input
                        id="validezDias"
                        type="number"
                        value={newBudget.validezDias}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, validezDias: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Items del presupuesto */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Partidas del presupuesto</h4>
                    
                    <div className="grid gap-2 md:grid-cols-5">
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Concepto"
                          value={newItem.concepto}
                          onChange={(e) => setNewItem(prev => ({ ...prev, concepto: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Cant."
                          className="w-20"
                          value={newItem.cantidad}
                          onChange={(e) => setNewItem(prev => ({ ...prev, cantidad: e.target.value }))}
                        />
                        <Select
                          value={newItem.unidad}
                          onValueChange={(value) => setNewItem(prev => ({ ...prev, unidad: value }))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ud">ud</SelectItem>
                            <SelectItem value="h">h</SelectItem>
                            <SelectItem value="m²">m²</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="€ unitario"
                          value={newItem.precioUnitario}
                          onChange={(e) => setNewItem(prev => ({ ...prev, precioUnitario: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Button onClick={addItem} size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-1" /> Añadir
                        </Button>
                      </div>
                    </div>

                    {newBudget.items.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Concepto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">P. Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newBudget.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.concepto}</TableCell>
                              <TableCell className="text-right">{item.cantidad} {item.unidad}</TableCell>
                              <TableCell className="text-right">{item.precioUnitario.toFixed(2)} €</TableCell>
                              <TableCell className="text-right font-medium">{item.total.toFixed(2)} €</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Totales */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{subtotal.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="flex items-center gap-2">
                          IVA:
                          <Input
                            type="number"
                            className="w-16 h-6 text-xs"
                            value={newBudget.ivaRate}
                            onChange={(e) => setNewBudget(prev => ({ ...prev, ivaRate: e.target.value }))}
                          />
                          %
                        </span>
                        <span>{ivaAmount.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>{total.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas adicionales</Label>
                    <Textarea
                      id="notas"
                      placeholder="Condiciones, observaciones..."
                      value={newBudget.notas}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, notas: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateBudget}>
                    <FileText className="mr-2 h-4 w-4" />
                    Crear Presupuesto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Presupuestos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.borradores} borradores, {stats.enviados} enviados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.enviados}</div>
              <p className="text-xs text-muted-foreground">Esperando aprobación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.aprobados}</div>
              <p className="text-xs text-muted-foreground">
                {stats.valorAprobado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.valorTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </div>
              <p className="text-xs text-muted-foreground">Todos los presupuestos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o número..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                  <SelectItem value="facturado">Facturado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="reforma">Reforma</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                  <SelectItem value="honorarios">Honorarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Budget List */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Presupuestos</CardTitle>
            <CardDescription>
              {filteredBudgets.length} presupuesto(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBudgets.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay presupuestos</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primer presupuesto para empezar a gestionar cotizaciones
                </p>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Presupuesto
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente/Proveedor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell className="font-mono text-sm">{budget.numero}</TableCell>
                      <TableCell className="font-medium">{budget.titulo}</TableCell>
                      <TableCell>{getTipoBadge(budget.tipo)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {budget.cliente?.nombre || budget.proveedor?.nombre || '-'}
                      </TableCell>
                      <TableCell>{getEstadoBadge(budget.estado)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {budget.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(budget.fechaCreacion), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-900">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-8 w-8 text-orange-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Gestión eficiente de presupuestos</h3>
                  <p className="text-muted-foreground">
                    Crea presupuestos profesionales para mantenimiento, reformas y servicios.
                    Convierte presupuestos aprobados directamente en facturas.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href="/facturacion">Ver Facturación</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/mantenimiento">Ver Mantenimiento</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
