'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Euro,
  Home,
  User,
  Building2,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Upload,
  Paperclip,
  Eye,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { usePermissions } from '@/lib/hooks/usePermissions';
import toast from 'react-hot-toast';
import logger, { logError } from '@/lib/logger';

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  deposito: number;
  estado: string;
  tipo: string;
  diaPago: number;
  clausulasAdicionales: string;
  renovacionAutomatica: boolean;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
    dni: string;
  };
  unit: {
    id: string;
    numero: string;
    tipo: string;
    planta: number;
    superficie: number;
    building: {
      id: string;
      nombre: string;
      direccion: string;
    };
  };
  payments?: Array<{
    id: string;
    periodo: string;
    monto: number;
    estado: string;
    fechaVencimiento: string;
  }>;
}

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  cloudStoragePath: string;
  fechaSubida: string;
}

function ContratoDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { canEdit, canDelete } = usePermissions();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para documentos y drag & drop
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contractId = params?.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContract = async () => {
      if (!contractId) return;
      
      try {
        setError(null);
        const response = await fetch(`/api/contracts/${contractId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Contrato no encontrado');
          }
          throw new Error(`Error ${response.status}: No se pudo cargar el contrato`);
        }
        
        const data = await response.json();
        setContract(data);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMsg);
        logError(error instanceof Error ? error : new Error(errorMsg), {
          context: 'fetchContract',
          contractId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && contractId) {
      fetchContract();
    }
  }, [status, contractId]);

  // Cargar documentos del contrato
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!contractId) return;
      
      setLoadingDocs(true);
      try {
        const response = await fetch(`/api/documents?contractId=${contractId}`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoadingDocs(false);
      }
    };

    if (status === 'authenticated' && contractId) {
      fetchDocuments();
    }
  }, [status, contractId]);

  // Manejar drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Manejar drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  }, [contractId]);

  // Manejar selección de archivos
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
    }
  }, [contractId]);

  // Subir archivos
  const uploadFiles = async (fileList: FileList) => {
    if (!contractId) return;
    
    setUploading(true);
    
    try {
      for (const file of Array.from(fileList)) {
        // Validar tipo de archivo
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Tipo de archivo no permitido: ${file.name}`);
          continue;
        }
        
        // Validar tamaño (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Archivo demasiado grande: ${file.name} (máx. 10MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('nombre', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('tipo', 'contrato');
        formData.append('contractId', contractId);

        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const newDoc = await response.json();
          setDocuments(prev => [newDoc, ...prev]);
          toast.success(`Documento "${file.name}" subido correctamente`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || `Error subiendo ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error al subir los archivos');
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Descargar documento
  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
      } else {
        toast.error('Error al descargar documento');
      }
    } catch (error) {
      toast.error('Error al descargar documento');
    }
  };

  // Eliminar documento
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
        toast.success('Documento eliminado');
      } else {
        toast.error('Error al eliminar documento');
      }
    } catch (error) {
      toast.error('Error al eliminar documento');
    }
  };

  const handleDelete = async () => {
    if (!contract) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el contrato');
      }

      toast.success('Contrato eliminado correctamente');
      router.push('/contratos');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar';
      toast.error(errorMsg);
      logError(error instanceof Error ? error : new Error(errorMsg), {
        context: 'deleteContract',
        contractId: contract.id,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      activo: { variant: 'default', label: 'Activo' },
      finalizado: { variant: 'secondary', label: 'Finalizado' },
      cancelado: { variant: 'destructive', label: 'Cancelado' },
      pendiente: { variant: 'outline', label: 'Pendiente' },
    };
    return badges[estado?.toLowerCase()] || { variant: 'default', label: estado };
  };

  const getDaysUntilExpiry = (fechaFin: string) => {
    const today = new Date();
    const endDate = new Date(fechaFin);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/contratos')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Contratos
          </Button>
          
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold">Error al cargar el contrato</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => router.push('/contratos')}>
                  Volver a la lista de contratos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!contract) {
    return null;
  }

  const daysUntilExpiry = getDaysUntilExpiry(contract.fechaFin);
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  const isExpired = daysUntilExpiry < 0;
  const estadoBadge = getEstadoBadge(contract.estado);

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <SmartBreadcrumbs showBackButton={true} />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Contrato #{contract.id.slice(-8)}
              </h1>
              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {contract.tenant?.nombreCompleto} - {contract.unit?.building?.nombre}
            </p>
          </div>

          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => router.push(`/contratos/${contract.id}/editar`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {/* Alerta de vencimiento */}
        {contract.estado?.toLowerCase() === 'activo' && (isExpiringSoon || isExpired) && (
          <Card className={isExpired ? 'border-destructive bg-destructive/5' : 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 ${isExpired ? 'text-destructive' : 'text-orange-600'}`} />
                <div>
                  <p className={`font-medium ${isExpired ? 'text-destructive' : 'text-orange-700 dark:text-orange-400'}`}>
                    {isExpired
                      ? `Este contrato venció hace ${Math.abs(daysUntilExpiry)} días`
                      : `Este contrato vence en ${daysUntilExpiry} días`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isExpired
                      ? 'Considera renovar o finalizar el contrato'
                      : 'Programa la renovación para evitar interrupciones'}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renovar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información del contrato */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Detalles del contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalles del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium capitalize">{contract.tipo || 'Alquiler'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                  <p className="font-medium">
                    {format(new Date(contract.fechaInicio), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Fin</p>
                  <p className="font-medium">
                    {format(new Date(contract.fechaFin), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renta Mensual</p>
                  <p className="text-xl font-bold text-green-600">
                    €{Number(contract.rentaMensual || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Depósito</p>
                  <p className="font-medium">
                    €{Number(contract.deposito || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Día de Pago</p>
                  <p className="font-medium">Día {contract.diaPago || 1}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renovación Automática</p>
                  <p className="font-medium">{contract.renovacionAutomatica ? 'Sí' : 'No'}</p>
                </div>
              </div>

              {contract.clausulasAdicionales && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Cláusulas Adicionales</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{contract.clausulasAdicionales}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del inquilino */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Inquilino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre Completo</p>
                  <p className="font-medium">{contract.tenant?.nombreCompleto || 'Sin asignar'}</p>
                </div>
                {contract.tenant?.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{contract.tenant.email}</p>
                  </div>
                )}
                {contract.tenant?.telefono && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{contract.tenant.telefono}</p>
                  </div>
                )}
                {contract.tenant?.dni && (
                  <div>
                    <p className="text-sm text-muted-foreground">DNI/NIE</p>
                    <p className="font-medium">{contract.tenant.dni}</p>
                  </div>
                )}
              </div>

              {contract.tenant?.id && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/inquilinos/${contract.tenant.id}`)}
                >
                  Ver perfil del inquilino
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Información de la propiedad */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Propiedad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Edificio</p>
                  <p className="font-medium">{contract.unit?.building?.nombre || 'Sin asignar'}</p>
                  {contract.unit?.building?.direccion && (
                    <p className="text-sm text-muted-foreground">{contract.unit.building.direccion}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unidad</p>
                  <p className="font-medium">{contract.unit?.numero || 'Sin asignar'}</p>
                  <p className="text-sm text-muted-foreground capitalize">{contract.unit?.tipo || ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Detalles</p>
                  <p className="font-medium">
                    {contract.unit?.planta ? `Planta ${contract.unit.planta}` : ''}
                    {contract.unit?.superficie ? ` - ${contract.unit.superficie}m²` : ''}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {contract.unit?.building?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/edificios/${contract.unit.building.id}`)}
                  >
                    Ver edificio
                  </Button>
                )}
                {contract.unit?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/unidades/${contract.unit.id}`)}
                  >
                    Ver unidad
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial de pagos */}
        {contract.payments && contract.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Últimos Pagos
              </CardTitle>
              <CardDescription>
                Historial de pagos asociados a este contrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contract.payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.periodo}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence: {format(new Date(payment.fechaVencimiento), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        €{Number(payment.monto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge
                        variant={payment.estado === 'pagado' ? 'default' : payment.estado === 'pendiente' ? 'outline' : 'destructive'}
                      >
                        {payment.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push(`/pagos?contratoId=${contract.id}`)}
              >
                Ver todos los pagos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Documentos del contrato - Drag & Drop */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Documentos del Contrato
            </CardTitle>
            <CardDescription>
              Arrastra archivos aquí o haz clic para subir documentos asociados a este contrato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zona de Drag & Drop */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-sm font-medium">Subiendo documentos...</p>
                  </>
                ) : (
                  <>
                    <div className={`p-3 rounded-full ${dragActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Upload className={`h-8 w-8 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {dragActive ? '¡Suelta para subir!' : 'Arrastra y suelta archivos aquí'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        PDF, Word, JPG, PNG • Máx. 10MB por archivo
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar archivos
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Lista de documentos */}
            {loadingDocs ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Documentos adjuntos ({documents.length})
                </h4>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.fechaSubida), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.id)}
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-destructive hover:text-destructive"
                          title="Eliminar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No hay documentos adjuntos a este contrato
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadatos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  Creado: {format(new Date(contract.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                </span>
              </div>
              <div>
                Actualizado: {format(new Date(contract.updatedAt), 'dd MMM yyyy HH:mm', { locale: es })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de confirmación de eliminación */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          title="¿Eliminar contrato?"
          description={`Se eliminará el contrato de ${contract.tenant?.nombreCompleto} para la unidad ${contract.unit?.numero}. Esta acción no se puede deshacer.`}
        />
      </div>
    </AuthenticatedLayout>
  );
}

export default function ContratoDetailPage() {
  return (
    <ErrorBoundary>
      <ContratoDetailContent />
    </ErrorBoundary>
  );
}
