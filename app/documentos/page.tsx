'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Filter,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Home,
  File,
  Calendar as CalendarIcon,
  Building2,
  User,
  Search,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import logger, { logError } from '@/lib/logger';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  cloudStoragePath: string;
  fechaSubida: string;
  fechaVencimiento: string | null;
  tenant?: { nombreCompleto: string };
  unit?: { numero: string };
  building?: { nombre: string };
}

export default function DocumentosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    nombre: '',
    tipo: 'otro',
    fechaVencimiento: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchDocuments();
    }
  }, [session]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      logger.error('Error fetching documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.nombre) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('nombre', uploadForm.nombre);
      formData.append('tipo', uploadForm.tipo);
      if (uploadForm.fechaVencimiento) {
        formData.append('fechaVencimiento', uploadForm.fechaVencimiento);
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success('Documento subido exitosamente');
        setOpenUploadDialog(false);
        setUploadForm({ file: null, nombre: '', tipo: 'otro', fechaVencimiento: '' });
        fetchDocuments();
      } else {
        toast.error('Error al subir documento');
      }
    } catch (error) {
      logger.error('Error uploading document:', error);
      toast.error('Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/download`);
      if (res.ok) {
        const data = await res.json();
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error('Error al descargar documento');
      }
    } catch (error) {
      logger.error('Error downloading document:', error);
      toast.error('Error al descargar documento');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Documento eliminado exitosamente');
        fetchDocuments();
      } else {
        toast.error('Error al eliminar documento');
      }
    } catch (error) {
      logger.error('Error deleting document:', error);
      toast.error('Error al eliminar documento');
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      contrato: 'bg-blue-500',
      dni: 'bg-green-500',
      nomina: 'bg-yellow-500',
      certificado_energetico: 'bg-purple-500',
      ite: 'bg-orange-500',
      seguro: 'bg-red-500',
      factura: 'bg-indigo-500',
      otro: 'bg-gray-500',
    };
    return colors[tipo] || 'bg-gray-500';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      contrato: 'Contrato',
      dni: 'DNI',
      nomina: 'Nómina',
      certificado_energetico: 'Certificado Energético',
      ite: 'ITE',
      seguro: 'Seguro',
      factura: 'Factura',
      otro: 'Otro',
    };
    return labels[tipo] || tipo;
  };

  // Actualizar filtros activos
  useEffect(() => {
    const filters: Array<{ id: string; label: string; value: string }> = [];

    if (searchTerm) {
      filters.push({ id: 'search', label: 'Búsqueda', value: searchTerm });
    }
    if (filterTipo !== 'all') {
      const tipoLabels: Record<string, string> = {
        contrato: 'Contrato',
        documento_identidad: 'Documento de Identidad',
        recibo: 'Recibo',
        certificado: 'Certificado',
        inspeccion: 'Inspección',
        seguro: 'Seguro',
        factura: 'Factura',
        otro: 'Otro',
      };
      filters.push({ id: 'tipo', label: 'Tipo', value: tipoLabels[filterTipo] || filterTipo });
    }

    setActiveFilters(filters);
  }, [searchTerm, filterTipo]);

  const clearFilter = (id: string) => {
    if (id === 'search') {
      setSearchTerm('');
    } else if (id === 'tipo') {
      setFilterTipo('all');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterTipo('all');
  };

  // Filtrado de documentos
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        searchTerm === '' ||
        doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tenant?.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.unit?.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.building?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = filterTipo === 'all' || doc.tipo === filterTipo;

      return matchesSearch && matchesTipo;
    });
  }, [documents, searchTerm, filterTipo]);

  // Estadísticas
  const stats = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      total: documents.length,
      vencidos: documents.filter(
        (doc) => doc.fechaVencimiento && new Date(doc.fechaVencimiento) < now
      ).length,
      porVencer: documents.filter(
        (doc) =>
          doc.fechaVencimiento &&
          new Date(doc.fechaVencimiento) >= now &&
          new Date(doc.fechaVencimiento) <= in30Days
      ).length,
      sinVencimiento: documents.filter((doc) => !doc.fechaVencimiento).length,
    };
  }, [documents]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando documentos..." />
          </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Botón Volver y Breadcrumbs */}
        <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/dashboard')}
        className="gap-2"
        >
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>
      <Breadcrumb>
        <BreadcrumbList>
        <BreadcrumbItem>
        <BreadcrumbLink href="/dashboard">
        <Home className="h-4 w-4" />
        </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
        <BreadcrumbPage>Documentos</BreadcrumbPage>
        </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">Gestiona todos los documentos del sistema</p>
      </div>
      {canCreate && (
        <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
        <DialogTrigger asChild>
        <Button onClick={() => setOpenUploadDialog(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Subir Documento
        </Button>
        </DialogTrigger>
        <DialogContent>
        <DialogHeader>
        <DialogTitle>Subir Nuevo Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
        <div>
        <Label htmlFor="file">Archivo *</Label>
        <Input
        id="file"
        type="file"
        required
        onChange={(e) =>
        setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })
        }
        />
        </div>
        <div>
        <Label htmlFor="nombre">Nombre del documento *</Label>
        <Input
        id="nombre"
        value={uploadForm.nombre}
        onChange={(e) => setUploadForm({ ...uploadForm, nombre: e.target.value })}
        placeholder="Ej: Contrato Juan Pérez"
        required
        />
        </div>
        <div>
        <Label htmlFor="tipo">Tipo de documento *</Label>
        <Select
        value={uploadForm.tipo}
        onValueChange={(value) => setUploadForm({ ...uploadForm, tipo: value })}
        >
        <SelectTrigger>
        <SelectValue />
        </SelectTrigger>
        <SelectContent>
        <SelectItem value="contrato">Contrato</SelectItem>
        <SelectItem value="dni">DNI</SelectItem>
        <SelectItem value="nomina">Nómina</SelectItem>
        <SelectItem value="certificado_energetico">
        Certificado Energético
        </SelectItem>
        <SelectItem value="ite">ITE</SelectItem>
        <SelectItem value="seguro">Seguro</SelectItem>
        <SelectItem value="factura">Factura</SelectItem>
        <SelectItem value="otro">Otro</SelectItem>
        </SelectContent>
        </Select>
        </div>
        <div>
        <Label htmlFor="fechaVencimiento">Fecha de vencimiento (opcional)</Label>
        <Input
        id="fechaVencimiento"
        type="date"
        value={uploadForm.fechaVencimiento}
        onChange={(e) =>
        setUploadForm({ ...uploadForm, fechaVencimiento: e.target.value })
        }
        />
        </div>
        <div className="flex justify-end gap-2">
        <Button
        type="button"
        variant="outline"
        onClick={() => setOpenUploadDialog(false)}
        >
        Cancelar
        </Button>
        <Button type="submit" disabled={uploading}>
        {uploading ? 'Subiendo...' : 'Subir Documento'}
        </Button>
        </div>
        </form>
        </DialogContent>
        </Dialog>
        )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
        Vencidos
        </CardTitle>
        <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold">{stats.vencidos}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
        Por Vencer
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold">{stats.porVencer}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
        Sin Vencimiento
        </CardTitle>
        <File className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold">{stats.sinVencimiento}</div>
        </CardContent>
      </Card>
        </div>

        {/* Búsqueda y Filtros */}
        <Card>
      <CardHeader>
        <CardTitle>Buscar Documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
        placeholder="Buscar por nombre, inquilino, edificio o unidad..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
        />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
        <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
        <SelectItem value="all">Todos los tipos</SelectItem>
        <SelectItem value="contrato">Contrato</SelectItem>
        <SelectItem value="dni">DNI</SelectItem>
        <SelectItem value="nomina">Nómina</SelectItem>
        <SelectItem value="certificado_energetico">Certificado Energético</SelectItem>
        <SelectItem value="ite">ITE</SelectItem>
        <SelectItem value="seguro">Seguro</SelectItem>
        <SelectItem value="factura">Factura</SelectItem>
        <SelectItem value="otro">Otro</SelectItem>
        </SelectContent>
        </Select>
        </div>
      </CardContent>
        </Card>

        {/* Filter Chips */}
        <FilterChips
        filters={activeFilters}
        onRemove={clearFilter}
        onClearAll={clearAllFilters}
        />

        {/* Lista de Documentos */}
        <div className="space-y-4">
      {filteredDocuments.length === 0 ? (
        searchTerm || filterTipo !== 'all' ? (
        <EmptyState
        icon={<Search className="h-16 w-16 text-gray-400" />}
        title="No se encontraron resultados"
        description="Intenta ajustar los filtros de búsqueda"
        action={{
        label: 'Limpiar filtros',
        onClick: clearAllFilters,
        icon: <Search className="h-4 w-4" />,
        }}
        />
        ) : (
        <EmptyState
        icon={<FileText className="h-16 w-16 text-gray-400" />}
        title="No hay documentos almacenados"
        description="Comienza subiendo tu primer documento para organizarlos mejor"
        action={
        canCreate
        ? {
        label: 'Subir Primer Documento',
        onClick: () => setOpenUploadDialog(true),
        icon: <Upload className="h-4 w-4" />,
        }
        : undefined
        }
        />
        )
        ) : (
        filteredDocuments.map((doc) => {
        const now = new Date();
        const vencimiento = doc.fechaVencimiento ? new Date(doc.fechaVencimiento) : null;
        const isVencido = vencimiento && vencimiento < now;
        const isPorVencer =
        vencimiento &&
        vencimiento >= now &&
        vencimiento < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return (
        <Card key={doc.id} className="hover:shadow-lg transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
        {/* Icono */}
        <div className="flex-shrink-0">
        <div className="p-3 bg-primary/10 rounded-lg">
        <FileText className="h-6 w-6 text-primary" />
        </div>
        </div>

        {/* Información Principal */}
        <div className="flex-1 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <h3 className="text-lg font-semibold break-words flex-1">
        {doc.nombre}
        </h3>
        <Badge className={getTipoBadgeColor(doc.tipo)}>
        {getTipoLabel(doc.tipo)}
        </Badge>
        </div>

        {/* Entidad relacionada */}
        {(doc.tenant || doc.unit || doc.building) && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
        {doc.tenant && (
        <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-primary" />
        <span className="font-medium">
        Inquilino: {doc.tenant.nombreCompleto}
        </span>
        </div>
        )}
        {doc.building && (
        <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-medium">
        Edificio: {doc.building.nombre}
        </span>
        </div>
        )}
        {doc.unit && (
        <div className="flex items-center gap-2 text-sm">
        <Home className="h-4 w-4 text-primary" />
        <span className="font-medium">Unidad: {doc.unit.numero}</span>
        </div>
        )}
        </div>
        )}

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
        <div className="text-muted-foreground flex items-center gap-1">
        <CalendarIcon className="h-3 w-3" />
        Subido
        </div>
        <div className="font-medium">
        {format(new Date(doc.fechaSubida), 'dd MMM yyyy', { locale: es })}
        </div>
        </div>
        <div className="space-y-1">
        <div className="text-muted-foreground flex items-center gap-1">
        <CalendarIcon className="h-3 w-3" />
        Vencimiento
        </div>
        {doc.fechaVencimiento ? (
        <div className="flex items-center gap-1">
        {isVencido && <AlertCircle className="h-3 w-3 text-red-500" />}
        {isPorVencer && (
        <AlertTriangle className="h-3 w-3 text-orange-500" />
        )}
        <span
        className={`font-medium ${isVencido ? 'text-red-500' : isPorVencer ? 'text-orange-500' : ''}`}
        >
        {format(new Date(doc.fechaVencimiento), 'dd MMM yyyy', {
        locale: es,
        })}
        </span>
        </div>
        ) : (
        <span className="text-muted-foreground">Sin vencimiento</span>
        )}
        </div>
        </div>
        </div>

        {/* Acciones */}
        <div className="flex sm:flex-col items-center gap-2 self-start">
        <Button
        variant="outline"
        size="sm"
        onClick={() => {
        setSelectedDocument(doc);
        setOpenDetailDialog(true);
        }}
        className="w-full sm:w-auto"
        >
        <Eye className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Ver</span>
        </Button>
        <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload(doc.id)}
        className="w-full sm:w-auto"
        >
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Descargar</span>
        </Button>
        <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDelete(doc.id)}
        className="w-full sm:w-auto"
        >
        <Trash2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Eliminar</span>
        </Button>
        </div>
        </div>
        </CardContent>
        </Card>
        );
        })
        )}
        </div>
      </div>

      {/* Diálogo de Detalles */}
      {selectedDocument && (
        <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
      <DialogTitle>Detalles del Documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
        <Label className="text-muted-foreground">Nombre</Label>
        <p className="font-medium mt-1">{selectedDocument.nombre}</p>
        </div>
        <div>
        <Label className="text-muted-foreground">Tipo</Label>
        <p className="font-medium mt-1">{selectedDocument.tipo}</p>
        </div>
        <div>
        <Label className="text-muted-foreground">Fecha de Subida</Label>
        <p className="font-medium mt-1">
        {format(new Date(selectedDocument.fechaSubida), 'dd MMMM yyyy HH:mm', {
        locale: es,
        })}
        </p>
        </div>
        <div>
        <Label className="text-muted-foreground">Fecha de Vencimiento</Label>
        <p className="font-medium mt-1">
        {selectedDocument.fechaVencimiento
        ? format(new Date(selectedDocument.fechaVencimiento), 'dd MMMM yyyy', {
        locale: es,
        })
        : 'Sin vencimiento'}
        </p>
        </div>
      </div>

      {(selectedDocument.tenant || selectedDocument.unit || selectedDocument.building) && (
        <div className="border-t pt-4">
        <Label className="text-muted-foreground mb-2 block">Entidades Relacionadas</Label>
        <div className="space-y-2">
        {selectedDocument.tenant && (
        <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-medium">
        Inquilino: {selectedDocument.tenant.nombreCompleto}
        </span>
        </div>
        )}
        {selectedDocument.building && (
        <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-medium">
        Edificio: {selectedDocument.building.nombre}
        </span>
        </div>
        )}
        {selectedDocument.unit && (
        <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-primary" />
        <span className="font-medium">Unidad: {selectedDocument.unit.numero}</span>
        </div>
        )}
        </div>
        </div>
        )}

      <div className="border-t pt-4 flex gap-2">
        <Button
        variant="outline"
        onClick={() => handleDownload(selectedDocument.id)}
        className="flex-1"
        >
        <Download className="h-4 w-4 mr-2" />
        Descargar
        </Button>
        <Button
        variant="outline"
        onClick={() => {
        setOpenDetailDialog(false);
        setSelectedDocument(null);
        }}
        >
        Cerrar
        </Button>
      </div>
        </div>
      </DialogContent>
        </Dialog>
      )}

      {/* Asistente IA de Documentos */}
      <AIDocumentAssistant 
        context="documentos"
        variant="floating"
        position="bottom-right"
      />
    </AuthenticatedLayout>
  );
}
