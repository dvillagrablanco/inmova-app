'use client';

/**
 * Gestión de Garantías - Inmova App
 * 
 * Sistema integral de gestión de garantías y avales inmobiliarios:
 * - Registro y seguimiento de garantías
 * - Gestión de avales bancarios
 * - Alertas de vencimiento
 * - Renovaciones automáticas
 * - Documentación digitalizada
 * - Reportes de garantías activas
 */

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTrigger,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Shield,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Euro,
  Building2,
  User,
  FileText,
  Bell,
  TrendingUp,
  Banknote,
  CreditCard,
  FileCheck,
  History,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Send,
} from 'lucide-react';
import { format, parseISO, differenceInDays, addMonths, addYears, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface Garantia {
  id: string;
  tipo: 'fianza' | 'aval_bancario' | 'seguro_impago' | 'deposito' | 'garantia_personal';
  inquilinoId: string;
  inquilinoNombre: string;
  propiedadId: string;
  propiedadNombre: string;
  contratoId: string;
  monto: number;
  montoMensualidades: number;
  fechaConstitucion: string;
  fechaVencimiento: string | null;
  estado: 'activa' | 'vencida' | 'liberada' | 'ejecutada' | 'renovada' | 'pendiente';
  entidadEmisora?: string;
  numeroReferencia?: string;
  documentoUrl?: string;
  observaciones?: string;
  renovacionAutomatica: boolean;
  alertasActivas: boolean;
  historial: HistorialGarantia[];
  createdAt: string;
  updatedAt: string;
}

interface HistorialGarantia {
  id: string;
  fecha: string;
  accion: string;
  descripcion: string;
  usuario: string;
  montoAnterior?: number;
  montoNuevo?: number;
}

interface GarantiaStats {
  totalGarantias: number;
  garantiasActivas: number;
  garantiasVencidas: number;
  garantiasPendientes: number;
  montoTotalGarantizado: number;
  proximasAVencer: number;
  porTipo: { tipo: string; cantidad: number; monto: number }[];
}

// Constants
const TIPOS_GARANTIA = [
  { value: 'fianza', label: 'Fianza', icon: Euro, color: 'bg-blue-100 text-blue-700' },
  { value: 'aval_bancario', label: 'Aval Bancario', icon: Banknote, color: 'bg-green-100 text-green-700' },
  { value: 'seguro_impago', label: 'Seguro de Impago', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  { value: 'deposito', label: 'Depósito', icon: CreditCard, color: 'bg-orange-100 text-orange-700' },
  { value: 'garantia_personal', label: 'Garantía Personal', icon: User, color: 'bg-pink-100 text-pink-700' },
];

const ESTADOS_GARANTIA = {
  activa: { label: 'Activa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  vencida: { label: 'Vencida', color: 'bg-red-100 text-red-800', icon: XCircle },
  liberada: { label: 'Liberada', color: 'bg-blue-100 text-blue-800', icon: FileCheck },
  ejecutada: { label: 'Ejecutada', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  renovada: { label: 'Renovada', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
};

// Los datos se cargan desde la API /api/garantias

export default function WarrantyManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todas');
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [stats, setStats] = useState<GarantiaStats | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGarantia, setSelectedGarantia] = useState<Garantia | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    tipo: 'fianza',
    inquilinoId: '',
    propiedadId: '',
    contratoId: '',
    monto: '',
    montoMensualidades: '2',
    fechaConstitucion: format(new Date(), 'yyyy-MM-dd'),
    fechaVencimiento: '',
    entidadEmisora: '',
    numeroReferencia: '',
    observaciones: '',
    renovacionAutomatica: false,
    alertasActivas: true,
  });

  // Load data
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
      const response = await fetch('/api/garantias');
      if (response.ok) {
        const data = await response.json();
        // Transformar datos de API al formato esperado
        const garantiasFromAPI: Garantia[] = (data.garantias || []).map((g: any) => ({
          ...g,
          historial: g.historial || [{
            id: `h-${g.id}`,
            fecha: g.fechaConstitucion,
            accion: 'Constitución',
            descripcion: 'Garantía registrada desde contrato',
            usuario: 'Sistema',
          }],
        }));
        setGarantias(garantiasFromAPI);
        setStats(data.stats || null);
      } else {
        console.error('Error loading garantias');
        toast.error('Error al cargar las garantías');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar las garantías');
    } finally {
      setLoading(false);
    }
  };

  // Filtered garantias
  const garantiasFiltradas = useMemo(() => {
    return garantias.filter(g => {
      // Filter by tab
      if (activeTab === 'activas' && g.estado !== 'activa') return false;
      if (activeTab === 'vencidas' && g.estado !== 'vencida') return false;
      if (activeTab === 'pendientes' && g.estado !== 'pendiente') return false;
      if (activeTab === 'alertas') {
        const diasParaVencer = g.fechaVencimiento 
          ? differenceInDays(parseISO(g.fechaVencimiento), new Date())
          : null;
        if (diasParaVencer === null || diasParaVencer > 60) return false;
      }
      
      // Filter by tipo
      if (filterTipo !== 'all' && g.tipo !== filterTipo) return false;
      
      // Filter by estado
      if (filterEstado !== 'all' && g.estado !== filterEstado) return false;
      
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          g.inquilinoNombre.toLowerCase().includes(term) ||
          g.propiedadNombre.toLowerCase().includes(term) ||
          g.numeroReferencia?.toLowerCase().includes(term) ||
          g.entidadEmisora?.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  }, [garantias, activeTab, filterTipo, filterEstado, searchTerm]);

  // Handlers
  const handleCreateGarantia = async () => {
    if (!formData.monto || !formData.tipo) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      
      // Mock: crear garantía
      const nuevaGarantia: Garantia = {
        id: `g${Date.now()}`,
        tipo: formData.tipo as Garantia['tipo'],
        inquilinoId: formData.inquilinoId || 'temp',
        inquilinoNombre: 'Nuevo Inquilino',
        propiedadId: formData.propiedadId || 'temp',
        propiedadNombre: 'Nueva Propiedad',
        contratoId: formData.contratoId || 'temp',
        monto: parseFloat(formData.monto),
        montoMensualidades: parseInt(formData.montoMensualidades),
        fechaConstitucion: formData.fechaConstitucion,
        fechaVencimiento: formData.fechaVencimiento || null,
        estado: 'pendiente',
        entidadEmisora: formData.entidadEmisora,
        numeroReferencia: formData.numeroReferencia,
        observaciones: formData.observaciones,
        renovacionAutomatica: formData.renovacionAutomatica,
        alertasActivas: formData.alertasActivas,
        historial: [{
          id: `h${Date.now()}`,
          fecha: new Date().toISOString(),
          accion: 'Creación',
          descripcion: 'Garantía registrada en el sistema',
          usuario: session?.user?.name || 'Usuario',
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setGarantias(prev => [nuevaGarantia, ...prev]);
      toast.success('Garantía creada correctamente');
      setCreateDialogOpen(false);
      resetForm();
      
    } catch (error) {
      toast.error('Error al crear la garantía');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLiberarGarantia = async (garantiaId: string) => {
    try {
      setGarantias(prev => prev.map(g => {
        if (g.id === garantiaId) {
          return {
            ...g,
            estado: 'liberada' as const,
            alertasActivas: false,
            updatedAt: new Date().toISOString(),
            historial: [...g.historial, {
              id: `h${Date.now()}`,
              fecha: new Date().toISOString(),
              accion: 'Liberación',
              descripcion: 'Garantía liberada y devuelta',
              usuario: session?.user?.name || 'Usuario',
            }],
          };
        }
        return g;
      }));
      toast.success('Garantía liberada correctamente');
    } catch (error) {
      toast.error('Error al liberar la garantía');
    }
  };

  const handleRenovarGarantia = async (garantiaId: string) => {
    try {
      setGarantias(prev => prev.map(g => {
        if (g.id === garantiaId) {
          const nuevaFechaVencimiento = g.fechaVencimiento 
            ? format(addYears(parseISO(g.fechaVencimiento), 1), 'yyyy-MM-dd')
            : format(addYears(new Date(), 1), 'yyyy-MM-dd');
          
          return {
            ...g,
            estado: 'activa' as const,
            fechaVencimiento: nuevaFechaVencimiento,
            updatedAt: new Date().toISOString(),
            historial: [...g.historial, {
              id: `h${Date.now()}`,
              fecha: new Date().toISOString(),
              accion: 'Renovación',
              descripcion: `Garantía renovada hasta ${format(parseISO(nuevaFechaVencimiento), "d 'de' MMMM 'de' yyyy", { locale: es })}`,
              usuario: session?.user?.name || 'Usuario',
            }],
          };
        }
        return g;
      }));
      toast.success('Garantía renovada correctamente');
    } catch (error) {
      toast.error('Error al renovar la garantía');
    }
  };

  const handleDeleteGarantia = async () => {
    if (!selectedGarantia) return;
    
    try {
      setGarantias(prev => prev.filter(g => g.id !== selectedGarantia.id));
      toast.success('Garantía eliminada');
      setDeleteDialogOpen(false);
      setSelectedGarantia(null);
    } catch (error) {
      toast.error('Error al eliminar la garantía');
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'fianza',
      inquilinoId: '',
      propiedadId: '',
      contratoId: '',
      monto: '',
      montoMensualidades: '2',
      fechaConstitucion: format(new Date(), 'yyyy-MM-dd'),
      fechaVencimiento: '',
      entidadEmisora: '',
      numeroReferencia: '',
      observaciones: '',
      renovacionAutomatica: false,
      alertasActivas: true,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getDiasParaVencer = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null;
    return differenceInDays(parseISO(fechaVencimiento), new Date());
  };

  const getVencimientoBadge = (fechaVencimiento: string | null) => {
    const dias = getDiasParaVencer(fechaVencimiento);
    if (dias === null) return null;
    
    if (dias < 0) {
      return <Badge className="bg-red-100 text-red-800">Vencida hace {Math.abs(dias)} días</Badge>;
    }
    if (dias <= 30) {
      return <Badge className="bg-orange-100 text-orange-800">Vence en {dias} días</Badge>;
    }
    if (dias <= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">Vence en {dias} días</Badge>;
    }
    return null;
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
            <Shield className="h-8 w-8 text-primary" />
            Gestión de Garantías
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra fianzas, avales y seguros de impago de tu cartera
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Garantía
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Registrar Nueva Garantía
                </DialogTitle>
                <DialogDescription>
                  Completa los datos de la garantía a registrar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Tipo */}
                <div className="space-y-2">
                  <Label>Tipo de Garantía *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_GARANTIA.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center gap-2">
                            <tipo.icon className="h-4 w-4" />
                            {tipo.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Monto */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monto (€) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensualidades</Label>
                    <Select
                      value={formData.montoMensualidades}
                      onValueChange={(value) => setFormData({ ...formData, montoMensualidades: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 mes</SelectItem>
                        <SelectItem value="2">2 meses</SelectItem>
                        <SelectItem value="3">3 meses</SelectItem>
                        <SelectItem value="6">6 meses</SelectItem>
                        <SelectItem value="12">12 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Constitución *</Label>
                    <Input
                      type="date"
                      value={formData.fechaConstitucion}
                      onChange={(e) => setFormData({ ...formData, fechaConstitucion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Vencimiento</Label>
                    <Input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    />
                  </div>
                </div>

                {/* Entidad y Referencia */}
                <div className="space-y-2">
                  <Label>Entidad Emisora</Label>
                  <Input
                    placeholder="Ej: Banco Santander, ARAG Seguros..."
                    value={formData.entidadEmisora}
                    onChange={(e) => setFormData({ ...formData, entidadEmisora: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número de Referencia</Label>
                  <Input
                    placeholder="Ej: AVL-2024-123456"
                    value={formData.numeroReferencia}
                    onChange={(e) => setFormData({ ...formData, numeroReferencia: e.target.value })}
                  />
                </div>

                {/* Observaciones */}
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    placeholder="Notas adicionales..."
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="renovacion"
                      checked={formData.renovacionAutomatica}
                      onCheckedChange={(checked) => setFormData({ ...formData, renovacionAutomatica: checked as boolean })}
                    />
                    <Label htmlFor="renovacion" className="text-sm font-normal">
                      Renovación automática al vencimiento
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="alertas"
                      checked={formData.alertasActivas}
                      onCheckedChange={(checked) => setFormData({ ...formData, alertasActivas: checked as boolean })}
                    />
                    <Label htmlFor="alertas" className="text-sm font-normal">
                      Activar alertas de vencimiento
                    </Label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateGarantia} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Crear Garantía
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Garantías Activas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.garantiasActivas}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {stats.totalGarantias} totales
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monto Total Garantizado</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.montoTotalGarantizado)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Euro className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Próximas a Vencer</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.proximasAVencer}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    en los próximos 60 días
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.garantiasPendientes}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    requieren atención
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="activas">Activas</TabsTrigger>
            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
            <TabsTrigger value="alertas">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="vencidas">Vencidas</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar garantías..."
                className="pl-9 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {TIPOS_GARANTIA.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {garantiasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No se encontraron garantías</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Inquilino / Propiedad</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {garantiasFiltradas.map((garantia) => {
                    const tipoInfo = TIPOS_GARANTIA.find(t => t.value === garantia.tipo);
                    const estadoInfo = ESTADOS_GARANTIA[garantia.estado];
                    const EstadoIcon = estadoInfo.icon;
                    const TipoIcon = tipoInfo?.icon || Shield;
                    
                    return (
                      <TableRow key={garantia.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn("p-2 rounded-lg", tipoInfo?.color)}>
                              <TipoIcon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{tipoInfo?.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{garantia.inquilinoNombre}</p>
                            <p className="text-xs text-muted-foreground">{garantia.propiedadNombre}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{formatCurrency(garantia.monto)}</p>
                            <p className="text-xs text-muted-foreground">{garantia.montoMensualidades} mensualidades</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {garantia.entidadEmisora ? (
                            <div>
                              <p className="text-sm">{garantia.entidadEmisora}</p>
                              {garantia.numeroReferencia && (
                                <p className="text-xs text-muted-foreground">{garantia.numeroReferencia}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {garantia.fechaVencimiento ? (
                            <div>
                              <p className="text-sm">
                                {format(parseISO(garantia.fechaVencimiento), "d MMM yyyy", { locale: es })}
                              </p>
                              {getVencimientoBadge(garantia.fechaVencimiento)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin vencimiento</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={estadoInfo.color}>
                            <EstadoIcon className="h-3 w-3 mr-1" />
                            {estadoInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedGarantia(garantia);
                                setDetailDialogOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              {garantia.documentoUrl && (
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar Documento
                                </DropdownMenuItem>
                              )}
                              {garantia.estado === 'activa' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleRenovarGarantia(garantia.id)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Renovar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleLiberarGarantia(garantia.id)}>
                                    <FileCheck className="h-4 w-4 mr-2" />
                                    Liberar
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedGarantia(garantia);
                                  setDeleteDialogOpen(true);
                                }}
                              >
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
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Garantía</DialogTitle>
          </DialogHeader>
          {selectedGarantia && (
            <div className="space-y-6">
              {/* Info Principal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{TIPOS_GARANTIA.find(t => t.value === selectedGarantia.tipo)?.label}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge className={ESTADOS_GARANTIA[selectedGarantia.estado].color}>
                    {ESTADOS_GARANTIA[selectedGarantia.estado].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Inquilino</Label>
                  <p className="font-medium">{selectedGarantia.inquilinoNombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Propiedad</Label>
                  <p className="font-medium">{selectedGarantia.propiedadNombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Monto</Label>
                  <p className="font-medium text-lg">{formatCurrency(selectedGarantia.monto)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mensualidades</Label>
                  <p className="font-medium">{selectedGarantia.montoMensualidades}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha Constitución</Label>
                  <p className="font-medium">
                    {format(parseISO(selectedGarantia.fechaConstitucion), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha Vencimiento</Label>
                  <p className="font-medium">
                    {selectedGarantia.fechaVencimiento
                      ? format(parseISO(selectedGarantia.fechaVencimiento), "d 'de' MMMM 'de' yyyy", { locale: es })
                      : 'Sin vencimiento'}
                  </p>
                </div>
                {selectedGarantia.entidadEmisora && (
                  <div>
                    <Label className="text-muted-foreground">Entidad Emisora</Label>
                    <p className="font-medium">{selectedGarantia.entidadEmisora}</p>
                  </div>
                )}
                {selectedGarantia.numeroReferencia && (
                  <div>
                    <Label className="text-muted-foreground">Nº Referencia</Label>
                    <p className="font-medium">{selectedGarantia.numeroReferencia}</p>
                  </div>
                )}
              </div>

              {selectedGarantia.observaciones && (
                <div>
                  <Label className="text-muted-foreground">Observaciones</Label>
                  <p className="text-sm mt-1">{selectedGarantia.observaciones}</p>
                </div>
              )}

              {/* Opciones */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  {selectedGarantia.renovacionAutomatica ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">Renovación automática</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedGarantia.alertasActivas ? (
                    <Bell className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Bell className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">Alertas activas</span>
                </div>
              </div>

              <Separator />

              {/* Historial */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historial
                </h4>
                <div className="space-y-3">
                  {selectedGarantia.historial.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{item.accion}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(item.fecha), "d MMM yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-1">Por: {item.usuario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar garantía?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro
              de esta garantía del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGarantia}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
