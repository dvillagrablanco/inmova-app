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
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Shield,
  FileCheck,
  AlertTriangle,
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  User,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

interface Warranty {
  id: string;
  contractId?: string;
  tenantId?: string;
  tenantName?: string;
  unitId?: string;
  unitName?: string;
  tipo: string;
  monto: number;
  fechaInicio: string;
  fechaVencimiento?: string;
  entidadGarante?: string;
  numeroReferencia?: string;
  documentoUrl?: string;
  estado: string;
  notas?: string;
}

interface Stats {
  total: number;
  activas: number;
  liberadas: number;
  montoTotal: number;
  porVencer: number;
}

const TIPOS_GARANTIA = [
  { value: 'deposito', label: 'Depósito en efectivo', icon: DollarSign },
  { value: 'aval_bancario', label: 'Aval bancario', icon: Building },
  { value: 'seguro_caucion', label: 'Seguro de caución', icon: Shield },
  { value: 'garantia_personal', label: 'Garantía personal', icon: User },
  { value: 'otro', label: 'Otro tipo', icon: FileText },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function WarrantyManagementPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('todas');

  // Form state
  const [newWarranty, setNewWarranty] = useState({
    tipo: 'deposito',
    monto: 0,
    fechaInicio: '',
    fechaVencimiento: '',
    entidadGarante: '',
    numeroReferencia: '',
    notas: '',
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadWarranties();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadWarranties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTipo !== 'all') params.append('tipo', filterTipo);
      if (filterEstado !== 'all') params.append('estado', filterEstado);

      const response = await fetch(`/api/warranties?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setWarranties(data.data || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading warranties:', error);
      toast.error('Error al cargar garantías');
    } finally {
      setLoading(false);
    }
  };

  // Crear garantía
  const handleCreate = async () => {
    if (!newWarranty.monto || !newWarranty.fechaInicio) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/warranties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWarranty),
      });

      if (response.ok) {
        toast.success('Garantía registrada');
        setShowNewDialog(false);
        resetForm();
        loadWarranties();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al registrar garantía');
      }
    } catch (error) {
      console.error('Error creating warranty:', error);
      toast.error('Error al registrar garantía');
    }
  };

  const resetForm = () => {
    setNewWarranty({
      tipo: 'deposito',
      monto: 0,
      fechaInicio: '',
      fechaVencimiento: '',
      entidadGarante: '',
      numeroReferencia: '',
      notas: '',
    });
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-700';
      case 'liberada': return 'bg-blue-100 text-blue-700';
      case 'ejecutada': return 'bg-red-100 text-red-700';
      case 'vencida': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filtrar garantías
  const filteredWarranties = warranties.filter(w => {
    const matchesSearch = 
      w.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.unitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.numeroReferencia?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'todas' || w.estado === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Calcular días restantes
  const getDiasRestantes = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return null;
    const dias = differenceInDays(new Date(fechaVencimiento), new Date());
    return dias;
  };

  // Loading
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Garantías</h1>
              <p className="text-muted-foreground">
                Control de depósitos, avales y garantías
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Garantía
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <FileCheck className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.activas || 0}</p>
                  <p className="text-xs text-muted-foreground">Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.liberadas || 0}</p>
                  <p className="text-xs text-muted-foreground">Liberadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.porVencer || 0}</p>
                  <p className="text-xs text-muted-foreground">Por vencer (30d)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">€{(stats?.montoTotal || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Importe total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por inquilino, unidad o referencia..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {TIPOS_GARANTIA.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadWarranties}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todas">Todas ({warranties.length})</TabsTrigger>
            <TabsTrigger value="activa">Activas ({warranties.filter(w => w.estado === 'activa').length})</TabsTrigger>
            <TabsTrigger value="liberada">Liberadas ({warranties.filter(w => w.estado === 'liberada').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {filteredWarranties.length === 0 ? (
                  <div className="py-16 text-center">
                    <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No hay garantías</h3>
                    <p className="text-muted-foreground">Registra tu primera garantía</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inquilino / Unidad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Importe</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWarranties.map(warranty => {
                        const diasRestantes = getDiasRestantes(warranty.fechaVencimiento);
                        return (
                          <TableRow key={warranty.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{warranty.tenantName || 'Sin asignar'}</p>
                                <p className="text-xs text-muted-foreground">{warranty.unitName || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {warranty.tipo.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold">€{warranty.monto.toLocaleString()}</TableCell>
                            <TableCell>
                              {format(new Date(warranty.fechaInicio), "dd MMM yyyy", { locale: es })}
                            </TableCell>
                            <TableCell>
                              {warranty.fechaVencimiento ? (
                                <div>
                                  <p>{format(new Date(warranty.fechaVencimiento), "dd MMM yyyy", { locale: es })}</p>
                                  {diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 30 && (
                                    <p className="text-xs text-amber-600">
                                      {diasRestantes} días restantes
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Indefinido</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getEstadoColor(warranty.estado)}>
                                {warranty.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {warranty.documentoUrl && (
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Nueva Garantía */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Garantía</DialogTitle>
            <DialogDescription>Registra una nueva garantía o depósito</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Garantía *</Label>
              <Select
                value={newWarranty.tipo}
                onValueChange={v => setNewWarranty(prev => ({ ...prev, tipo: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_GARANTIA.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Importe (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={newWarranty.monto}
                  onChange={e => setNewWarranty(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Inicio *</Label>
                <Input
                  type="date"
                  value={newWarranty.fechaInicio}
                  onChange={e => setNewWarranty(prev => ({ ...prev, fechaInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input
                  type="date"
                  value={newWarranty.fechaVencimiento}
                  onChange={e => setNewWarranty(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nº Referencia</Label>
                <Input
                  placeholder="REF-2024-001"
                  value={newWarranty.numeroReferencia}
                  onChange={e => setNewWarranty(prev => ({ ...prev, numeroReferencia: e.target.value }))}
                />
              </div>
            </div>
            {(newWarranty.tipo === 'aval_bancario' || newWarranty.tipo === 'seguro_caucion') && (
              <div className="space-y-2">
                <Label>Entidad Garante</Label>
                <Input
                  placeholder="Nombre del banco o aseguradora"
                  value={newWarranty.entidadGarante}
                  onChange={e => setNewWarranty(prev => ({ ...prev, entidadGarante: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Registrar Garantía</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
