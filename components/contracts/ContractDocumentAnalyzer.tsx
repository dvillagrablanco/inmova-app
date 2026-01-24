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
  ArrowRight,
  Eye,
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

interface ContractFormData {
  unitId?: string;
  tenantId?: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: string;
  deposito: string;
  tipo: string;
}

interface ExtractedContractData {
  fechaInicio?: string;
  fechaFin?: string;
  rentaMensual?: string;
  deposito?: string;
  tipo?: string;
  arrendadorNombre?: string;
  arrendadorDNI?: string;
  arrendatarioNombre?: string;
  arrendatarioDNI?: string;
  arrendatarioEmail?: string;
  arrendatarioTelefono?: string;
  direccionInmueble?: string;
  superficieM2?: string;
  clausulasEspeciales?: string;
}

interface AnalysisResult {
  success: boolean;
  documentType: string;
  confidence: number;
  extractedData: ExtractedContractData;
  summary: string;
  warnings: string[];
}

interface ContractDocumentAnalyzerProps {
  onDataExtracted: (data: Partial<ContractFormData>, tenantData?: any) => void;
  currentFormData: ContractFormData;
}

const FIELD_LABELS: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  fechaInicio: { label: 'Fecha de Inicio', icon: Calendar },
  fechaFin: { label: 'Fecha de Fin', icon: Calendar },
  rentaMensual: { label: 'Renta Mensual', icon: Euro },
  deposito: { label: 'Depósito/Fianza', icon: Euro },
  tipo: { label: 'Tipo de Contrato', icon: FileText },
  arrendadorNombre: { label: 'Nombre Arrendador', icon: User },
  arrendadorDNI: { label: 'DNI Arrendador', icon: FileText },
  arrendatarioNombre: { label: 'Nombre Arrendatario', icon: User },
  arrendatarioDNI: { label: 'DNI Arrendatario', icon: FileText },
  arrendatarioEmail: { label: 'Email Arrendatario', icon: User },
  arrendatarioTelefono: { label: 'Teléfono Arrendatario', icon: User },
  direccionInmueble: { label: 'Dirección Inmueble', icon: Building },
  superficieM2: { label: 'Superficie (m²)', icon: Building },
  clausulasEspeciales: { label: 'Cláusulas Especiales', icon: FileText },
};

export function ContractDocumentAnalyzer({ onDataExtracted, currentFormData }: ContractDocumentAnalyzerProps) {
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

    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'contract');

      setUploadProgress(30);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 80));
      }, 500);

      const response = await fetch('/api/ai/contract-document-analysis', {
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
        documentType: data.documentType || 'contrato',
        confidence: data.confidence || 0.85,
        extractedData: data.extractedData || {},
        summary: data.summary || 'Contrato analizado correctamente',
        warnings: data.warnings || [],
      };

      setAnalysisResult(result);

      if (Object.keys(result.extractedData).length > 0) {
        setShowConfirmDialog(true);
      } else {
        toast.warning('No se pudieron extraer datos del documento. Verifica que sea un contrato válido.');
      }

    } catch (error: any) {
      logger.error('Error analizando contrato:', error);
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

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Usa PDF, JPG o PNG.');
      return;
    }

    await analyzeDocument(file);
    e.target.value = '';
  };

  const handleConfirmData = () => {
    if (!analysisResult?.extractedData) return;

    const extracted = analysisResult.extractedData;
    const contractData: Partial<ContractFormData> = {};

    // Mapear datos del contrato
    if (extracted.fechaInicio) contractData.fechaInicio = extracted.fechaInicio;
    if (extracted.fechaFin) contractData.fechaFin = extracted.fechaFin;
    if (extracted.rentaMensual) contractData.rentaMensual = extracted.rentaMensual.replace(/[^0-9.,]/g, '').replace(',', '.');
    if (extracted.deposito) contractData.deposito = extracted.deposito.replace(/[^0-9.,]/g, '').replace(',', '.');
    if (extracted.tipo) contractData.tipo = extracted.tipo.toLowerCase();

    // Datos del inquilino (para crear si no existe)
    const tenantData = {
      nombre: extracted.arrendatarioNombre,
      documentoIdentidad: extracted.arrendatarioDNI,
      email: extracted.arrendatarioEmail,
      telefono: extracted.arrendatarioTelefono,
    };

    onDataExtracted(contractData, tenantData);
    setShowConfirmDialog(false);
    
    const fieldsCount = Object.keys(contractData).length;
    toast.success(`✅ ${fieldsCount} campo${fieldsCount > 1 ? 's' : ''} del contrato rellenado${fieldsCount > 1 ? 's' : ''} automáticamente`);
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
      <Card className="border-dashed border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Agente de Contratos IA</CardTitle>
              <CardDescription>
                Sube un contrato para extraer automáticamente fechas, renta y datos
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
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
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
                  <Loader2 className="h-10 w-10 mx-auto text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-blue-700">
                    Analizando contrato con IA...
                  </p>
                  <Progress value={uploadProgress} className="h-2 w-48 mx-auto" />
                  <p className="text-xs text-blue-600">
                    Extrayendo fechas, importes y partes
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <FileText className="h-10 w-10 mx-auto text-blue-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    Sube un <span className="text-blue-600">contrato de arrendamiento</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG (máx. 10MB)
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 gap-2 border-blue-300 text-blue-600 hover:bg-blue-100"
                  >
                    <Upload className="h-4 w-4" />
                    Seleccionar contrato
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
                    Contrato analizado
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(analysisResult.extractedData).length} datos
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

          {/* Info de datos que extrae */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { icon: Calendar, label: 'Fechas', color: 'bg-blue-100 text-blue-700' },
              { icon: Euro, label: 'Importes', color: 'bg-green-100 text-green-700' },
              { icon: User, label: 'Partes', color: 'bg-orange-100 text-orange-700' },
              { icon: Building, label: 'Inmueble', color: 'bg-purple-100 text-purple-700' },
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
              <Sparkles className="h-5 w-5 text-blue-600" />
              Datos Extraídos del Contrato
            </AlertDialogTitle>
            <AlertDialogDescription>
              Revisa los datos extraídos. Se aplicarán al formulario.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {analysisResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedFile?.name}</span>
                </div>
                <Badge variant={analysisResult.confidence > 0.8 ? "default" : "secondary"}>
                  {Math.round(analysisResult.confidence * 100)}% confianza
                </Badge>
              </div>

              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {Object.entries(analysisResult.extractedData).map(([key, value]) => {
                    if (!value) return null;
                    const fieldInfo = FIELD_LABELS[key] || { label: key, icon: FileText };
                    const IconComponent = fieldInfo.icon;

                    return (
                      <div 
                        key={key} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{fieldInfo.label}</span>
                        </div>
                        <span className="text-sm font-medium text-right max-w-[200px] truncate">
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

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
              className="bg-blue-600 hover:bg-blue-700"
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
            <DialogTitle>Vista Previa del Contrato</DialogTitle>
            <DialogDescription>{selectedFile?.name}</DialogDescription>
          </DialogHeader>
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa" className="w-full rounded-lg border" />
          ) : (
            <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>Vista previa no disponible para PDF</p>
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
              className="bg-blue-600 hover:bg-blue-700"
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

export default ContractDocumentAnalyzer;
