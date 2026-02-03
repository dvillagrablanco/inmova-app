'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  Building2,
  Calendar,
  Euro,
  FileText,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Insurance {
  id: string;
  type: string;
  provider: string;
  policyNumber: string;
  status: string;
  startDate: string;
  endDate: string;
  annualPremium: number;
  coverage: number;
  propertyAddress: string;
  propertyId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes?: string;
  documents: Document[];
  claims: Claim[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  size: number;
}

interface Claim {
  id: string;
  claimNumber: string;
  type: string;
  description: string;
  reportedDate: string;
  amount: number;
  status: string;
  resolvedDate?: string;
}

export default function InsuranceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const insuranceId = params.id as string;

  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Form states
  const [claimType, setClaimType] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    loadInsurance();
  }, [insuranceId]);

  const loadInsurance = async () => {
    try {
      setLoading(true);
      // TODO: Llamar a API real
      // const response = await fetch(`/api/insurances/${insuranceId}`);
      // const data = await response.json();
      // setInsurance(data);

      // Datos de ejemplo
      const mockInsurance: Insurance = {
        id: insuranceId,
        type: 'Hogar',
        provider: 'Mapfre',
        policyNumber: 'POL-2024-001234',
        status: 'ACTIVE',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        annualPremium: 350,
        coverage: 250000,
        propertyAddress: 'Calle Mayor 123, Madrid',
        propertyId: 'prop_123',
        contactName: 'Juan García',
        contactPhone: '+34 600 000 000',
        contactEmail: 'juan@mapfre.com',
        notes: 'Incluye cobertura de contenido hasta €50,000',
        documents: [
          {
            id: 'doc_1',
            name: 'Poliza_2024.pdf',
            type: 'POLICY',
            url: '/documents/poliza.pdf',
            uploadedAt: '2024-01-01T10:00:00Z',
            size: 2456789,
          },
          {
            id: 'doc_2',
            name: 'Condiciones_Generales.pdf',
            type: 'TERMS',
            url: '/documents/terms.pdf',
            uploadedAt: '2024-01-01T10:05:00Z',
            size: 5234567,
          },
        ],
        claims: [
          {
            id: 'claim_1',
            claimNumber: 'SIN-2024-001',
            type: 'WATER_DAMAGE',
            description: 'Fuga de agua en cocina causó daños en suelo y muebles',
            reportedDate: '2024-03-15T14:30:00Z',
            amount: 4500,
            status: 'APPROVED',
            resolvedDate: '2024-04-10T10:00:00Z',
          },
          {
            id: 'claim_2',
            claimNumber: 'SIN-2024-002',
            type: 'THEFT',
            description: 'Robo de electrodomésticos',
            reportedDate: '2024-06-20T09:00:00Z',
            amount: 2300,
            status: 'IN_REVIEW',
          },
        ],
      };

      setInsurance(mockInsurance);
    } catch (error) {
      console.error('Error loading insurance:', error);
      toast.error('Error al cargar el seguro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      // TODO: Llamar a API real
      // await fetch(`/api/insurances/${insuranceId}`, { method: 'DELETE' });
      toast.success('Seguro eliminado correctamente');
      router.push('/seguros');
    } catch (error) {
      console.error('Error deleting insurance:', error);
      toast.error('Error al eliminar el seguro');
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Llamar a API real
      const newClaim = {
        type: claimType,
        description: claimDescription,
        amount: parseFloat(claimAmount),
      };

      toast.success('Siniestro reportado correctamente');
      setClaimDialogOpen(false);
      setClaimType('');
      setClaimDescription('');
      setClaimAmount('');
      loadInsurance();
    } catch (error) {
      console.error('Error creating claim:', error);
      toast.error('Error al reportar el siniestro');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      // TODO: Upload to S3 via API
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('insuranceId', insuranceId);

      // await fetch('/api/insurances/documents/upload', {
      //   method: 'POST',
      //   body: formData,
      // });

      toast.success('Documento subido correctamente');
      setUploadDialogOpen(false);
      setUploadFile(null);
      loadInsurance();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      ACTIVE: { variant: 'default', label: 'Activo', icon: CheckCircle2 },
      EXPIRED: { variant: 'destructive', label: 'Vencido', icon: XCircle },
      PENDING: { variant: 'secondary', label: 'Pendiente', icon: Clock },
      CANCELLED: { variant: 'outline', label: 'Cancelado', icon: XCircle },
    };

    const config = variants[status] || variants.ACTIVE;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getClaimStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      PENDING: { variant: 'secondary', label: 'Pendiente' },
      IN_REVIEW: { variant: 'default', label: 'En Revisión' },
      APPROVED: { variant: 'default', label: 'Aprobado' },
      REJECTED: { variant: 'destructive', label: 'Rechazado' },
      PAID: { variant: 'default', label: 'Pagado' },
    };

    const config = variants[status] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const daysUntilExpiration = insurance
    ? Math.ceil(
        (new Date(insurance.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando seguro...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!insurance) {
    return (
      <AuthenticatedLayout>
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Seguro no encontrado</h2>
          <Button onClick={() => router.push('/seguros')} className="mt-4">
            Volver a Seguros
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/seguros')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Detalle del Seguro</h1>
              <p className="text-muted-foreground">
                {insurance.type} - {insurance.policyNumber}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/seguros/${insuranceId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Alerta de vencimiento */}
        {daysUntilExpiration > 0 && daysUntilExpiration <= 30 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  Este seguro vence en {daysUntilExpiration} días
                </p>
                <p className="text-sm text-orange-700">
                  Fecha de vencimiento:{' '}
                  {format(new Date(insurance.endDate), 'dd MMMM yyyy', { locale: es })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info General */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Información de la Póliza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                {getStatusBadge(insurance.status)}
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">{insurance.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aseguradora:</span>
                <span className="font-medium">{insurance.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nº Póliza:</span>
                <span className="font-mono text-sm">{insurance.policyNumber}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inicio:</span>
                <span>{format(new Date(insurance.startDate), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimiento:</span>
                <span>{format(new Date(insurance.endDate), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Información Económica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Prima Anual:</span>
                <span className="text-2xl font-bold">€{insurance.annualPremium}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cobertura:</span>
                <span className="font-medium">€{insurance.coverage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prima Mensual:</span>
                <span>€{(insurance.annualPremium / 12).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Propiedad y Contacto */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Propiedad Asegurada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <span>{insurance.propertyAddress}</span>
              </div>
              {insurance.propertyId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/propiedades/${insurance.propertyId}`)}
                >
                  Ver Propiedad
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contacto Aseguradora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{insurance.contactName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{insurance.contactPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{insurance.contactEmail}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">Documentos ({insurance.documents.length})</TabsTrigger>
            <TabsTrigger value="claims">Siniestros ({insurance.claims.length})</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Documentos Adjuntos</CardTitle>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Subir Documento
                </Button>
              </CardHeader>
              <CardContent>
                {insurance.documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay documentos adjuntos
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tamaño</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insurance.documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.type}</Badge>
                          </TableCell>
                          <TableCell>{formatFileSize(doc.size)}</TableCell>
                          <TableCell>
                            {format(new Date(doc.uploadedAt), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => window.open(doc.url)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Historial de Siniestros</CardTitle>
                <Button onClick={() => setClaimDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Reportar Siniestro
                </Button>
              </CardHeader>
              <CardContent>
                {insurance.claims.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay siniestros reportados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Siniestro</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insurance.claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                          <TableCell>{claim.type.replace('_', ' ')}</TableCell>
                          <TableCell>
                            {format(new Date(claim.reportedDate), 'dd/MM/yyyy', {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>€{claim.amount.toLocaleString()}</TableCell>
                          <TableCell>{getClaimStatusBadge(claim.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/seguros/siniestros/${claim.id}`)}
                            >
                              Ver Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notas y Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                {insurance.notes ? (
                  <p className="text-sm">{insurance.notes}</p>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No hay notas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar seguro?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el seguro y todos sus
                datos asociados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Claim Dialog */}
        <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reportar Siniestro</DialogTitle>
              <DialogDescription>
                Complete la información del siniestro para iniciar el proceso de reclamación
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClaim} className="space-y-4">
              <AIDocumentAssistant
                context="seguros"
                variant="inline"
                position="bottom-right"
                onApplyData={(data) => {
                  if (data.tipoSiniestro || data.tipo) {
                    setClaimType(String(data.tipoSiniestro || data.tipo));
                  }
                  if (data.descripcion || data.detalle || data.motivo) {
                    setClaimDescription(String(data.descripcion || data.detalle || data.motivo));
                  }
                  if (data.monto || data.importe || data.amount) {
                    setClaimAmount(String(data.monto || data.importe || data.amount));
                  }
                  toast.success('Datos del siniestro aplicados al formulario');
                }}
              />
              <div className="space-y-2">
                <Label>Tipo de Siniestro *</Label>
                <Select value={claimType} onValueChange={setClaimType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WATER_DAMAGE">Daños por Agua</SelectItem>
                    <SelectItem value="FIRE">Incendio</SelectItem>
                    <SelectItem value="THEFT">Robo</SelectItem>
                    <SelectItem value="VANDALISM">Vandalismo</SelectItem>
                    <SelectItem value="ELECTRICAL">Daños Eléctricos</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Textarea
                  value={claimDescription}
                  onChange={(e) => setClaimDescription(e.target.value)}
                  placeholder="Describa detalladamente el siniestro..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Monto Estimado (€) *</Label>
                <Input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setClaimDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Reportar Siniestro</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
              <DialogDescription>
                Sube pólizas, términos y condiciones u otros documentos relacionados
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <AIDocumentAssistant
                context="seguros"
                variant="inline"
                position="bottom-right"
                onAnalysisComplete={(analysis, file) => {
                  toast.success(`Documento "${file.name}" analizado correctamente`);
                }}
              />
              <div className="space-y-2">
                <Label>Archivo *</Label>
                <Input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formatos permitidos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!uploadFile}>
                  Subir Documento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
