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
  FileImage,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Home,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PropertyFormData {
  tipo?: string;
  superficie?: string;
  superficieUtil?: string;
  habitaciones?: string;
  banos?: string;
  planta?: string;
  orientacion?: string;
  estado?: string;
  rentaMensual?: string;
  descripcion?: string;
  aireAcondicionado?: boolean;
  calefaccion?: boolean;
  terraza?: boolean;
  balcon?: boolean;
  amueblado?: boolean;
}

interface ExtractedField {
  fieldName: string;
  fieldValue: string | number | boolean;
  confidence: number;
  targetField?: string;
}

interface AnalysisResult {
  success: boolean;
  documentType: string;
  confidence: number;
  extractedData: Record<string, any>;
  fields: ExtractedField[];
  summary: string;
  warnings: string[];
  propertyFeatures?: string[];
}

interface PropertyDocumentAnalyzerProps {
  onDataExtracted: (data: Partial<PropertyFormData>) => void;
  currentFormData?: Partial<PropertyFormData>;
  className?: string;
}

const FIELD_MAPPING: Record<string, keyof PropertyFormData> = {
  tipo: 'tipo',
  tipoPropiedad: 'tipo',
  superficie: 'superficie',
  metrosCuadrados: 'superficie',
  superficieUtil: 'superficieUtil',
  habitaciones: 'habitaciones',
  dormitorios: 'habitaciones',
  banos: 'banos',
  aseos: 'banos',
  planta: 'planta',
  piso: 'planta',
  orientacion: 'orientacion',
  estado: 'estado',
  precio: 'rentaMensual',
  renta: 'rentaMensual',
  rentaMensual: 'rentaMensual',
  descripcion: 'descripcion',
  aireAcondicionado: 'aireAcondicionado',
  aire: 'aireAcondicionado',
  calefaccion: 'calefaccion',
  terraza: 'terraza',
  balcon: 'balcon',
  amueblado: 'amueblado',
};

export function PropertyDocumentAnalyzer({
  onDataExtracted,
  currentFormData,
  className,
}: PropertyDocumentAnalyzerProps) {
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
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG, WebP o PDF');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Analyze the document
    await analyzeDocument(file);
  };

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'property');

      const response = await fetch('/api/ai/property-document-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al analizar el documento');
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);

      if (result.success && result.fields.length > 0) {
        // Pre-select all fields
        const allFields = new Set(result.fields.map(f => f.fieldName));
        setSelectedFields(allFields);
        setShowConfirmDialog(true);
      } else if (result.warnings.length > 0) {
        toast.warning(result.warnings[0]);
      }
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast.error(error.message || 'Error al analizar el documento');
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

    const dataToApply: Partial<PropertyFormData> = {};

    analysisResult.fields.forEach(field => {
      if (selectedFields.has(field.fieldName)) {
        const mappedField = FIELD_MAPPING[field.fieldName] || field.targetField;
        if (mappedField) {
          dataToApply[mappedField as keyof PropertyFormData] = field.fieldValue as any;
        }
      }
    });

    onDataExtracted(dataToApply);
    toast.success(`${Object.keys(dataToApply).length} campos actualizados`);
    
    // Reset state
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-500">Alta</Badge>;
    if (confidence >= 0.5) return <Badge className="bg-yellow-500 text-black">Media</Badge>;
    return <Badge variant="outline">Baja</Badge>;
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      tipo: 'Tipo de propiedad',
      superficie: 'Superficie (m²)',
      superficieUtil: 'Superficie útil (m²)',
      habitaciones: 'Habitaciones',
      banos: 'Baños',
      planta: 'Planta',
      orientacion: 'Orientación',
      estado: 'Estado',
      rentaMensual: 'Renta mensual',
      descripcion: 'Descripción',
      aireAcondicionado: 'Aire acondicionado',
      calefaccion: 'Calefacción',
      terraza: 'Terraza',
      balcon: 'Balcón',
      amueblado: 'Amueblado',
    };
    return labels[fieldName] || fieldName;
  };

  return (
    <div className={className}>
      <Card className="border-dashed border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Home className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Análisis de Documentos IA</CardTitle>
                <CardDescription>
                  Sube fotos o documentos de la propiedad para auto-rellenar
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
                'hover:border-purple-400 hover:bg-purple-50/50',
                isDragging && 'border-purple-500 bg-purple-100/50',
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
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-10 w-10 text-purple-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Arrastra o haz clic para subir
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fotos, planos, fichas catastrales, certificados energéticos
              </p>
              <div className="flex flex-wrap gap-1 mt-3 justify-center">
                <Badge variant="outline" className="text-xs">JPG</Badge>
                <Badge variant="outline" className="text-xs">PNG</Badge>
                <Badge variant="outline" className="text-xs">PDF</Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File preview */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analizando...</span>
                  </div>
                )}
              </div>

              {/* Analysis result summary */}
              {analysisResult && !showConfirmDialog && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {analysisResult.fields.length} datos detectados
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">{analysisResult.summary}</p>
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-purple-500" />
              Datos Extraídos de la Propiedad
            </DialogTitle>
            <DialogDescription>
              Selecciona los campos que deseas aplicar al formulario
            </DialogDescription>
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-4 mt-4">
              {/* Document type */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-muted-foreground">Tipo de documento:</span>
                <Badge variant="outline">{analysisResult.documentType}</Badge>
              </div>

              {/* Property features if detected */}
              {analysisResult.propertyFeatures && analysisResult.propertyFeatures.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Características detectadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.propertyFeatures.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted fields */}
              <div className="space-y-2">
                {analysisResult.fields.map((field, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedFields.has(field.fieldName)
                        ? 'bg-purple-50 border-purple-300'
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
                              ? 'bg-purple-500 border-purple-500'
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
                      {getConfidenceBadge(field.confidence)}
                    </div>
                    <div className="mt-2 ml-6">
                      <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                        {typeof field.fieldValue === 'boolean'
                          ? field.fieldValue ? 'Sí' : 'No'
                          : field.fieldValue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Warnings */}
              {analysisResult.warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Advertencias</span>
                  </div>
                  <ul className="text-xs text-yellow-600 space-y-1">
                    {analysisResult.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply button */}
              <Button
                onClick={applySelectedData}
                disabled={selectedFields.size === 0}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-blue-500"
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
