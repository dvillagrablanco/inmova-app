'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Brain,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  FileSpreadsheet,
  Database,
  Building2,
  Users,
  FileSignature,
  Receipt,
  Wrench,
  ArrowRight,
  Wand2,
  Info,
  Table,
  Columns,
  CheckCircle,
  XCircle,
  HelpCircle,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// Tipos para el análisis de importación
interface ColumnAnalysis {
  name: string;
  detectedType: 'string' | 'number' | 'date' | 'email' | 'phone' | 'currency' | 'boolean' | 'unknown';
  sampleValues: string[];
  nullCount: number;
  uniqueCount: number;
  suggestedMapping?: string;
  confidence: number;
}

interface ImportAnalysis {
  fileType: 'csv' | 'excel' | 'json' | 'unknown';
  encoding: string;
  delimiter?: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnAnalysis[];
  suggestedEntityType: string;
  entityTypeConfidence: number;
  entityTypeReasoning: string;
  validationIssues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    column?: string;
    row?: number;
  }>;
  recommendations: string[];
  previewData: Record<string, any>[];
  mappingSuggestions: Record<string, string>;
}

interface AnalyzedFile {
  file: File;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress: number;
  analysis?: ImportAnalysis;
  error?: string;
}

interface ImportAIAssistantProps {
  /** Callback cuando se detecta el tipo de entidad */
  onEntityTypeDetected?: (entityType: string, confidence: number) => void;
  /** Callback cuando el análisis está completo */
  onAnalysisComplete?: (analysis: ImportAnalysis, file: File) => void;
  /** Callback para aplicar las sugerencias de mapeo */
  onApplyMapping?: (mapping: Record<string, string>) => void;
  /** Archivo actualmente seleccionado en la página de importación */
  currentFile?: File | null;
  /** Tipo de entidad seleccionado actualmente */
  currentEntityType?: string;
  /** Si el asistente debe abrirse automáticamente cuando hay un archivo */
  autoOpenOnFile?: boolean;
}

// Mapeo de tipos de entidad a información
const ENTITY_INFO: Record<string, { label: string; icon: React.ElementType; fields: string[] }> = {
  buildings: {
    label: 'Edificios',
    icon: Building2,
    fields: ['nombre', 'direccion', 'ciudad', 'codigo_postal', 'provincia', 'pais', 'num_plantas', 'num_unidades', 'año_construccion'],
  },
  units: {
    label: 'Unidades',
    icon: Building2,
    fields: ['codigo', 'tipo', 'planta', 'superficie', 'habitaciones', 'baños', 'precio_alquiler', 'estado', 'edificio_id'],
  },
  tenants: {
    label: 'Inquilinos',
    icon: Users,
    fields: ['nombre', 'apellidos', 'email', 'telefono', 'dni_nie', 'fecha_nacimiento', 'nacionalidad', 'profesion'],
  },
  contracts: {
    label: 'Contratos',
    icon: FileSignature,
    fields: ['numero_contrato', 'fecha_inicio', 'fecha_fin', 'renta_mensual', 'fianza', 'inquilino_id', 'unidad_id', 'estado'],
  },
  payments: {
    label: 'Pagos',
    icon: Receipt,
    fields: ['fecha_pago', 'importe', 'concepto', 'metodo_pago', 'contrato_id', 'inquilino_id', 'estado'],
  },
  providers: {
    label: 'Proveedores',
    icon: Wrench,
    fields: ['nombre', 'cif', 'email', 'telefono', 'direccion', 'tipo_servicio', 'persona_contacto'],
  },
  expenses: {
    label: 'Gastos',
    icon: Receipt,
    fields: ['fecha', 'importe', 'concepto', 'categoria', 'proveedor_id', 'propiedad_id', 'factura_numero'],
  },
};

export function ImportAIAssistant({
  onEntityTypeDetected,
  onAnalysisComplete,
  onApplyMapping,
  currentFile,
  currentEntityType,
  autoOpenOnFile = true,
}: ImportAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analyzedFiles, setAnalyzedFiles] = useState<AnalyzedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AnalyzedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hasTriggeredAutoOpen = useRef(false);

  // Auto-abrir cuando se selecciona un archivo
  useEffect(() => {
    if (currentFile && autoOpenOnFile && !hasTriggeredAutoOpen.current) {
      hasTriggeredAutoOpen.current = true;
      // Verificar si ya tenemos este archivo analizado
      const existing = analyzedFiles.find(f => f.file.name === currentFile.name && f.file.size === currentFile.size);
      if (!existing) {
        analyzeFile(currentFile);
        setIsOpen(true);
      }
    }
    if (!currentFile) {
      hasTriggeredAutoOpen.current = false;
    }
  }, [currentFile, autoOpenOnFile, analyzedFiles]);

  // Analizar archivo
  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);

    const newAnalyzedFile: AnalyzedFile = {
      file,
      status: 'analyzing',
      progress: 0,
    };

    setAnalyzedFiles(prev => {
      const filtered = prev.filter(f => f.file.name !== file.name);
      return [...filtered, newAnalyzedFile];
    });

    try {
      // Simular progreso inicial
      setAnalyzedFiles(prev =>
        prev.map(f =>
          f.file.name === file.name ? { ...f, progress: 30 } : f
        )
      );

      // Llamar a la API de análisis
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'import');

      const response = await fetch('/api/ai/import-analysis', {
        method: 'POST',
        body: formData,
      });

      setAnalyzedFiles(prev =>
        prev.map(f =>
          f.file.name === file.name ? { ...f, progress: 70 } : f
        )
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al analizar el archivo');
      }

      const analysis: ImportAnalysis = await response.json();

      // Actualizar estado
      setAnalyzedFiles(prev =>
        prev.map(f =>
          f.file.name === file.name
            ? { ...f, status: 'completed', progress: 100, analysis }
            : f
        )
      );

      const completedFile: AnalyzedFile = {
        file,
        status: 'completed',
        progress: 100,
        analysis,
      };

      setSelectedFile(completedFile);

      // Callbacks
      if (onEntityTypeDetected && analysis.suggestedEntityType) {
        onEntityTypeDetected(analysis.suggestedEntityType, analysis.entityTypeConfidence);
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(analysis, file);
      }

      toast.success('Análisis completado', {
        description: `Detectado: ${ENTITY_INFO[analysis.suggestedEntityType]?.label || analysis.suggestedEntityType} (${Math.round(analysis.entityTypeConfidence * 100)}% confianza)`,
      });
    } catch (error: any) {
      console.error('Error analizando archivo:', error);

      setAnalyzedFiles(prev =>
        prev.map(f =>
          f.file.name === file.name
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );

      toast.error('Error al analizar', {
        description: error.message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Aplicar mapeo sugerido
  const handleApplyMapping = () => {
    if (selectedFile?.analysis?.mappingSuggestions && onApplyMapping) {
      onApplyMapping(selectedFile.analysis.mappingSuggestions);
      toast.success('Mapeo aplicado correctamente');
    }
  };

  // Renderizar icono de tipo de dato
  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return <FileText className="h-3 w-3" />;
      case 'number': return <span className="text-xs font-mono">123</span>;
      case 'date': return <span className="text-xs">📅</span>;
      case 'email': return <span className="text-xs">@</span>;
      case 'phone': return <span className="text-xs">📞</span>;
      case 'currency': return <span className="text-xs">€</span>;
      case 'boolean': return <span className="text-xs">✓/✗</span>;
      default: return <HelpCircle className="h-3 w-3" />;
    }
  };

  // Renderizar badge de confianza
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge className="bg-green-500">Alta ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge className="bg-amber-500">Media ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge className="bg-red-500">Baja ({Math.round(confidence * 100)}%)</Badge>;
    }
  };

  // Obtener el análisis actual
  const currentAnalysis = selectedFile?.analysis || 
    analyzedFiles.find(f => f.file.name === currentFile?.name)?.analysis;

  return (
    <>
      {/* Botón flotante del asistente */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-24 md:bottom-6 right-6 z-[60] h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 hover:shadow-2xl hover:scale-105 transition-all"
            size="icon"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Brain className="h-6 w-6 text-white" />
                    {isAnalyzing && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full animate-pulse" />
                    )}
                    {currentAnalysis && !isAnalyzing && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Asistente IA de Importación</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-xl bg-white dark:bg-gray-950 border-l shadow-xl overflow-y-auto">
          <SheetHeader className="space-y-3">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">Asistente de Importación</span>
            </SheetTitle>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1 text-cyan-500" />
                Claude Sonnet 4
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                Análisis Inteligente
              </Badge>
            </div>

            <SheetDescription className="text-sm">
              Analizo tus archivos para detectar el tipo de datos, validar el formato y sugerir el mapeo correcto
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Estado actual */}
            {currentFile ? (
              <Card className="border-cyan-200 bg-cyan-50/50 dark:bg-cyan-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-cyan-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{currentFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(currentFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    {isAnalyzing ? (
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                    ) : currentAnalysis ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => analyzeFile(currentFile)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Wand2 className="h-4 w-4 mr-1" />
                        Analizar
                      </Button>
                    )}
                  </div>

                  {isAnalyzing && (
                    <Progress 
                      value={analyzedFiles.find(f => f.file.name === currentFile.name)?.progress || 0} 
                      className="h-1 mt-3" 
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Sin archivo</AlertTitle>
                <AlertDescription>
                  Selecciona un archivo CSV en la página de importación para que pueda analizarlo
                </AlertDescription>
              </Alert>
            )}

            {/* Resultados del análisis */}
            {currentAnalysis && (
              <>
                {/* Tipo de entidad detectado */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Tipo de Datos Detectado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {ENTITY_INFO[currentAnalysis.suggestedEntityType] && (
                          <>
                            {(() => {
                              const Icon = ENTITY_INFO[currentAnalysis.suggestedEntityType].icon;
                              return <Icon className="h-5 w-5 text-cyan-600" />;
                            })()}
                            <span className="font-medium">
                              {ENTITY_INFO[currentAnalysis.suggestedEntityType].label}
                            </span>
                          </>
                        )}
                      </div>
                      {getConfidenceBadge(currentAnalysis.entityTypeConfidence)}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {currentAnalysis.entityTypeReasoning}
                    </p>

                    {currentEntityType && currentEntityType !== currentAnalysis.suggestedEntityType && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Has seleccionado "{ENTITY_INFO[currentEntityType]?.label || currentEntityType}" pero 
                          el archivo parece contener datos de "{ENTITY_INFO[currentAnalysis.suggestedEntityType]?.label}"
                        </AlertDescription>
                      </Alert>
                    )}

                    {!currentEntityType && onEntityTypeDetected && (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => onEntityTypeDetected(
                          currentAnalysis.suggestedEntityType,
                          currentAnalysis.entityTypeConfidence
                        )}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Aplicar tipo sugerido
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Estadísticas del archivo */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      Estadísticas del Archivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{currentAnalysis.rowCount}</p>
                        <p className="text-xs text-muted-foreground">Filas</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{currentAnalysis.columnCount}</p>
                        <p className="text-xs text-muted-foreground">Columnas</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{currentAnalysis.fileType.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">Formato</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Columnas detectadas */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Columns className="h-4 w-4" />
                      Columnas Detectadas
                    </CardTitle>
                    <CardDescription>
                      {currentAnalysis.columns.length} columnas analizadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {currentAnalysis.columns.map((col, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {getDataTypeIcon(col.detectedType)}
                              <span className="font-medium truncate">{col.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {col.suggestedMapping && (
                                <Badge variant="outline" className="text-xs">
                                  → {col.suggestedMapping}
                                </Badge>
                              )}
                              {col.nullCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {col.nullCount} vacíos
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {Object.keys(currentAnalysis.mappingSuggestions || {}).length > 0 && onApplyMapping && (
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        variant="outline"
                        onClick={handleApplyMapping}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Aplicar mapeo sugerido
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Problemas de validación */}
                {currentAnalysis.validationIssues.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Problemas Detectados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[150px]">
                        <div className="space-y-2">
                          {currentAnalysis.validationIssues.map((issue, idx) => (
                            <div
                              key={idx}
                              className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                                issue.type === 'error'
                                  ? 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'
                                  : issue.type === 'warning'
                                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                                  : 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200'
                              }`}
                            >
                              {issue.type === 'error' ? (
                                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              ) : issue.type === 'warning' ? (
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              ) : (
                                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                              )}
                              <span>{issue.message}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Recomendaciones */}
                {currentAnalysis.recommendations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-500" />
                        Recomendaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-cyan-500" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Vista previa de datos */}
                {currentAnalysis.previewData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Vista Previa (primeras {currentAnalysis.previewData.length} filas)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[120px]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                {Object.keys(currentAnalysis.previewData[0] || {}).slice(0, 5).map((key) => (
                                  <th key={key} className="p-1 text-left font-medium truncate max-w-[100px]">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {currentAnalysis.previewData.slice(0, 3).map((row, idx) => (
                                <tr key={idx} className="border-b">
                                  {Object.values(row).slice(0, 5).map((val: any, vidx) => (
                                    <td key={vidx} className="p-1 truncate max-w-[100px]">
                                      {val ?? '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Acciones cuando no hay análisis */}
            {!currentAnalysis && currentFile && !isAnalyzing && (
              <div className="text-center py-8">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Haz clic en &quot;Analizar&quot; para que examine tu archivo y te ayude con la importación
                </p>
                <Button onClick={() => analyzeFile(currentFile)}>
                  <Brain className="h-4 w-4 mr-2" />
                  Analizar Archivo
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default ImportAIAssistant;
