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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  Building2,
  User,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Bell,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface Warranty {
  id: string;
  tipo: 'deposito' | 'aval_bancario' | 'seguro_impago' | 'fianza';
  estado: 'activa' | 'pendiente' | 'vencida' | 'liberada' | 'ejecutada';
  importe: number;
  fechaInicio: string;
  fechaVencimiento: string;
  contratoId: string;
  inquilinoNombre: string;
  propiedadDireccion: string;
  entidadGarante?: string;
  numeroReferencia?: string;
  documentoUrl?: string;
  renovacionAutomatica: boolean;
  notas?: string;
}

export default function WarrantyManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('todas');

  // Estado para nueva garantía
  const [newWarranty, setNewWarranty] = useState({
    tipo: 'deposito' as const,
    importe: 0,
    fechaInicio: '',
    fechaVencimiento: '',
    contratoId: '',
    inquilinoNombre: '',
    propiedadDireccion: '',
    entidadGarante: '',
    numeroReferencia: '',
    renovacionAutomatica: false,
    notas: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadWarranties();
    }
  }, [status]);

  const loadWarranties = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/warranties');
      // const data = await response.json();
      // setWarranties(data.warranties);
      
      // Por ahora solo mostrar estado vacío
      setWarranties([]);
    } catch (error) {
      toast.error('Error al cargar las garantías');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarranty = async () => {
    if (!newWarranty.importe || !newWarranty.fechaInicio || !newWarranty.inquilinoNombre) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    try {
      // TODO: Integrar con API real
      // await fetch('/api/warranties', {
      //   method: 'POST',
      //   body: JSON.stringify(newWarranty),
      // });
      
      toast.success('Garantía creada correctamente');
      setShowCreateDialog(false);
      loadWarranties();
    } catch (error) {
      toast.error('Error al crear la garantía');
    }
  };

  const getStatusBadge = (estado: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      activa: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pendiente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      vencida: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      liberada: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      ejecutada: { color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
    };
    const { color, icon: Icon } = config[estado] || config.pendiente;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, string> = {
      deposito: 'bg-blue-100 text-blue-800',
      aval_bancario: 'bg-purple-100 text-purple-800',
      seguro_impago: 'bg-green-100 text-green-800',
      fianza: 'bg-orange-100 text-orange-800',
    };
    const labels: Record<string, string> = {
      deposito: 'Depósito',
      aval_bancario: 'Aval Bancario',
      seguro_impago: 'Seguro Impago',
      fianza: 'Fianza',
    };
    return <Badge className={config[tipo]}>{labels[tipo]}</Badge>;
  };

  const filteredWarranties = warranties.filter((w) => {
    const matchesSearch =
      w.inquilinoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.propiedadDireccion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || w.tipo === tipoFilter;
    const matchesEstado = estadoFilter === 'todos' || w.estado === estadoFilter;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Estadísticas
  const stats = {
    total: warranties.length,
    activas: warranties.filter((w) => w.estado === 'activa').length,
    porVencer: warranties.filter((w) => {
      const diasRestantes = differenceInDays(new Date(w.fechaVencimiento), new Date());
      return diasRestantes <= 30 && diasRestantes > 0 && w.estado === 'activa';
    }).length,
    importeTotal: warranties
      .filter((w) => w.estado === 'activa')
      .reduce((sum, w) => sum + w.importe, 0),
  };

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-indigo-600" />
              Gestión de Garantías
            </h1>
            <p className="text-gray-600 mt-1">
              Administra depósitos, avales y seguros de tus contratos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadWarranties}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Garantía
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Garantía</DialogTitle>
                  <DialogDescription>
                    Complete los datos de la garantía o aval
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Garantía *</Label>
                      <Select
                        value={newWarranty.tipo}
                        onValueChange={(value: any) =>
                          setNewWarranty({ ...newWarranty, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposito">Depósito</SelectItem>
                          <SelectItem value="aval_bancario">Aval Bancario</SelectItem>
                          <SelectItem value="seguro_impago">Seguro de Impago</SelectItem>
                          <SelectItem value="fianza">Fianza</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Importe (€) *</Label>
                      <Input
                        type="number"
                        value={newWarranty.importe}
                        onChange={(e) =>
                          setNewWarranty({ ...newWarranty, importe: parseFloat(e.target.value) })
                        }
                        placeholder="1200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Inicio *</Label>
                      <Input
                        type="date"
                        value={newWarranty.fechaInicio}
                        onChange={(e) =>
                          setNewWarranty({ ...newWarranty, fechaInicio: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Vencimiento</Label>
                      <Input
                        type="date"
                        value={newWarranty.fechaVencimiento}
                        onChange={(e) =>
                          setNewWarranty({ ...newWarranty, fechaVencimiento: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Inquilino *</Label>
                      <Input
                        value={newWarranty.inquilinoNombre}
                        onChange={(e) =>
                          setNewWarranty({ ...newWarranty, inquilinoNombre: e.target.value })
                        }
                        placeholder="Nombre del inquilino"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Propiedad</Label>
                      <Input
                        value={newWarranty.propiedadDireccion}
                        onChange={(e) =>
                          setNewWarranty({ ...newWarranty, propiedadDireccion: e.target.value })
                        }
                        placeholder="Dirección de la propiedad"
                      />
                    </div>
                  </div>
                  {(newWarranty.tipo === 'aval_bancario' || newWarranty.tipo === 'seguro_impago') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Entidad Garante</Label>
                        <Input
                          value={newWarranty.entidadGarante}
                          onChange={(e) =>
                            setNewWarranty({ ...newWarranty, entidadGarante: e.target.value })
                          }
                          placeholder="Nombre del banco o aseguradora"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nº Referencia</Label>
                        <Input
                          value={newWarranty.numeroReferencia}
                          onChange={(e) =>
                            setNewWarranty({ ...newWarranty, numeroReferencia: e.target.value })
                          }
                          placeholder="Número de póliza o aval"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Input
                      value={newWarranty.notas}
                      onChange={(e) =>
                        setNewWarranty({ ...newWarranty, notas: e.target.value })
                      }
                      placeholder="Observaciones adicionales"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateWarranty}>Guardar Garantía</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Garantías</div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Activas</div>
                  <div className="text-2xl font-bold text-green-600">{stats.activas}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Por Vencer (30d)</div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.porVencer}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Euro className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Importe Total</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.importeTotal.toLocaleString('es-ES')}€
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por inquilino o propiedad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                  <SelectItem value="deposito">Depósito</SelectItem>
                  <SelectItem value="aval_bancario">Aval Bancario</SelectItem>
                  <SelectItem value="seguro_impago">Seguro Impago</SelectItem>
                  <SelectItem value="fianza">Fianza</SelectItem>
                </SelectContent>
              </Select>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                  <SelectItem value="liberada">Liberada</SelectItem>
                  <SelectItem value="ejecutada">Ejecutada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Garantías */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Garantías</CardTitle>
            <CardDescription>
              {filteredWarranties.length} garantías encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredWarranties.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay garantías registradas
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza registrando tu primera garantía o aval
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primera Garantía
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarranties.map((warranty) => {
                    const diasRestantes = differenceInDays(
                      new Date(warranty.fechaVencimiento),
                      new Date()
                    );
                    return (
                      <TableRow key={warranty.id}>
                        <TableCell>{getTipoBadge(warranty.tipo)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {warranty.inquilinoNombre}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="truncate max-w-[200px]">
                              {warranty.propiedadDireccion}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {warranty.importe.toLocaleString('es-ES')}€
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span
                              className={
                                diasRestantes <= 30 && diasRestantes > 0
                                  ? 'text-yellow-600 font-medium'
                                  : diasRestantes <= 0
                                  ? 'text-red-600 font-medium'
                                  : ''
                              }
                            >
                              {format(new Date(warranty.fechaVencimiento), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(warranty.estado)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar documento
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Alertas de Vencimiento */}
        {stats.porVencer > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas de Vencimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {warranties
                  .filter((w) => {
                    const dias = differenceInDays(new Date(w.fechaVencimiento), new Date());
                    return dias <= 30 && dias > 0 && w.estado === 'activa';
                  })
                  .map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium">{w.inquilinoNombre}</p>
                          <p className="text-sm text-gray-600">
                            {getTipoBadge(w.tipo)} - {w.propiedadDireccion}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-yellow-600">
                          Vence en{' '}
                          {differenceInDays(new Date(w.fechaVencimiento), new Date())} días
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(w.fechaVencimiento), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
