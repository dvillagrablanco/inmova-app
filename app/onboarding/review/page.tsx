'use client';

/**
 * Document Review Page
 * 
 * Página para revisar y aprobar los datos extraídos de los documentos
 * antes de aplicarlos al sistema.
 * 
 * @module app/onboarding/review/page
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  FileText,
  Building2,
  Users,
  FileSignature,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Check,
  X,
  Edit2,
  Eye,
  Sparkles,
  Shield,
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface ExtractedData {
  id: string;
  dataType: string;
  fieldName: string;
  fieldValue: string;
  confidence: number;
  isValidated: boolean;
  wasApplied: boolean;
  targetEntity: string | null;
  targetField: string | null;
}

interface DocumentAnalysis {
  id: string;
  summary: string;
  documentType: string;
  overallConfidence: number;
  hasWarnings: boolean;
  warnings: any;
  suggestedActions: any;
}

interface ImportDocument {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: string;
  detectedCategory: string;
  categoryConfidence: number;
  ownershipValidated: boolean;
  matchesCompanyCIF: boolean;
  processingStage: string;
  errorMessage: string | null;
  analyses: DocumentAnalysis[];
  extractedData: ExtractedData[];
}

interface BatchData {
  batch: {
    id: string;
    name: string;
    status: string;
    progress: number;
  };
  documents: ImportDocument[];
  stats: {
    totalFiles: number;
    processed: number;
    awaitingReview: number;
    approved: number;
    failed: number;
    entitiesFound: {
      properties: number;
      tenants: number;
      contracts: number;
    };
    dataAwaitingReview: number;
  };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DocumentReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = searchParams.get('batchId');

  const [loading, setLoading] = useState(true);
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ id: string; value: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Fetch batch data
  useEffect(() => {
    if (!batchId) {
      toast.error('No se especificó el batch');
      router.push('/onboarding/documents');
      return;
    }

    fetchBatchData();
  }, [batchId]);

  const fetchBatchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/onboarding/documents/batch/${batchId}`);
      if (!response.ok) throw new Error('Error al cargar datos');
      const data = await response.json();
      setBatchData(data);
      
      // Auto-select first document
      if (data.documents.length > 0 && !selectedDocId) {
        setSelectedDocId(data.documents[0].id);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve single data field
  const approveField = async (dataId: string) => {
    try {
      const response = await fetch('/api/onboarding/documents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', dataId }),
      });
      if (!response.ok) throw new Error('Error al aprobar');
      toast.success('Campo aprobado');
      await fetchBatchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Reject single data field
  const rejectField = async (dataId: string) => {
    try {
      const response = await fetch('/api/onboarding/documents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', dataId }),
      });
      if (!response.ok) throw new Error('Error al rechazar');
      toast.success('Campo rechazado');
      await fetchBatchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Correct field value
  const correctField = async (dataId: string, newValue: string) => {
    try {
      const response = await fetch('/api/onboarding/documents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'correct', dataId, correctedValue: newValue }),
      });
      if (!response.ok) throw new Error('Error al corregir');
      toast.success('Campo corregido y aprobado');
      setEditingField(null);
      await fetchBatchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Approve all high confidence
  const approveHighConfidence = async () => {
    try {
      const response = await fetch('/api/onboarding/documents/review?bulk=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          action: 'approve_high_confidence',
          confidenceThreshold: 0.8,
        }),
      });
      if (!response.ok) throw new Error('Error en aprobación masiva');
      const data = await response.json();
      toast.success(`${data.updatedCount} campos aprobados`);
      await fetchBatchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Approve document
  const approveDocument = async (documentId: string) => {
    try {
      const response = await fetch('/api/onboarding/documents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', documentId }),
      });
      if (!response.ok) throw new Error('Error al aprobar documento');
      toast.success('Documento aprobado');
      await fetchBatchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Get preview
  const getPreview = async () => {
    try {
      const response = await fetch(`/api/onboarding/documents/apply?batchId=${batchId}`);
      if (!response.ok) throw new Error('Error al obtener preview');
      const data = await response.json();
      setPreviewData(data.preview);
      setShowConfirmDialog(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Apply parametrization
  const applyParametrization = async () => {
    try {
      setIsApplying(true);
      const response = await fetch('/api/onboarding/documents/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, confirmChanges: true }),
      });
      if (!response.ok) throw new Error('Error al aplicar cambios');
      const data = await response.json();
      
      toast.success(data.message);
      setShowConfirmDialog(false);
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard?onboarding=complete');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Get selected document
  const selectedDoc = batchData?.documents.find(d => d.id === selectedDocId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!batchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">No se pudieron cargar los datos</p>
            <Button onClick={() => router.push('/onboarding/documents')}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Revisar datos extraídos
                </h1>
                <p className="text-sm text-gray-500">{batchData.batch.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={fetchBatchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button variant="outline" onClick={approveHighConfidence}>
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-aprobar (+80%)
              </Button>
              <Button
                onClick={getPreview}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aplicar cambios
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            <StatBadge
              icon={<FileText className="w-4 h-4" />}
              label="Documentos"
              value={batchData.stats.totalFiles}
            />
            <StatBadge
              icon={<Building2 className="w-4 h-4" />}
              label="Propiedades"
              value={batchData.stats.entitiesFound.properties}
              color="blue"
            />
            <StatBadge
              icon={<Users className="w-4 h-4" />}
              label="Inquilinos"
              value={batchData.stats.entitiesFound.tenants}
              color="green"
            />
            <StatBadge
              icon={<FileSignature className="w-4 h-4" />}
              label="Contratos"
              value={batchData.stats.entitiesFound.contracts}
              color="purple"
            />
            <div className="flex-1" />
            <Badge variant={batchData.stats.dataAwaitingReview > 0 ? 'destructive' : 'default'}>
              {batchData.stats.dataAwaitingReview} campos pendientes
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Document list */}
          <div className="col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Documentos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {batchData.documents.map((doc) => (
                    <DocumentListItem
                      key={doc.id}
                      document={doc}
                      isSelected={doc.id === selectedDocId}
                      onClick={() => setSelectedDocId(doc.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document details */}
          <div className="col-span-8">
            {selectedDoc ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {selectedDoc.originalFilename}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {getCategoryLabel(selectedDoc.detectedCategory)} •{' '}
                        {(selectedDoc.fileSize / 1024).toFixed(1)} KB
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDoc.ownershipValidated && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <Shield className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                      <StatusBadge status={selectedDoc.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Analysis summary */}
                  {selectedDoc.analyses[0] && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Resumen del análisis
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedDoc.analyses[0].summary}
                      </p>
                      {selectedDoc.analyses[0].hasWarnings && (
                        <Alert className="mt-3" variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Advertencias</AlertTitle>
                          <AlertDescription>
                            {JSON.stringify(selectedDoc.analyses[0].warnings)}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Extracted data table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm text-gray-700">
                        Datos extraídos ({selectedDoc.extractedData.length})
                      </h4>
                      {selectedDoc.status === 'awaiting_review' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveDocument(selectedDoc.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Aprobar todo
                        </Button>
                      )}
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="w-24">Confianza</TableHead>
                          <TableHead className="w-32">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDoc.extractedData.map((data) => (
                          <TableRow key={data.id}>
                            <TableCell>
                              <div>
                                <span className="font-medium">
                                  {formatFieldName(data.fieldName)}
                                </span>
                                {data.targetEntity && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {data.targetEntity}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingField?.id === data.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editingField.value}
                                    onChange={(e) =>
                                      setEditingField({ ...editingField, value: e.target.value })
                                    }
                                    className="h-8"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => correctField(data.id, editingField.value)}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingField(null)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-gray-700">{data.fieldValue}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <ConfidenceBadge confidence={data.confidence} />
                            </TableCell>
                            <TableCell>
                              {data.isValidated ? (
                                <Badge variant="outline" className="bg-green-50">
                                  <Check className="w-3 h-3 mr-1" />
                                  Aprobado
                                </Badge>
                              ) : data.wasApplied ? (
                                <Badge variant="outline">Aplicado</Badge>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => approveField(data.id)}
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      setEditingField({ id: data.id, value: data.fieldValue })
                                    }
                                  >
                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => rejectField(data.id)}
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona un documento para ver sus datos</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar parametrización</DialogTitle>
            <DialogDescription>
              Se aplicarán los siguientes cambios a tu sistema
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {previewData.willCreate.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Se crearán ({previewData.willCreate.length})
                  </h4>
                  <div className="space-y-2">
                    {previewData.willCreate.map((item: any, index: number) => (
                      <div key={index} className="bg-green-50 p-3 rounded text-sm">
                        <span className="font-medium">{item.type}:</span>{' '}
                        {JSON.stringify(item.data).substring(0, 100)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.willUpdate.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Se actualizarán ({previewData.willUpdate.length})
                  </h4>
                  <div className="space-y-2">
                    {previewData.willUpdate.map((item: any, index: number) => (
                      <div key={index} className="bg-blue-50 p-3 rounded text-sm">
                        <span className="font-medium">{item.type}</span> (ID: {item.id})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.conflicts.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Conflictos detectados</AlertTitle>
                  <AlertDescription>
                    {previewData.conflicts.map((c: any, i: number) => (
                      <div key={i}>{c.issue}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={applyParametrization}
              disabled={isApplying}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar y aplicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function StatBadge({
  icon,
  label,
  value,
  color = 'gray',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: 'gray' | 'blue' | 'green' | 'purple';
}) {
  const colors = {
    gray: 'text-gray-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={colors[color]}>{icon}</span>
      <span className="text-sm text-gray-600">{label}:</span>
      <span className={`font-semibold ${colors[color]}`}>{value}</span>
    </div>
  );
}

function DocumentListItem({
  document,
  isSelected,
  onClick,
}: {
  document: ImportDocument;
  isSelected: boolean;
  onClick: () => void;
}) {
  const pendingCount = document.extractedData.filter(d => !d.isValidated && !d.wasApplied).length;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors
        ${isSelected ? 'bg-indigo-50 border-l-2 border-l-indigo-600' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">
            {document.originalFilename}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {getCategoryLabel(document.detectedCategory)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={document.status} size="sm" />
          {pendingCount > 0 && (
            <span className="text-xs text-orange-600">
              {pendingCount} pendientes
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const config: Record<string, { label: string; variant: any; icon: any }> = {
    pending: { label: 'Pendiente', variant: 'outline', icon: Clock },
    processing: { label: 'Procesando', variant: 'outline', icon: Loader2 },
    awaiting_review: { label: 'Por revisar', variant: 'default', icon: Eye },
    approved: { label: 'Aprobado', variant: 'default', icon: CheckCircle2 },
    rejected: { label: 'Rechazado', variant: 'destructive', icon: X },
    failed: { label: 'Error', variant: 'destructive', icon: AlertCircle },
  };

  const { label, variant, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant={variant} className={size === 'sm' ? 'text-xs py-0' : ''}>
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1`} />
      {label}
    </Badge>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  let color = 'bg-red-100 text-red-700';
  
  if (percent >= 80) {
    color = 'bg-green-100 text-green-700';
  } else if (percent >= 60) {
    color = 'bg-yellow-100 text-yellow-700';
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
      {percent}%
    </span>
  );
}

// ============================================================================
// UTILIDADES
// ============================================================================

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    escritura_propiedad: 'Escritura',
    contrato_alquiler: 'Contrato',
    dni_nie: 'DNI/NIE',
    factura: 'Factura',
    seguro: 'Seguro',
    certificado_energetico: 'Cert. Energético',
    acta_comunidad: 'Acta Comunidad',
    recibo_pago: 'Recibo',
    nota_simple: 'Nota Simple',
    ite_iee: 'ITE/IEE',
    licencia: 'Licencia',
    fianza: 'Fianza',
    inventario: 'Inventario',
    foto_inmueble: 'Foto',
    plano: 'Plano',
    otro: 'Otro',
  };
  return labels[category] || category;
}

function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Clock component for pending status
function Clock(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
