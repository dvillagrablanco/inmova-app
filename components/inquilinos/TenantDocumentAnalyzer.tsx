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
  User,
  CreditCard,
  Calendar,
  Globe,
  Phone,
  Mail,
  Briefcase,
  ArrowRight,
  RefreshCw,
  Eye,
  X
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

interface TenantFormData {
  nombre: string;
  email: string;
  telefono: string;
  documentoIdentidad: string;
  tipoDocumento: string;
  fechaNacimiento: string;
  nacionalidad: string;
  estadoCivil: string;
  profesion: string;
  ingresosMensuales: string;
}

interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  confidence: number;
  targetField?: string;
}

interface AnalysisResult {
  success: boolean;
  documentType: string;
  confidence: number;
  extractedData: Record<string, string>;
  fields: ExtractedField[];
  summary: string;
  warnings: string[];
}

interface TenantDocumentAnalyzerProps {
  onDataExtracted: (data: Partial<TenantFormData>) => void;
  currentFormData: TenantFormData;
}

const FIELD_LABELS: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  nombre: { label: 'Nombre Completo', icon: User },
  documentoIdentidad: { label: 'Número de Documento', icon: CreditCard },
  tipoDocumento: { label: 'Tipo de Documento', icon: FileText },
  fechaNacimiento: { label: 'Fecha de Nacimiento', icon: Calendar },
  nacionalidad: { label: 'Nacionalidad', icon: Globe },
  telefono: { label: 'Teléfono', icon: Phone },
  email: { label: 'Email', icon: Mail },
  profesion: { label: 'Profesión', icon: Briefcase },
  ingresosMensuales: { label: 'Ingresos Mensuales', icon: Briefcase },
  estadoCivil: { label: 'Estado Civil', icon: User },
};

export function TenantDocumentAnalyzer({ onDataExtracted, currentFormData }: TenantDocumentAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setUploadProgress(10);
    setSelectedFile(file);

    // Crear preview URL si es imagen
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'tenant_registration');

      setUploadProgress(30);

      // Simular progreso mientras analiza
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 80));
      }, 500);

      const response = await fetch('/api/ai/tenant-document-analysis', {
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
        documentType: data.documentType || 'documento_identidad',
        confidence: data.confidence || 0.85,
        extractedData: data.extractedData || {},
        fields: data.fields || [],
        summary: data.summary || 'Documento analizado correctamente',
        warnings: data.warnings || [],
      };

      setAnalysisResult(result);

      // Si hay datos extraídos, mostrar confirmación
      if (Object.keys(result.extractedData).length > 0) {
        setShowConfirmDialog(true);
      } else {
        toast.warning('No se pudieron extraer datos del documento. Verifica que sea un DNI o contrato válido.');
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

    // Validar tamaño
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (máximo 10MB)');
      return;
    }

    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Usa PDF, JPG o PNG.');
      return;
    }

    await analyzeDocument(file);

    // Reset input
    e.target.value = '';
  };

  const handleConfirmData = () => {
    if (!analysisResult?.extractedData) return;

    const extractedData = analysisResult.extractedData;
    const newData: Partial<TenantFormData> = {};

    // Mapear datos extraídos a campos del formulario
    if (extractedData.nombre) newData.nombre = extractedData.nombre;
    if (extractedData.documentoIdentidad) newData.documentoIdentidad = extractedData.documentoIdentidad;
    if (extractedData.tipoDocumento) newData.tipoDocumento = extractedData.tipoDocumento.toLowerCase();
    if (extractedData.fechaNacimiento) newData.fechaNacimiento = extractedData.fechaNacimiento;
    if (extractedData.nacionalidad) newData.nacionalidad = extractedData.nacionalidad;
    if (extractedData.telefono) newData.telefono = extractedData.telefono;
    if (extractedData.email) newData.email = extractedData.email;
    if (extractedData.profesion) newData.profesion = extractedData.profesion;
    if (extractedData.estadoCivil) newData.estadoCivil = extractedData.estadoCivil.toLowerCase();
    if (extractedData.ingresosMensuales) newData.ingresosMensuales = extractedData.ingresosMensuales;

    onDataExtracted(newData);
    setShowConfirmDialog(false);
    
    const fieldsCount = Object.keys(newData).length;
    toast.success(`✅ ${fieldsCount} campo${fieldsCount > 1 ? 's' : ''} rellenado${fieldsCount > 1 ? 's' : ''} automáticamente`);
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
      <Card className="border-dashed border-2 border-violet-200 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-100">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Agente Documental IA</CardTitle>
              <CardDescription>
                Sube un DNI, NIE o contrato para rellenar automáticamente
              </CardDescription>
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
                ? 'border-violet-400 bg-violet-50' 
                : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50/50'
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
                  <Loader2 className="h-10 w-10 mx-auto text-violet-600 animate-spin" />
                  <p className="text-sm font-medium text-violet-700">
                    Analizando documento con IA...
                  </p>
                  <Progress value={uploadProgress} className="h-2 w-48 mx-auto" />
                  <p className="text-xs text-violet-600">
                    Claude está extrayendo información
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <div className="flex justify-center gap-2 mb-3">
                    <CreditCard className="h-8 w-8 text-violet-400" />
                    <FileText className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Sube un <span className="text-violet-600">DNI/NIE</span> o <span className="text-violet-600">contrato</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG (máx. 10MB)
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 gap-2 border-violet-300 text-violet-600 hover:bg-violet-100"
                  >
                    <Upload className="h-4 w-4" />
                    Seleccionar archivo
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resultado del análisis (preview compacto) */}
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
                    Documento analizado correctamente
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(analysisResult.extractedData).length} campos
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
                    Aplicar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tipos de documento soportados */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { icon: CreditCard, label: 'DNI/NIE', color: 'bg-blue-100 text-blue-700' },
              { icon: FileText, label: 'Contrato', color: 'bg-green-100 text-green-700' },
              { icon: User, label: 'Pasaporte', color: 'bg-orange-100 text-orange-700' },
            ].map((item) => (
              <Badge key={item.label} variant="outline" className={`${item.color} border-0 text-xs`}>
                <item.icon className="h-3 w-3 mr-1" />
                {item.label}
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
              <Sparkles className="h-5 w-5 text-violet-600" />
              Datos Extraídos del Documento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Revisa los datos extraídos por la IA. Se rellenarán automáticamente en el formulario.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {analysisResult && (
            <div className="space-y-4">
              {/* Info del documento */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedFile?.name}</span>
                </div>
                <Badge variant={analysisResult.confidence > 0.8 ? "default" : "secondary"}>
                  {Math.round(analysisResult.confidence * 100)}% confianza
                </Badge>
              </div>

              {/* Campos extraídos */}
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {Object.entries(analysisResult.extractedData).map(([key, value]) => {
                    const fieldInfo = FIELD_LABELS[key] || { label: key, icon: FileText };
                    const IconComponent = fieldInfo.icon;
                    const currentValue = currentFormData[key as keyof TenantFormData];
                    const willOverwrite = currentValue && currentValue !== value;

                    return (
                      <div 
                        key={key} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          willOverwrite ? 'bg-amber-50 border-amber-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{fieldInfo.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{value}</span>
                          {willOverwrite && (
                            <p className="text-xs text-amber-600">
                              Reemplazará: {currentValue}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Advertencias */}
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
              className="bg-violet-600 hover:bg-violet-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aplicar Datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Preview */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vista Previa del Documento</DialogTitle>
            <DialogDescription>
              {selectedFile?.name}
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Vista previa del documento" 
                className="w-full rounded-lg border"
              />
            </div>
          )}
          {!previewUrl && (
            <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>Vista previa no disponible para este tipo de archivo</p>
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
              className="bg-violet-600 hover:bg-violet-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Aplicar Datos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TenantDocumentAnalyzer;
