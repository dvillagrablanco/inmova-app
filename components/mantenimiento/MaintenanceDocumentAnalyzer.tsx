'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Wrench,
  Camera,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MaintenanceFormData {
  titulo?: string;
  descripcion?: string;
  prioridad?: string;
  tipo?: string;
}

interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  confidence: number;
  targetField?: string;
}

interface AnalysisResult {
  success: boolean;
  issueType: string;
  urgency: string;
  confidence: number;
  extractedData: Record<string, any>;
  fields: ExtractedField[];
  summary: string;
  warnings: string[];
  recommendations?: string[];
  estimatedCost?: string;
}

interface MaintenanceDocumentAnalyzerProps {
  onDataExtracted: (data: Partial<MaintenanceFormData>) => void;
  currentFormData?: Partial<MaintenanceFormData>;
  className?: string;
}

const PRIORITY_MAP: Record<string, string> = {
  baja: 'baja',
  media: 'media',
  alta: 'alta',
  urgente: 'alta',
  critica: 'alta',
};

const TYPE_MAP: Record<string, string> = {
  fontaneria: 'fontaneria',
  electricidad: 'electricidad',
  climatizacion: 'climatizacion',
  cerrajeria: 'cerrajeria',
  cristaleria: 'cristaleria',
  pintura: 'pintura',
  albanileria: 'albanileria',
  electrodomesticos: 'electrodomesticos',
  general: 'general',
  otros: 'general',
};

export function MaintenanceDocumentAnalyzer({
  onDataExtracted,
  currentFormData,
  className,
}: MaintenanceDocumentAnalyzerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WebP');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    await analyzeDocument(file);
  };

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/maintenance-document-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al analizar la imagen');
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);

      if (result.success && result.fields.length > 0) {
        const allFields = new Set(result.fields.map(f => f.fieldName));
        setSelectedFields(allFields);
        setShowConfirmDialog(true);
      } else if (result.warnings.length > 0) {
        toast.warning(result.warnings[0]);
      }
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast.error(error.message || 'Error al analizar la imagen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleField = (fieldName: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldName)) {
      newSelected.delete(fieldName);
    } else {
      newSelected.add(fieldName);
    }
    setSelectedFields(newSelected);
  };

  const applySelectedData = () => {
    if (!analysisResult) return;

    const dataToApply: Partial<MaintenanceFormData> = {};

    analysisResult.fields.forEach(field => {
      if (selectedFields.has(field.fieldName)) {
        if (field.fieldName === 'prioridad') {
          dataToApply.prioridad = PRIORITY_MAP[field.fieldValue.toLowerCase()] || field.fieldValue;
        } else if (field.fieldName === 'tipo') {
          dataToApply.tipo = TYPE_MAP[field.fieldValue.toLowerCase()] || field.fieldValue;
        } else {
          dataToApply[field.fieldName as keyof MaintenanceFormData] = field.fieldValue;
        }
      }
    });

    onDataExtracted(dataToApply);
    toast.success(`${Object.keys(dataToApply).length} campos actualizados`);
    
    setShowConfirmDialog(false);
    setAnalysisResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const normalized = urgency.toLowerCase();
    if (normalized === 'critica' || normalized === 'urgente') {
      return <Badge className="bg-red-500">🔴 Urgente</Badge>;
    }
    if (normalized === 'alta') {
      return <Badge className="bg-orange-500">🟠 Alta</Badge>;
    }
    if (normalized === 'media') {
      return <Badge className="bg-yellow-500 text-black">🟡 Media</Badge>;
    }
    return <Badge variant="outline">🟢 Baja</Badge>;
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      titulo: 'Título',
      descripcion: 'Descripción',
      prioridad: 'Prioridad',
      tipo: 'Tipo de incidencia',
    };
    return labels[fieldName] || fieldName;
  };

  return (
    <div className={className}>
      <Card className="border-dashed border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Camera className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">Análisis de Incidencia IA</CardTitle>
                <CardDescription>
                  Sube una foto del problema para auto-clasificar la incidencia
                </CardDescription>
              </div>
            </div>
            {selectedFile && (
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedFile ? (
            <div
              className={cn(
                'relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer',
                'hover:border-orange-400 hover:bg-orange-50/50',
                isDragging && 'border-orange-500 bg-orange-100/50',
                'flex flex-col items-center justify-center text-center'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-10 w-10 text-orange-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Sube una foto del problema
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tubería rota, enchufe dañado, humedad, etc.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analizando...</span>
                  </div>
                )}
              </div>

              {analysisResult && !showConfirmDialog && (
                <div className={cn(
                  'p-3 rounded-lg border',
                  analysisResult.urgency === 'alta' || analysisResult.urgency === 'urgente'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                )}>
                  <div className="flex items-center gap-2">
                    {analysisResult.urgency === 'alta' || analysisResult.urgency === 'urgente' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm font-medium">
                      Incidencia: {analysisResult.issueType}
                    </span>
                    {getUrgencyBadge(analysisResult.urgency)}
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">{analysisResult.summary}</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver y aplicar datos
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Análisis de Incidencia
            </DialogTitle>
            <DialogDescription>
              Datos detectados de la imagen. Selecciona los que deseas aplicar.
            </DialogDescription>
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">Tipo de problema:</span>
                  <p className="font-medium">{analysisResult.issueType}</p>
                </div>
                {getUrgencyBadge(analysisResult.urgency)}
              </div>

              {analysisResult.estimatedCost && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    💰 Coste estimado: {analysisResult.estimatedCost}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {analysisResult.fields.map((field, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedFields.has(field.fieldName)
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => toggleField(field.fieldName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center',
                            selectedFields.has(field.fieldName)
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-gray-300'
                          )}
                        >
                          {selectedFields.has(field.fieldName) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-sm">
                          {getFieldLabel(field.fieldName)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 ml-6">
                      <p className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {field.fieldValue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    💡 Recomendaciones:
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.warnings.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Advertencias</span>
                  </div>
                  <ul className="text-xs text-red-600 space-y-1">
                    {analysisResult.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={applySelectedData}
                disabled={selectedFields.size === 0}
                className="w-full gap-2 bg-gradient-to-r from-orange-500 to-yellow-500"
              >
                <CheckCircle className="h-4 w-4" />
                Aplicar {selectedFields.size} Campos
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
