'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  Plus,
  AlertTriangle,
  FileText,
  Calendar,
  Euro,
  Building2,
  TrendingUp,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Home,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, addDays, differenceInDays, isPast, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Insurance {
  id: string;
  tipo: string;
  poliza?: string;
  aseguradora: string;
  fechaInicio: string;
  fechaVencimiento: string;
  prima?: number;
  primaAnual?: number;
  primaMensual?: number;
  sumaAsegurada?: number;
  cobertura?: number | string;
  estado: string;
  numeroPoliza?: string;
  building?: {
    nombre: string;
    direccion: string;
  };
  unit?: {
    numero: string;
  };
  _count?: {
    claims: number;
  };
  diasHastaVencimiento?: number;
}

interface InsuranceStats {
  total: number;
  activos: number;
  porVencer: number;
  vencidos: number;
  siniestros: number;
  totalPrimas: number;
  totalCobertura: number;
}

const tiposSeguro = [
  { value: 'hogar', label: 'Hogar', icon: Shield },
  { value: 'comunidad', label: 'Comunidad/Edificio', icon: Building2 },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil', icon: Shield },
  { value: 'impago_alquiler', label: 'Impago de Alquiler', icon: Euro },
  { value: 'incendio', label: 'Incendio', icon: AlertTriangle },
  { value: 'robo', label: 'Robo', icon: Shield },
  { value: 'vida', label: 'Vida', icon: Shield },
  { value: 'otro', label: 'Otro', icon: FileText },
];

const aseguradoras = [
  'Mapfre',
  'AXA',
  'Segurcaixa',
  'Mutua Madrileña',
  'Sanitas',
  'Allianz',
  'Generali',
  'Zurich',
  'Catalana Occidente',
  'Reale',
  'Línea Directa',
  'Liberty',
  'Otro',
];

export default function SegurosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const { data: session, status } = useSession();
  const [seguros, setSeguros] = useState<Insurance[]>([]);
  const [filteredSeguros, setFilteredSeguros] = useState<Insurance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<InsuranceStats>({
    total: 0,
    activos: 0,
    porVencer: 0,
    vencidos: 0,
    siniestros: 0,
    totalPrimas: 0,
    totalCobertura: 0,
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    failed: number;
  } | null>(null);
  const [externalDocs, setExternalDocs] = useState<any[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [aseguradoraFilter, setAseguradoraFilter] = useState<string>('all');

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [seguroToDelete, setSeguroToDelete] = useState<Insurance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSeguros();
      loadExternalInsuranceDocs();
    }
  }, [status]);

  const loadExternalInsuranceDocs = async () => {
    try {
      const query = companyId ? `?companyId=${companyId}&tipo=seguro` : '?tipo=seguro';
      const res = await fetch(`/api/documents${query}`);
      if (res.ok) {
        const data = await res.json();
        const external = (Array.isArray(data) ? data : []).filter(
          (doc: any) =>
            doc.cloudStoragePath?.startsWith('https://') &&
            (doc.tags?.includes('seguros') || doc.tipo === 'seguro')
        );
        setExternalDocs(external);
      }
    } catch (error) {
      console.error('Error cargando docs externos seguros:', error);
    }
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, tipoFilter, estadoFilter, aseguradoraFilter, seguros]);

  const dashboardHref = pathname?.startsWith('/admin') ? '/admin/dashboard' : '/dashboard';
  const normalizeStatus = (estado?: string) => (estado || '').toLowerCase();

  const getPrimaValue = (seguro: Insurance) =>
    Number(seguro.primaAnual ?? seguro.primaMensual ?? seguro.prima ?? 0);

  const getCoberturaValue = (seguro: Insurance) => {
    if (typeof seguro.sumaAsegurada === 'number') return seguro.sumaAsegurada;
    if (typeof seguro.cobertura === 'number') return seguro.cobertura;
    const parsed = Number(
      String(seguro.cobertura || '')
        .replace(/[€$]/g, '')
        .replace(',', '.')
    );
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const fetchSeguros = async () => {
    try {
      setIsLoading(true);
      const query = companyId ? `?companyId=${companyId}` : '';
      const response = await fetch(`/api/seguros${query}`);
      if (!response.ok) throw new Error('Error al obtener seguros');

      const data = await response.json();

      // Calcular días hasta vencimiento
      const segurosConDias = data.map((seguro: Insurance) => {
        const diasHastaVencimiento = differenceInDays(
          new Date(seguro.fechaVencimiento),
          new Date()
        );
        return { ...seguro, diasHastaVencimiento };
      });

      setSeguros(segurosConDias);

      // Calcular stats
      const totalActivos = segurosConDias.filter((s: Insurance) => {
        const status = normalizeStatus(s.estado);
        return status === 'activa' || status === 'activo';
      }).length;
      const totalPorVencer = segurosConDias.filter(
        (s: Insurance) => s.diasHastaVencimiento! > 0 && s.diasHastaVencimiento! <= 30
      ).length;
      const totalVencidos = segurosConDias.filter(
        (s: Insurance) => s.diasHastaVencimiento! <= 0
      ).length;
      const totalPrimas = segurosConDias.reduce(
        (sum: number, s: Insurance) => sum + getPrimaValue(s),
        0
      );
      const totalCobertura = segurosConDias.reduce(
        (sum: number, s: Insurance) => sum + getCoberturaValue(s),
        0
      );
      const totalSiniestros = segurosConDias.reduce(
        (sum: number, s: Insurance) => sum + (s._count?.claims || 0),
        0
      );

      setStats({
        total: segurosConDias.length,
        activos: totalActivos,
        porVencer: totalPorVencer,
        vencidos: totalVencidos,
        siniestros: totalSiniestros,
        totalPrimas,
        totalCobertura,
      });
    } catch (error) {
      console.error('Error fetching seguros:', error);
      toast.error('Error al cargar seguros');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...seguros];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.poliza?.toLowerCase().includes(term) ||
          s.aseguradora?.toLowerCase().includes(term) ||
          s.numeroPoliza?.toLowerCase().includes(term) ||
          s.building?.nombre?.toLowerCase().includes(term)
      );
    }

    // Tipo
    if (tipoFilter && tipoFilter !== 'all') {
      filtered = filtered.filter((s) => s.tipo?.toLowerCase() === tipoFilter);
    }

    // Estado
    if (estadoFilter && estadoFilter !== 'all') {
      filtered = filtered.filter(
        (s) => normalizeStatus(s.estado) === normalizeStatus(estadoFilter)
      );
    }

    // Aseguradora
    if (aseguradoraFilter && aseguradoraFilter !== 'all') {
      filtered = filtered.filter((s) => s.aseguradora === aseguradoraFilter);
    }

    setFilteredSeguros(filtered);
  };

  const handleImportSeguros = async () => {
    if (!importFile) {
      toast.error('Selecciona un archivo ZIP, XLSX o CSV');
      return;
    }

    try {
      setImporting(true);
      setImportSummary(null);

      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/seguros/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Error al importar seguros');
      }

      setImportSummary({ imported: data.imported || 0, failed: data.failed || 0 });
      toast.success(`Importados ${data.imported || 0} seguros`);
      await fetchSeguros();
    } catch (error: any) {
      console.error('Error importando seguros:', error);
      toast.error(error?.message || 'Error al importar seguros');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!seguroToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/seguros/${seguroToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      toast.success('Seguro eliminado correctamente');
      setSeguros((prev) => prev.filter((s) => s.id !== seguroToDelete.id));
      setDeleteDialogOpen(false);
      setSeguroToDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar seguro');
    } finally {
      setIsDeleting(false);
    }
  };

  const getEstadoBadge = (seguro: Insurance) => {
    if (seguro.diasHastaVencimiento! <= 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Vencido
        </Badge>
      );
    }
    if (seguro.diasHastaVencimiento! <= 30) {
      return (
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Por Vencer
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Activo
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const tipoNormalizado = tipo?.toLowerCase();
    const tipoInfo = tiposSeguro.find((t) => t.value === tipoNormalizado);
    return (
      <Badge variant="outline" className="gap-1">
        {tipoInfo?.icon && <tipoInfo.icon className="h-3 w-3" />}
        {tipoInfo?.label || tipo}
      </Badge>
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={dashboardHref}>
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Seguros</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Seguros</h1>
                <p className="text-sm text-muted-foreground">Gestión de pólizas y siniestros</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchSeguros()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={() => router.push('/seguros/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Seguro
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Importar seguros</CardTitle>
            <CardDescription>
              Sube un ZIP, XLSX o CSV con columnas de póliza, fechas, aseguradora y edificio/unidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Archivo</label>
                <input
                  type="file"
                  accept=".zip,.xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="border rounded-md px-3 py-2 w-full"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Incluye columnas como <strong>numero_poliza</strong>, <strong>aseguradora</strong>,
                <strong> fecha_inicio</strong>, <strong>fecha_vencimiento</strong>,{' '}
                <strong>edificio</strong> y <strong>unidad</strong>.
              </div>
              <div className="flex items-end">
                <Button onClick={handleImportSeguros} disabled={importing}>
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            </div>
            {importSummary && (
              <div className="text-sm text-muted-foreground">
                Importados: {importSummary.imported} · Filas con error: {importSummary.failed}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Seguros</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.activos} activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.porVencer}</div>
              <p className="text-xs text-muted-foreground">Próximos 30 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Primas Anuales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(stats.totalPrimas)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cobertura:{' '}
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(stats.totalCobertura)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Siniestros</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.siniestros}</div>
              <p className="text-xs text-muted-foreground">Reclamaciones activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Documentación de Seguros Externa (Google Drive) */}
        {externalDocs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-red-600" />
                Documentación de Seguros
              </CardTitle>
              <CardDescription>
                Pólizas y documentos de seguros enlazados desde Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {externalDocs.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3"
                    onClick={() => window.open(doc.cloudStoragePath, '_blank')}
                  >
                    <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{doc.nombre}</h4>
                      {doc.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {doc.descripcion}
                        </p>
                      )}
                      <Badge variant="outline" className="text-xs mt-2 text-blue-600 border-blue-300 bg-blue-50">
                        Google Drive
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar seguros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de seguro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {tiposSeguro.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={aseguradoraFilter} onValueChange={setAseguradoraFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Aseguradora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {aseguradoras.map((aseg) => (
                    <SelectItem key={aseg} value={aseg}>
                      {aseg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activa">Activos</SelectItem>
                  <SelectItem value="vencida">Vencidos</SelectItem>
                  <SelectItem value="cancelada">Cancelados</SelectItem>
                  <SelectItem value="pendiente_renovacion">Pendiente renovación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm ||
              tipoFilter !== 'all' ||
              estadoFilter !== 'all' ||
              aseguradoraFilter !== 'all') && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Mostrando {filteredSeguros.length} de {seguros.length} seguros
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setTipoFilter('all');
                    setEstadoFilter('all');
                    setAseguradoraFilter('all');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pólizas Activas</CardTitle>
            <CardDescription>Gestiona los seguros contratados para tus propiedades</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSeguros.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay seguros</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comienza agregando tu primer seguro
                </p>
                <Button onClick={() => router.push('/seguros/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Seguro
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Póliza</TableHead>
                      <TableHead>Aseguradora</TableHead>
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Prima Anual</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSeguros.map((seguro) => (
                      <TableRow key={seguro.id}>
                        <TableCell>{getTipoBadge(seguro.tipo)}</TableCell>
                        <TableCell className="font-medium">
                          {seguro.numeroPoliza || seguro.poliza}
                        </TableCell>
                        <TableCell>{seguro.aseguradora}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {seguro.building?.nombre}
                            {seguro.unit && (
                              <span className="text-muted-foreground">
                                {' '}
                                - Unidad {seguro.unit.numero}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {format(new Date(seguro.fechaVencimiento), "dd 'de' MMMM, yyyy", {
                                locale: es,
                              })}
                            </div>
                            {seguro.diasHastaVencimiento !== undefined && (
                              <div
                                className={`text-xs ${
                                  seguro.diasHastaVencimiento <= 0
                                    ? 'text-red-600'
                                    : seguro.diasHastaVencimiento <= 30
                                      ? 'text-yellow-600'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {seguro.diasHastaVencimiento <= 0
                                  ? `Vencido hace ${Math.abs(seguro.diasHastaVencimiento)} días`
                                  : `${seguro.diasHastaVencimiento} días restantes`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(getPrimaValue(seguro))}
                        </TableCell>
                        <TableCell>{getEstadoBadge(seguro)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/seguros/${seguro.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/seguros/${seguro.id}/editar`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/seguros/${seguro.id}/siniestros`)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Siniestros ({seguro._count?.claims || 0})
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSeguroToDelete(seguro);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar seguro?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El seguro y todos sus siniestros asociados serán
                eliminados permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Asistente IA de Documentos */}
        <AIDocumentAssistant context="seguros" variant="floating" position="bottom-right" />
      </div>
    </AuthenticatedLayout>
  );
}
