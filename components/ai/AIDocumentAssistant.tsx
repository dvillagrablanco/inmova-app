'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  FileSearch,
  Tag,
  Shield,
  Zap,
  RefreshCw,
  Download,
  Eye,
  ExternalLink,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// Tipos para el análisis de documentos
interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  dataType: string;
  confidence: number;
  targetEntity?: string;
  targetField?: string;
}

interface DocumentAnalysis {
  classification: {
    category: string;
    confidence: number;
    specificType: string;
    reasoning: string;
  };
  ownershipValidation: {
    isOwned: boolean;
    detectedCIF: string | null;
    detectedCompanyName: string | null;
    matchesCIF: boolean;
    matchesName: boolean;
    confidence: number;
    notes: string;
  };
  extractedFields: ExtractedField[];
  summary: string;
  warnings: string[];
  suggestedActions: Array<{
    action: 'create' | 'update' | 'link';
    entity: string;
    description: string;
    data: Record<string, any>;
    confidence: number;
    requiresReview: boolean;
  }>;
  sensitiveData: {
    hasSensitive: boolean;
    types: string[];
  };
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  analysis?: DocumentAnalysis;
  error?: string;
}

interface AIDocumentAssistantProps {
  /** Contexto donde se usa el asistente (contratos, inquilinos, etc.) */
  context: 'contratos' | 'inquilinos' | 'seguros' | 'propiedades' | 'documentos' | 'facturas' | 'proveedores' | 'general';
  /** Callback cuando se completa el análisis de un documento */
  onAnalysisComplete?: (analysis: DocumentAnalysis, file: File) => void;
  /** Callback para aplicar los datos extraídos a un formulario */
  onApplyData?: (data: Record<string, any>) => void;
  /** Si está expandido por defecto */
  defaultOpen?: boolean;
  /** Variante del botón */
  variant?: 'floating' | 'inline' | 'minimal';
  /** Posición del botón flotante */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

// Mapeo de contexto a categorías de documentos relevantes
const contextCategories: Record<string, string[]> = {
  contratos: ['contrato_alquiler', 'inventario', 'fianza', 'dni_nie'],
  inquilinos: ['dni_nie', 'contrato_alquiler', 'recibo_pago', 'fianza'],
  seguros: ['seguro', 'factura', 'recibo_pago'],
  propiedades: ['escritura_propiedad', 'nota_simple', 'certificado_energetico', 'ite_iee', 'licencia', 'plano', 'foto_inmueble'],
  documentos: ['escritura_propiedad', 'contrato_alquiler', 'dni_nie', 'factura', 'seguro', 'certificado_energetico', 'acta_comunidad', 'recibo_pago', 'nota_simple', 'ite_iee', 'licencia', 'fianza', 'inventario', 'foto_inmueble', 'plano', 'otro'],
  facturas: ['factura', 'recibo_pago'],
  proveedores: ['factura', 'contrato', 'licencia'],
  general: ['otro'],
};

// Nombres legibles de categorías
const categoryNames: Record<string, string> = {
  escritura_propiedad: 'Escritura de propiedad',
  contrato_alquiler: 'Contrato de alquiler',
  dni_nie: 'DNI/NIE',
  factura: 'Factura',
  seguro: 'Póliza de seguro',
  certificado_energetico: 'Certificado energético',
  acta_comunidad: 'Acta de comunidad',
  recibo_pago: 'Recibo de pago',
  nota_simple: 'Nota simple',
  ite_iee: 'Informe ITE/IEE',
  licencia: 'Licencia',
  fianza: 'Fianza',
  inventario: 'Inventario',
  foto_inmueble: 'Foto de inmueble',
  plano: 'Plano',
  otro: 'Otro documento',
};

export function AIDocumentAssistant({
  context,
  onAnalysisComplete,
  onApplyData,
  defaultOpen = false,
  variant = 'floating',
  position = 'bottom-right',
}: AIDocumentAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Manejar selección de archivos
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Procesar cada archivo
    newFiles.forEach(uploadedFile => {
      processFile(uploadedFile);
    });
  }, []);

  // Procesar un archivo
  const processFile = async (uploadedFile: UploadedFile) => {
    const { file } = uploadedFile;

    // Actualizar estado a "uploading"
    setUploadedFiles(prev =>
      prev.map(f =>
        f.file === file ? { ...f, status: 'uploading', progress: 20 } : f
      )
    );

    try {
      // Simular lectura del archivo
      await new Promise(resolve => setTimeout(resolve, 500));

      // Actualizar a "analyzing"
      setUploadedFiles(prev =>
        prev.map(f =>
          f.file === file ? { ...f, status: 'analyzing', progress: 50 } : f
        )
      );

      // Llamar a la API de análisis
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', context);

      // Timeout extendido para análisis de documentos (puede tardar hasta 60s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos
      
      const response = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('[AIDocumentAssistant] Response status:', response.status);
      console.log('[AIDocumentAssistant] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIDocumentAssistant] Error response:', errorText);
        throw new Error(`Error al analizar el documento: ${response.status}`);
      }

      const analysisText = await response.text();
      console.log('[AIDocumentAssistant] Response text length:', analysisText.length);
      
      let analysis: DocumentAnalysis;
      try {
        analysis = JSON.parse(analysisText);
        console.log('[AIDocumentAssistant] Parsed analysis:', analysis.classification?.category, analysis.summary?.substring(0, 50));
      } catch (parseError) {
        console.error('[AIDocumentAssistant] JSON parse error:', parseError);
        throw new Error('Error al procesar la respuesta del servidor');
      }

      // Actualizar progreso
      setUploadedFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, status: 'completed', progress: 100, analysis }
            : f
        )
      );

      // Notificar éxito
      toast.success(`Documento analizado: ${categoryNames[analysis.classification.category] || 'Documento'}`, {
        description: analysis.summary.substring(0, 100) + '...',
      });

      // Callback
      if (onAnalysisComplete) {
        onAnalysisComplete(analysis, file);
      }
    } catch (error: any) {
      console.error('Error procesando documento:', error);

      // Manejar timeout/abort específicamente
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'El análisis tardó demasiado. Por favor, intenta de nuevo.';
      }

      // Enviar error al servidor para logging
      try {
        fetch('/api/ai/document-analysis/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: errorMessage,
            originalError: error.message,
            stack: error.stack,
            filename: file.name,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {}

      setUploadedFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      toast.error('Error al analizar documento', {
        description: errorMessage,
      });
    }
  };

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Eliminar archivo
  const removeFile = (file: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== file));
    if (selectedFile?.file === file) {
      setSelectedFile(null);
    }
  };

  // Aplicar datos extraídos
  const applyExtractedData = (analysis: DocumentAnalysis) => {
    if (!onApplyData) {
      toast.info('Función de aplicar datos no configurada');
      return;
    }

    // Convertir campos extraídos a objeto
    const data: Record<string, any> = {};
    analysis.extractedFields.forEach(field => {
      if (field.targetField) {
        data[field.targetField] = field.fieldValue;
      } else {
        data[field.fieldName] = field.fieldValue;
      }
    });

    onApplyData(data);
    toast.success('Datos aplicados al formulario');
  };

  // Renderizar estadísticas de archivos
  const stats = {
    total: uploadedFiles.length,
    completed: uploadedFiles.filter(f => f.status === 'completed').length,
    analyzing: uploadedFiles.filter(f => f.status === 'analyzing' || f.status === 'uploading').length,
    errors: uploadedFiles.filter(f => f.status === 'error').length,
  };

  // Posiciones para el botón flotante
  // NOTA: bottom-36 en móvil para evitar solapamiento con BottomNavigation (64px) y Crisp chat
  // En desktop: bottom-24 para dejar espacio al widget de Crisp
  // z-[60] para estar por encima de otros elementos flotantes
  const positionClasses: Record<string, string> = {
    'bottom-right': 'fixed bottom-36 md:bottom-24 right-6',
    'bottom-left': 'fixed bottom-36 md:bottom-24 left-6',
    'top-right': 'fixed top-20 right-6',
    'top-left': 'fixed top-20 left-6',
  };

  // Botón trigger según variante
  const renderTrigger = () => {
    if (variant === 'minimal') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost">
                <Brain className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Asistente IA de Documentos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (variant === 'inline') {
      return (
        <Button variant="outline" className="gap-2">
          <Brain className="h-4 w-4" />
          Analizar con IA
          {stats.analyzing > 0 && (
            <Badge variant="secondary" className="ml-1">
              {stats.analyzing}
            </Badge>
          )}
        </Button>
      );
    }

    // Floating
    return (
      <div className={`${positionClasses[position]} z-[60]`}>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 hover:shadow-2xl hover:scale-105 transition-all animate-pulse-slow"
        >
          <Brain className="h-6 w-6 text-white" />
          {stats.analyzing > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold">
              {stats.analyzing}
            </span>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {renderTrigger()}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-xl bg-white dark:bg-gray-950 border-l shadow-xl">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">Asistente IA</span>
          </SheetTitle>
          
          {/* Badge de Claude - Separado para mejor visualización móvil */}
          <div className="flex flex-wrap items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-violet-50 bg-white dark:bg-gray-900"
                    onClick={() => window.open('/admin/integraciones-plataforma/ia', '_blank')}
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-violet-500" />
                    Claude 3.5
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border shadow-lg z-[9999]">
                  <p>Powered by Anthropic Claude 3.5 Sonnet</p>
                  <p className="text-xs text-muted-foreground">Clic para configurar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-xs bg-white dark:bg-gray-900"
              onClick={() => window.open('/admin/ai-agents', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver Agentes
            </Button>
          </div>
          
          <SheetDescription className="text-sm">
            Sube documentos para clasificación automática y extracción de datos con IA
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Zona de carga */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                : 'border-muted-foreground/25 hover:border-violet-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Arrastra documentos aquí
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              PDF, imágenes (JPG, PNG) o documentos de texto
            </p>
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Seleccionar archivos
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Tipos de documentos sugeridos */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Documentos recomendados para {context}:
            </p>
            <div className="flex flex-wrap gap-1">
              {contextCategories[context]?.slice(0, 6).map(cat => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {categoryNames[cat]}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Lista de archivos */}
          {uploadedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">
                  Documentos ({stats.completed}/{stats.total} analizados)
                </h4>
                {stats.total > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFiles([])}
                  >
                    Limpiar todo
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {uploadedFiles.map((uploadedFile, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all ${
                        selectedFile?.file === uploadedFile.file
                          ? 'ring-2 ring-violet-500'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedFile(uploadedFile)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Icono de estado */}
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            uploadedFile.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : uploadedFile.status === 'error'
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : 'bg-violet-100 dark:bg-violet-900/30'
                          }`}>
                            {uploadedFile.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : uploadedFile.status === 'error' ? (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            ) : uploadedFile.status === 'analyzing' ? (
                              <Loader2 className="h-5 w-5 text-violet-600 animate-spin" />
                            ) : (
                              <FileText className="h-5 w-5 text-violet-600" />
                            )}
                          </div>

                          {/* Info del archivo */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {uploadedFile.file.name}
                            </p>
                            <div className="flex items-center gap-2">
                              {uploadedFile.status === 'completed' && uploadedFile.analysis && (
                                <Badge variant="outline" className="text-xs">
                                  {categoryNames[uploadedFile.analysis.classification.category] || 'Documento'}
                                </Badge>
                              )}
                              {uploadedFile.status === 'analyzing' && (
                                <span className="text-xs text-muted-foreground">
                                  Analizando...
                                </span>
                              )}
                              {uploadedFile.status === 'error' && (
                                <span className="text-xs text-red-600">
                                  {uploadedFile.error}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Confianza */}
                          {uploadedFile.status === 'completed' && uploadedFile.analysis && (
                            <Badge
                              className={
                                uploadedFile.analysis.classification.confidence >= 0.9
                                  ? 'bg-green-500'
                                  : uploadedFile.analysis.classification.confidence >= 0.7
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }
                            >
                              {Math.round(uploadedFile.analysis.classification.confidence * 100)}%
                            </Badge>
                          )}

                          {/* Eliminar */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(uploadedFile.file);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Barra de progreso */}
                        {(uploadedFile.status === 'uploading' || uploadedFile.status === 'analyzing') && (
                          <Progress value={uploadedFile.progress} className="h-1 mt-2" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Detalle del archivo seleccionado */}
          {selectedFile?.status === 'completed' && selectedFile.analysis && (
            <Card className="border-violet-200 dark:border-violet-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSearch className="h-4 w-4" />
                  Resultados del Análisis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Clasificación */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Tipo:</span>
                  </div>
                  <Badge>
                    {categoryNames[selectedFile.analysis.classification.category]}
                  </Badge>
                </div>

                {/* Validación de propiedad */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Propiedad:</span>
                  </div>
                  <Badge variant={selectedFile.analysis.ownershipValidation.isOwned ? 'default' : 'secondary'}>
                    {selectedFile.analysis.ownershipValidation.isOwned ? 'De la empresa' : 'Terceros'}
                  </Badge>
                </div>

                {/* Resumen */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resumen:</p>
                  <p className="text-sm">{selectedFile.analysis.summary}</p>
                </div>

                {/* Campos extraídos */}
                {selectedFile.analysis.extractedFields.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Datos extraídos ({selectedFile.analysis.extractedFields.length}):
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedFile.analysis.extractedFields.slice(0, 6).map((field, i) => (
                        <div key={i} className="text-xs p-2 bg-muted/50 rounded">
                          <p className="text-muted-foreground">{field.fieldName}</p>
                          <p className="font-medium truncate">{field.fieldValue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advertencias */}
                {selectedFile.analysis.warnings.length > 0 && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Advertencias:
                    </p>
                    {selectedFile.analysis.warnings.map((warning, i) => (
                      <p key={i} className="text-xs text-amber-700 dark:text-amber-300">
                        • {warning}
                      </p>
                    ))}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2">
                  {onApplyData && selectedFile.analysis.extractedFields.length > 0 && (
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500"
                      onClick={() => applyExtractedData(selectedFile.analysis!)}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Aplicar datos
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <SheetFooter className="mt-6">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <span>Powered by Claude 3.5 Sonnet</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
              <a href="/admin/ai-agents" target="_blank">
                <ExternalLink className="h-3 w-3 mr-1" />
                Configurar IA
              </a>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default AIDocumentAssistant;
