// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Home,
  ArrowLeft,
  Calendar,
  Building2,
  Users,
  Euro,
  Edit,
  Trash2,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Download,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatFecha, formatNombre } from '@/lib/utils';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  deposito: number;
  estado: string;
  tipo: string;
  notas?: string;
  codigoOperacion?: string | null;
  suministrosProvisionales?: number | null;
  ibiRepercutido?: number | null;
  unit?: {
    id: string;
    numero: string;
    tipo: string;
    building?: {
      id: string;
      nombre: string;
      direccion: string;
    };
  };
  tenant?: {
    id: string;
    nombreCompleto: string;
    nombre?: string;
    apellido?: string;
    email: string;
    telefono?: string;
    dni?: string;
  };
  payments?: Array<{
    id: string;
    monto: number;
    estado: string;
    fechaVencimiento: string;
    fechaPago?: string;
    concepto?: string;
  }>;
  stripeSubscription?: {
    id: string;
    status: string;
  };
}

function ContractDocuments({
  contractId,
  buildingId,
}: {
  contractId: string;
  buildingId?: string;
}) {
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await fetch(`/api/documents?contractId=${contractId}`);
        if (res.ok) {
          const data = await res.json();
          setDocs(Array.isArray(data) ? data : data.data || []);
        }
      } catch {}
    }
    loadDocs();
  }, [contractId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nombre', file.name);
      formData.append('tipo', 'contrato');
      formData.append('contractId', contractId);
      if (buildingId) formData.append('buildingId', buildingId);

      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      if (res.ok) {
        const newDoc = await res.json();
        setDocs((prev) => [newDoc, ...prev]);
        toast.success('Documento subido correctamente');
      } else {
        toast.error('Error al subir documento');
      }
    } catch {
      toast.error('Error al subir documento');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos del Contrato
            </CardTitle>
            <CardDescription>Documentos adjuntos y firma digital</CardDescription>
          </div>
          <div>
            <input
              type="file"
              id="doc-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('doc-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" /> Subir Documento
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {docs.length > 0 ? (
          <div className="space-y-3">
            {docs.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">{doc.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.fechaSubida ? formatFecha(doc.fechaSubida) : ''}
                      {doc.tags?.length > 0 && ` · ${doc.tags.join(', ')}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (doc.cloudStoragePath?.startsWith('http')) {
                      window.open(doc.cloudStoragePath, '_blank');
                    } else {
                      try {
                        const res = await fetch(`/api/documents/${doc.id}/download`);
                        const data = await res.json();
                        if (data.url) window.open(data.url, '_blank');
                      } catch {
                        /* fallback */
                      }
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay documentos adjuntos</p>
            <p className="text-sm mt-1">Sube contratos, adendas o documentación relacionada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContractDetailPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && contractId) {
      fetchContract();
    }
  }, [status, contractId, router]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Contrato no encontrado');
          router.push('/contratos');
          return;
        }
        throw new Error('Error al cargar el contrato');
      }
      const data = await response.json();
      setContract(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el contrato');
      }

      toast.success('Contrato eliminado correctamente');
      router.push('/contratos');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el contrato');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return <Badge className="bg-black text-white border-black">Activo</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>;
      case 'cancelado':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelado</Badge>;
      case 'borrador':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Borrador</Badge>;
      default:
        return <Badge variant="outline">{estado || 'Sin estado'}</Badge>;
    }
  };

  const getPaymentStatusBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'pagado':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return formatFecha(dateString);
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando contrato...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!contract) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Contrato no encontrado</h2>
            <Button onClick={() => router.push('/contratos')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a contratos
            </Button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/contratos')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
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
                <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Detalle</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Contrato #{contract.id.slice(-6).toUpperCase()}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(contract.estado)}
                    <span className="text-muted-foreground text-sm">
                      {contract.tipo || 'Residencial'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/contratos/${contractId}/editar`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar contrato?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al
                      contrato.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Información del Contrato */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Información del Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                      <p className="font-medium">{formatDate(contract.fechaInicio)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Fin</p>
                      <p className="font-medium">{formatDate(contract.fechaFin)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Renta Mensual</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(contract.rentaMensual)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Depósito</p>
                      <p className="font-medium">{formatCurrency(contract.deposito)}</p>
                    </div>
                  </div>
                  {contract.notas && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">Notas</p>
                        <p className="text-sm mt-1">{contract.notas}</p>
                      </div>
                    </>
                  )}
                  {(contract.codigoOperacion ||
                    contract.suministrosProvisionales != null ||
                    contract.ibiRepercutido != null) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Datos Contables</p>
                        {contract.codigoOperacion && (
                          <div>
                            <p className="text-sm text-muted-foreground">Código operación</p>
                            <p className="font-medium">{contract.codigoOperacion}</p>
                          </div>
                        )}
                        {contract.suministrosProvisionales != null && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Suministros provisionales
                            </p>
                            <p className="font-medium">
                              {formatCurrency(contract.suministrosProvisionales)}/mes
                            </p>
                          </div>
                        )}
                        {contract.ibiRepercutido != null && (
                          <div>
                            <p className="text-sm text-muted-foreground">IBI repercutido</p>
                            <p className="font-medium">
                              {formatCurrency(contract.ibiRepercutido)}/mes
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Inmueble */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Inmueble
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract.unit ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Unidad</p>
                        <p className="font-medium">
                          {contract.unit.tipo} {contract.unit.numero}
                        </p>
                      </div>
                      {contract.unit.building && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground">Edificio</p>
                            <p className="font-medium">{contract.unit.building.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {contract.unit.building.direccion}
                            </p>
                          </div>
                        </>
                      )}
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => router.push(`/unidades/${contract.unit?.id}`)}
                      >
                        Ver Unidad
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No hay unidad asignada</p>
                  )}
                </CardContent>
              </Card>

              {/* Inquilino */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Inquilino
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract.tenant ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p className="font-medium">
                          {formatNombre(
                            contract.tenant.nombreCompleto ||
                              `${contract.tenant.nombre || ''} ${contract.tenant.apellido || ''}`.trim() ||
                              ''
                          ) || 'Sin nombre'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{contract.tenant.email}</p>
                      </div>
                      {contract.tenant.telefono && (
                        <div>
                          <p className="text-sm text-muted-foreground">Teléfono</p>
                          <p className="font-medium">{contract.tenant.telefono}</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => router.push(`/inquilinos/${contract.tenant?.id}`)}
                      >
                        Ver Inquilino
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No hay inquilino asignado</p>
                  )}
                </CardContent>
              </Card>

              {/* Suscripción Stripe */}
              {contract.stripeSubscription && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Suscripción de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Estado</span>
                      <Badge
                        className={
                          contract.stripeSubscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {contract.stripeSubscription.status === 'active'
                          ? 'Activa'
                          : contract.stripeSubscription.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pagos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Historial de Pagos
                </CardTitle>
                <CardDescription>Pagos asociados a este contrato</CardDescription>
              </CardHeader>
              <CardContent>
                {contract.payments && contract.payments.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Importe</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Fecha Pago</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contract.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.concepto || 'Renta mensual'}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(payment.monto)}
                            </TableCell>
                            <TableCell>{formatDate(payment.fechaVencimiento)}</TableCell>
                            <TableCell>
                              {payment.fechaPago ? formatDate(payment.fechaPago) : '-'}
                            </TableCell>
                            <TableCell>{getPaymentStatusBadge(payment.estado)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Euro className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No hay pagos registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-6">
            <ContractDocuments contractId={contractId} buildingId={contract.unit?.building?.id} />
          </TabsContent>
        </Tabs>
      </div>
      <AIDocumentAssistant />
    </AuthenticatedLayout>
  );
}
