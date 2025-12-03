'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Home, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  XCircle,
  Users,
  Send,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface DocumentoFirma {
  id: string;
  titulo: string;
  tipoDocumento: string;
  estado: string;
  documentUrl: string;
  fechaExpiracion: string;
  createdAt: string;
  firmantes: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    estado: string;
  }[];
  tenant?: {
    nombreCompleto: string;
  };
  contract?: {
    unit: {
      numero: string;
      building: {
        nombre: string;
      };
    };
  };
}

export default function FirmaDigitalPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [documentos, setDocumentos] = useState<DocumentoFirma[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarDialogoNuevo, setMostrarDialogoNuevo] = useState(false);
  const [mostrarDialogoDetalle, setMostrarDialogoDetalle] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoFirma | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      cargarDocumentos();
    }
  }, [session]);

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/digital-signature');
      if (!response.ok) throw new Error('Error cargando documentos');
      
      const data = await response.json();
      setDocumentos(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (documentoId: string) => {
    try {
      const response = await fetch(`/api/digital-signature/${documentoId}`);
      if (!response.ok) throw new Error('Error cargando detalle');
      
      const data = await response.json();
      setDocumentoSeleccionado(data.documento);
      setMostrarDialogoDetalle(true);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar el detalle');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'borrador': { label: 'Borrador', variant: 'secondary' },
      'enviado': { label: 'Enviado', variant: 'default' },
      'firmado_parcial': { label: 'Firmado Parcial', variant: 'outline' },
      'firmado_completo': { label: 'Completado', variant: 'default' },
      'rechazado': { label: 'Rechazado', variant: 'destructive' },
      'expirado': { label: 'Expirado', variant: 'destructive' }
    };

    const config = estados[estado] || { label: estado, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const kpis = {
    total: documentos.length,
    pendientes: documentos.filter(d => d.estado === 'enviado').length,
    completados: documentos.filter(d => d.estado === 'firmado_completo').length,
    rechazados: documentos.filter(d => d.estado === 'rechazado').length
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
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
                    <BreadcrumbPage>Firma Digital</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <h1 className="mt-2 text-2xl font-bold md:text-3xl">✍️ Firma Digital</h1>
              <p className="text-muted-foreground">
                <Badge variant="outline" className="mr-2">MODO DEMO</Badge>
                Gestiona documentos para firma electrónica
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setMostrarDialogoNuevo(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Solicitud
            </Button>
          </div>

          {/* KPIs */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendientes de Firma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{kpis.pendientes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{kpis.completados}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rechazados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{kpis.rechazados}</div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de documentos */}
          <div className="space-y-4">
            {documentos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No hay documentos de firma</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarDialogoNuevo(true)}
                    className="mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Primera Solicitud
                  </Button>
                </CardContent>
              </Card>
            ) : (
              documentos.map((doc) => {
                const firmantesCompletados = doc.firmantes.filter(f => f.estado === 'firmado').length;
                const totalFirmantes = doc.firmantes.length;

                return (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-start gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold">{doc.titulo}</h3>
                              <p className="text-sm text-muted-foreground">
                                {doc.tipoDocumento.charAt(0).toUpperCase() + doc.tipoDocumento.slice(1)}
                              </p>
                            </div>

                            {getEstadoBadge(doc.estado)}
                          </div>

                          <div className="ml-12 mt-2 space-y-1 text-sm text-muted-foreground">
                            {doc.tenant && (
                              <p>👤 Inquilino: {doc.tenant.nombreCompleto}</p>
                            )}
                            {doc.contract && (
                              <p>
                                📍 {doc.contract.unit.building.nombre} - Unidad {doc.contract.unit.numero}
                              </p>
                            )}
                            <p>
                              <Users className="inline h-4 w-4 mr-1" />
                              Firmantes: {firmantesCompletados}/{totalFirmantes}
                            </p>
                            <p>
                              📅 Creado: {format(new Date(doc.createdAt), 'PPP', { locale: es })}
                            </p>
                            {doc.fechaExpiracion && (
                              <p>
                                ⏰ Expira: {format(new Date(doc.fechaExpiracion), 'PPP', { locale: es })}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verDetalle(doc.id)}
                        >
                          Ver Detalle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Diálogo de detalle */}
          <Dialog open={mostrarDialogoDetalle} onOpenChange={setMostrarDialogoDetalle}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {documentoSeleccionado?.titulo}
                </DialogTitle>
                <DialogDescription>
                  Estado del proceso de firma
                </DialogDescription>
              </DialogHeader>

              {documentoSeleccionado && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    {getEstadoBadge(documentoSeleccionado.estado)}
                    <Badge variant="secondary">
                      {documentoSeleccionado.tipoDocumento}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Firmantes ({documentoSeleccionado.firmantes.length})</h4>
                    {documentoSeleccionado.firmantes.map((firmante) => (
                      <div
                        key={firmante.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">{firmante.nombre}</p>
                          <p className="text-sm text-muted-foreground">{firmante.email}</p>
                          <p className="text-sm text-muted-foreground">Rol: {firmante.rol}</p>
                        </div>

                        {firmante.estado === 'firmado' && (
                          <Badge className="gap-1" variant="default">
                            <CheckCircle className="h-3 w-3" />
                            Firmado
                          </Badge>
                        )}
                        {firmante.estado === 'pendiente' && (
                          <Badge className="gap-1" variant="secondary">
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                        {firmante.estado === 'rechazado' && (
                          <Badge className="gap-1" variant="destructive">
                            <XCircle className="h-3 w-3" />
                            Rechazado
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                    <p className="text-sm">
                      <strong>💡 Modo Demo:</strong> Las invitaciones no se envían realmente por email. 
                      En producción, cada firmante recibiría un enlace único para firmar.
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Diálogo de nueva solicitud */}
          <Dialog open={mostrarDialogoNuevo} onOpenChange={setMostrarDialogoNuevo}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Solicitud de Firma</DialogTitle>
                <DialogDescription>
                  En modo demo. Configure Signaturit para uso real.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Send className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">Funcionalidad Preparada</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  El sistema está listo para integrarse con Signaturit o DocuSign.
                  Configure las credenciales en las variables de entorno para activar.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setMostrarDialogoNuevo(false)}
                >
                  Entendido
                </Button>
              </div>
            </DialogContent>
          </Dialog>
                  </div>
        </main>
      </div>
    </div>
  );
}
