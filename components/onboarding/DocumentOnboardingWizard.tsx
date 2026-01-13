'use client';

/**
 * Document Onboarding Wizard
 * 
 * Componente de onboarding que permite a los usuarios subir sus documentos
 * y ver cómo se auto-parametrizan en el sistema.
 * 
 * @module components/onboarding/DocumentOnboardingWizard
 */

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  FileText,
  Building2,
  Users,
  FileSignature,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FolderArchive,
  X,
  Eye,
  ArrowRight,
  RefreshCw,
  Clock,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface DocumentFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

interface BatchStatus {
  id: string;
  status: string;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  stats?: {
    awaitingReview: number;
    approved: number;
    failed: number;
    entitiesFound: {
      properties: number;
      tenants: number;
      contracts: number;
    };
  };
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: any;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'upload',
    title: 'Sube tus documentos',
    description: 'Arrastra o selecciona los documentos de tu empresa',
    icon: Upload,
  },
  {
    id: 'processing',
    title: 'Análisis con IA',
    description: 'Nuestra IA está extrayendo información',
    icon: Sparkles,
  },
  {
    id: 'review',
    title: 'Revisa los datos',
    description: 'Confirma que todo está correcto',
    icon: Eye,
  },
  {
    id: 'complete',
    title: '¡Listo!',
    description: 'Tu empresa está configurada',
    icon: CheckCircle2,
  },
];

const ACCEPTED_FILES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface DocumentOnboardingWizardProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function DocumentOnboardingWizard({ onComplete, onSkip }: DocumentOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: DocumentFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  // Poll batch status
  useEffect(() => {
    if (!batchId || currentStep !== 1) return;

    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/onboarding/documents/batch/${batchId}`);
        if (response.ok) {
          const data = await response.json();
          setBatchStatus({
            id: data.batch.id,
            status: data.batch.status,
            progress: data.batch.progress,
            totalFiles: data.stats.totalFiles,
            processedFiles: data.stats.processed,
            stats: {
              awaitingReview: data.stats.awaitingReview,
              approved: data.stats.approved,
              failed: data.stats.failed,
              entitiesFound: data.stats.entitiesFound,
            },
          });

          // Si el procesamiento terminó, avanzar al siguiente paso
          if (data.batch.status === 'awaiting_review' || data.batch.status === 'approved') {
            setCurrentStep(2);
            setIsPolling(false);
            clearInterval(interval);
          } else if (data.batch.status === 'failed') {
            toast.error('Hubo un error procesando algunos documentos');
            setIsPolling(false);
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error polling batch status:', error);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [batchId, currentStep]);

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Selecciona al menos un archivo');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append('files', f.file);
      });
      formData.append('options', JSON.stringify({
        batchName: `Onboarding ${new Date().toLocaleDateString('es-ES')}`,
        autoApprove: false,
        confidenceThreshold: 0.8,
      }));

      // Update all files to uploading
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'uploading' as const, progress: 50 }))
      );

      const response = await fetch('/api/onboarding/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir archivos');
      }

      const data = await response.json();
      setBatchId(data.batchId);

      // Update files status
      setFiles((prev) =>
        prev.map((f) => {
          const result = data.results.find((r: any) => r.originalFilename === f.file.name);
          return {
            ...f,
            status: result?.status === 'success' ? 'processing' : 'error',
            progress: 100,
            error: result?.error,
            result,
          };
        })
      );

      toast.success(`${data.successfulFiles} archivos subidos correctamente`);
      setCurrentStep(1);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir archivos');
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error' as const, error: 'Error de conexión' }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Go to review page
  const goToReview = () => {
    if (batchId) {
      window.location.href = `/onboarding/review?batchId=${batchId}`;
    }
  };

  // Skip onboarding
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Onboarding con IA</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configura tu empresa automáticamente
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Sube tus documentos (contratos, escrituras, facturas...) y nuestra IA
            configurará todo por ti en segundos.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isActive ? 'bg-indigo-600 text-white scale-110' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      isActive ? 'text-indigo-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-all ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors">
                <CardContent className="p-8">
                  {/* Dropzone */}
                  <div
                    {...getRootProps()}
                    className={`
                      cursor-pointer rounded-lg p-12 text-center transition-all
                      ${isDragActive ? 'bg-indigo-50 border-indigo-400' : 'bg-gray-50'}
                    `}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        {isDragActive ? (
                          <FolderArchive className="w-8 h-8 text-indigo-600" />
                        ) : (
                          <Upload className="w-8 h-8 text-indigo-600" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {isDragActive
                          ? '¡Suelta los archivos aquí!'
                          : 'Arrastra tus documentos aquí'}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        o haz clic para seleccionar archivos
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline">PDF</Badge>
                        <Badge variant="outline">Word</Badge>
                        <Badge variant="outline">Imágenes</Badge>
                        <Badge variant="outline" className="bg-indigo-50">
                          ZIP
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Document types info */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DocumentTypeCard
                      icon={<FileSignature className="w-5 h-5" />}
                      title="Contratos"
                      description="Alquiler, compraventa"
                    />
                    <DocumentTypeCard
                      icon={<Building2 className="w-5 h-5" />}
                      title="Escrituras"
                      description="Propiedades, notas simples"
                    />
                    <DocumentTypeCard
                      icon={<Users className="w-5 h-5" />}
                      title="DNIs"
                      description="Inquilinos, propietarios"
                    />
                    <DocumentTypeCard
                      icon={<FileText className="w-5 h-5" />}
                      title="Facturas"
                      description="Proveedores, seguros"
                    />
                  </div>

                  {/* File list */}
                  {files.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h4 className="font-medium text-gray-900">
                        Archivos seleccionados ({files.length})
                      </h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {files.map((file) => (
                          <FileItem
                            key={file.id}
                            file={file}
                            onRemove={() => removeFile(file.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between bg-gray-50 p-4">
                  <Button variant="ghost" onClick={handleSkip}>
                    Configurar manualmente
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        Analizar documentos
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                  </div>
                  <CardTitle>Analizando tus documentos...</CardTitle>
                  <CardDescription>
                    Nuestra IA está extrayendo información de tus documentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium">
                        {batchStatus?.progress || 0}%
                      </span>
                    </div>
                    <Progress value={batchStatus?.progress || 0} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">
                      {batchStatus?.processedFiles || 0} de {batchStatus?.totalFiles || files.length} archivos procesados
                    </p>
                  </div>

                  {/* What's happening */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <ProcessingStep
                      icon={<FileText className="w-4 h-4" />}
                      text="Extrayendo texto de documentos"
                      status={batchStatus?.progress && batchStatus.progress > 20 ? 'done' : 'active'}
                    />
                    <ProcessingStep
                      icon={<Sparkles className="w-4 h-4" />}
                      text="Analizando con inteligencia artificial"
                      status={batchStatus?.progress && batchStatus.progress > 50 ? 'done' : batchStatus?.progress && batchStatus.progress > 20 ? 'active' : 'pending'}
                    />
                    <ProcessingStep
                      icon={<Shield className="w-4 h-4" />}
                      text="Validando datos de tu empresa"
                      status={batchStatus?.progress && batchStatus.progress > 80 ? 'done' : batchStatus?.progress && batchStatus.progress > 50 ? 'active' : 'pending'}
                    />
                    <ProcessingStep
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      text="Preparando parametrización"
                      status={batchStatus?.progress === 100 ? 'done' : batchStatus?.progress && batchStatus.progress > 80 ? 'active' : 'pending'}
                    />
                  </div>

                  {/* Found entities preview */}
                  {batchStatus?.stats?.entitiesFound && (
                    <div className="grid grid-cols-3 gap-4">
                      <EntityPreview
                        icon={<Building2 className="w-5 h-5" />}
                        label="Propiedades"
                        count={batchStatus.stats.entitiesFound.properties}
                      />
                      <EntityPreview
                        icon={<Users className="w-5 h-5" />}
                        label="Inquilinos"
                        count={batchStatus.stats.entitiesFound.tenants}
                      />
                      <EntityPreview
                        icon={<FileSignature className="w-5 h-5" />}
                        label="Contratos"
                        count={batchStatus.stats.entitiesFound.contracts}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle>¡Análisis completado!</CardTitle>
                  <CardDescription>
                    Hemos encontrado información en tus documentos. Revísala antes de aplicar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  {batchStatus?.stats && (
                    <div className="grid grid-cols-3 gap-4">
                      <SummaryCard
                        icon={<Building2 className="w-6 h-6 text-blue-600" />}
                        label="Propiedades"
                        count={batchStatus.stats.entitiesFound.properties}
                        bgColor="bg-blue-50"
                      />
                      <SummaryCard
                        icon={<Users className="w-6 h-6 text-green-600" />}
                        label="Inquilinos"
                        count={batchStatus.stats.entitiesFound.tenants}
                        bgColor="bg-green-50"
                      />
                      <SummaryCard
                        icon={<FileSignature className="w-6 h-6 text-purple-600" />}
                        label="Contratos"
                        count={batchStatus.stats.entitiesFound.contracts}
                        bgColor="bg-purple-50"
                      />
                    </div>
                  )}

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Validación de documentos</AlertTitle>
                    <AlertDescription>
                      Hemos verificado que los documentos pertenecen a tu empresa.
                      Revisa los datos antes de confirmar.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>
                    Subir más documentos
                  </Button>
                  <Button
                    onClick={goToReview}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Revisar y aplicar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Datos encriptados</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Proceso en segundos</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>IA de última generación</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function DocumentTypeCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-indigo-600">{icon}</div>
      <div>
        <p className="font-medium text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function FileItem({ file, onRemove }: { file: DocumentFile; onRemove: () => void }) {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-white border rounded-lg">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm text-gray-700 truncate max-w-[200px]">
          {file.file.name}
        </span>
        <span className="text-xs text-gray-400">
          {(file.file.size / 1024 / 1024).toFixed(2)} MB
        </span>
      </div>
      {file.status === 'pending' && (
        <button
          onClick={onRemove}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
      {file.error && (
        <span className="text-xs text-red-600">{file.error}</span>
      )}
    </div>
  );
}

function ProcessingStep({ icon, text, status }: { icon: React.ReactNode; text: string; status: 'pending' | 'active' | 'done' }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          ${status === 'done' ? 'bg-green-100 text-green-600' : ''}
          ${status === 'active' ? 'bg-indigo-100 text-indigo-600' : ''}
          ${status === 'pending' ? 'bg-gray-100 text-gray-400' : ''}
        `}
      >
        {status === 'active' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : status === 'done' ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : (
          icon
        )}
      </div>
      <span
        className={`text-sm ${
          status === 'done' ? 'text-green-700' : status === 'active' ? 'text-indigo-700' : 'text-gray-500'
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function EntityPreview({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <div className="text-indigo-600 flex justify-center mb-1">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function SummaryCard({ icon, label, count, bgColor }: { icon: React.ReactNode; label: string; count: number; bgColor: string }) {
  return (
    <div className={`p-4 rounded-lg ${bgColor}`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-3xl font-bold text-center text-gray-900">{count}</p>
      <p className="text-sm text-center text-gray-600">{label}</p>
    </div>
  );
}

export default DocumentOnboardingWizard;
