'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Euro,
  Building,
  User,
  Shield,
  Zap,
  ArrowRight,
  Eye,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import logger from '@/lib/logger';

interface ExtractedDocumentData {
  tipo?: string;
  nombre?: string;
  fechaVencimiento?: string;
  fechaEmision?: string;
  // Para contratos
  rentaMensual?: string;
  deposito?: string;
  fechaInicio?: string;
  fechaFin?: string;
  // Para DNIs
  numeroDocumento?: string;
  titular?: string;
  nacionalidad?: string;
  // Para seguros
  poliza?: string;
  cobertura?: string;
  prima?: string;
  aseguradora?: string;
  // Para certificados
  calificacion?: string;
  registroNumero?: string;
  // Para facturas
  proveedor?: string;
  importe?: string;
  concepto?: string;
  // Genérico
  entidadRelacionada?: string;
  resumen?: string;
}

interface AnalysisResult {
  success: boolean;
  documentType: string;
  confidence: number;
  extractedData: ExtractedDocumentData;
  suggestedCategory: string;
  summary: string;
  warnings: string[];
}

interface DocumentUploadAnalyzerProps {
  onAnalysisComplete: (data: {
    tipo: string;
    nombre: string;
    fechaVencimiento?: string;
    extractedData: ExtractedDocumentData;
  }) => void;
  allowedTypes?: string[];
  context?: 'general' | 'garantias' | 'contratos' | 'inquilinos';
}

const DOCUMENT_TYPES: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  contrato: { label: 'Contrato', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  dni: { label: 'DNI/NIE', icon: User, color: 'bg-green-100 text-green-700' },
  seguro: { label: 'Seguro', icon: Shield, color: 'bg-red-100 text-red-700' },
  certificado_energetico: { label: 'Certificado Energético', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  factura: { label: 'Factura', icon: Euro, color: 'bg-purple-100 text-purple-700' },
  nomina: { label: 'Nómina', icon: Euro, color: 'bg-indigo-100 text-indigo-700' },
  ite: { label: 'ITE/IEE', icon: Building, color: 'bg-orange-100 text-orange-700' },
  garantia: { label: 'Garantía/Aval', icon: Shield, color: 'bg-pink-100 text-pink-700' },
  otro: { label: 'Otro', icon: FileText, color: 'bg-gray-100 text-gray-700' },
};

const FIELD_LABELS: Record<string, string> = {
  tipo: 'Tipo de Documento',
  nombre: 'Nombre Sugerido',
  fechaVencimiento: 'Fecha de Vencimiento',
  fechaEmision: 'Fecha de Emisión',
  rentaMensual: 'Renta Mensual',
  deposito: 'Depósito',
  fechaInicio: 'Fecha Inicio',
  fechaFin: 'Fecha Fin',
  numeroDocumento: 'Número de Documento',
  titular: 'Titular',
  nacionalidad: 'Nacionalidad',
  poliza: 'Número de Póliza',
  cobertura: 'Cobertura',
  prima: 'Prima',
  aseguradora: 'Aseguradora',
  calificacion: 'Calificación',
  registroNumero: 'Nº Registro',
  proveedor: 'Proveedor',
  importe: 'Importe',
  concepto: 'Concepto',
  entidadRelacionada: 'Entidad Relacionada',
  resumen: 'Resumen',
};

export function DocumentUploadAnalyzer({ 
  onAnalysisComplete, 
  allowedTypes,
  context = 'general' 
}: DocumentUploadAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getContextConfig = () => {
    switch (context) {
      case 'garantias':
        return {
          title: 'Agente de Garantías IA',
          description: 'Sube avales, seguros de caución o garantías bancarias',
          color: 'from-pink-50/50 to-rose-50/50',
          borderColor: 'border-pink-200',
          accentColor: 'pink',
        };
      case 'contratos':
        return {
          title: 'Agente de Contratos IA',
          description: 'Sube contratos para extraer fechas, importes y partes',
          color: 'from-blue-50/50 to-indigo-50/50',
          borderColor: 'border-blue-200',
          accentColor: 'blue',
        };
      case 'inquilinos':
        return {
          title: 'Agente de Inquilinos IA',
          description: 'Sube DNI o documentación de inquilinos',
          color: 'from-violet-50/50 to-purple-50/50',
          borderColor: 'border-violet-200',
          accentColor: 'violet',
        };
      default:
        return {
          title: 'Agente Documental IA',
          description: 'Sube cualquier documento para clasificarlo automáticamente',
          color: 'from-emerald-50/50 to-teal-50/50',
          borderColor: 'border-emerald-200',
          accentColor: 'emerald',
        };
    }
  };

  const config = getContextConfig();

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setUploadProgress(10);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', context);

      setUploadProgress(30);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 80));
      }, 500);

      const response = await fetch('/api/ai/general-document-analysis', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(90);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al analizar el documento');
      }

      setUploadProgress(100);

      const result: AnalysisResult = {
        success: true,
        documentType: data.documentType || 'otro',
        confidence: data.confidence || 0.7,
        extractedData: data.extractedData || {},
        suggestedCategory: data.suggestedCategory || 'otro',
        summary: data.summary || 'Documento analizado',
        warnings: data.warnings || [],
      };

      setAnalysisResult(result);

      if (Object.keys(result.extractedData).length > 0) {
        setShowConfirmDialog(true);
      } else {
        toast.warning('No se pudieron extraer datos del documento.');
      }

    } catch (error: any) {
      logger.error('Error analizando documento:', error);
      toast.error(error.message || 'Error al analizar el documento');
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (máximo 10MB)');
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Usa PDF, JPG o PNG.');
      return;
    }

    await analyzeDocument(file);
    e.target.value = '';
  };

  const handleConfirmData = () => {
    if (!analysisResult?.extractedData) return;

    const extracted = analysisResult.extractedData;

    onAnalysisComplete({
      tipo: analysisResult.suggestedCategory,
      nombre: extracted.nombre || selectedFile?.name || 'Documento',
      fechaVencimiento: extracted.fechaVencimiento,
      extractedData: extracted,
    });

    setShowConfirmDialog(false);
    toast.success(`✅ Documento clasificado como ${DOCUMENT_TYPES[analysisResult.suggestedCategory]?.label || 'Otro'}`);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setAnalysisResult(null);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <>
      <Card className={`border-dashed border-2 ${config.borderColor} bg-gradient-to-br ${config.color}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-${config.accentColor}-100`}>
              <Sparkles className={`h-5 w-5 text-${config.accentColor}-600`} />
            </div>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zona de subida */}
          <div 
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center 
              transition-all duration-300 cursor-pointer
              ${isAnalyzing 
                ? `border-${config.accentColor}-400 bg-${config.accentColor}-50` 
                : `border-gray-300 hover:border-${config.accentColor}-400 hover:bg-${config.accentColor}-50/50`
              }
            `}
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={isAnalyzing}
            />

            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-3"
                >
                  <Loader2 className={`h-10 w-10 mx-auto text-${config.accentColor}-600 animate-spin`} />
                  <p className={`text-sm font-medium text-${config.accentColor}-700`}>
                    Analizando documento con IA...
                  </p>
                  <Progress value={uploadProgress} className="h-2 w-48 mx-auto" />
                  <p className={`text-xs text-${config.accentColor}-600`}>
                    Clasificando y extrayendo datos
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <FileText className={`h-10 w-10 mx-auto text-${config.accentColor}-400 mb-3`} />
                  <p className="text-sm font-medium text-gray-700">
                    Arrastra o selecciona un documento
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG (máx. 10MB)
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`mt-3 gap-2 border-${config.accentColor}-300 text-${config.accentColor}-600 hover:bg-${config.accentColor}-100`}
                  >
                    <Upload className="h-4 w-4" />
                    Seleccionar archivo
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resultado del análisis */}
          <AnimatePresence>
            {analysisResult && !showConfirmDialog && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Clasificado: {DOCUMENT_TYPES[analysisResult.suggestedCategory]?.label || 'Otro'}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(analysisResult.confidence * 100)}%
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreviewDialog(true)}
                    className="text-green-700 hover:bg-green-100"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmDialog(true)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Usar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tipos de documentos que reconoce */}
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(DOCUMENT_TYPES).slice(0, 6).map(([key, value]) => (
              <Badge key={key} variant="outline" className={`${value.color} border-0 text-xs`}>
                <value.icon className="h-3 w-3 mr-1" />
                {value.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              Documento Analizado
            </AlertDialogTitle>
            <AlertDialogDescription>
              Revisa la clasificación y datos extraídos.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {analysisResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedFile?.name}</span>
                </div>
                <Badge className={DOCUMENT_TYPES[analysisResult.suggestedCategory]?.color || ''}>
                  {DOCUMENT_TYPES[analysisResult.suggestedCategory]?.label || 'Otro'}
                </Badge>
              </div>

              <ScrollArea className="max-h-[250px]">
                <div className="space-y-2">
                  {Object.entries(analysisResult.extractedData).map(([key, value]) => {
                    if (!value || key === 'resumen') return null;
                    return (
                      <div 
                        key={key} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-white"
                      >
                        <span className="text-sm text-muted-foreground">
                          {FIELD_LABELS[key] || key}
                        </span>
                        <span className="text-sm font-medium text-right max-w-[200px] truncate">
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {analysisResult.summary && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">{analysisResult.summary}</p>
                </div>
              )}

              {analysisResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      {analysisResult.warnings.map((warning, i) => (
                        <p key={i}>{warning}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmData}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Usar Datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Preview */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
            <DialogDescription>{selectedFile?.name}</DialogDescription>
          </DialogHeader>
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa" className="w-full rounded-lg border" />
          ) : (
            <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>Vista previa no disponible</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cerrar
            </Button>
            <Button 
              onClick={() => {
                setShowPreviewDialog(false);
                setShowConfirmDialog(true);
              }}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Usar Datos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DocumentUploadAnalyzer;
