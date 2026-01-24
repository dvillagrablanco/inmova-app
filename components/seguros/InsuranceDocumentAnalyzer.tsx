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
  Shield,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InsuranceFormData {
  tipoSeguro?: string;
  numeroPoliza?: string;
  aseguradora?: string;
  fechaInicio?: string;
  fechaFin?: string;
  primaAnual?: string;
  cobertura?: string;
  franquicia?: string;
  buildingId?: string;
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
  extractedData: Record<string, any>;
  fields: ExtractedField[];
  summary: string;
  warnings: string[];
  coverageDetails?: string[];
}

interface InsuranceDocumentAnalyzerProps {
  onDataExtracted: (data: Partial<InsuranceFormData>) => void;
  currentFormData?: Partial<InsuranceFormData>;
  className?: string;
}

const FIELD_MAPPING: Record<string, keyof InsuranceFormData> = {
  tipoSeguro: 'tipoSeguro',
  tipo: 'tipoSeguro',
  numeroPoliza: 'numeroPoliza',
  poliza: 'numeroPoliza',
  aseguradora: 'aseguradora',
  compania: 'aseguradora',
  fechaInicio: 'fechaInicio',
  fechaEfecto: 'fechaInicio',
  fechaFin: 'fechaFin',
  fechaVencimiento: 'fechaFin',
  primaAnual: 'primaAnual',
  prima: 'primaAnual',
  cobertura: 'cobertura',
  capitalAsegurado: 'cobertura',
  franquicia: 'franquicia',
};

export function InsuranceDocumentAnalyzer({
  onDataExtracted,
  currentFormData,
  className,
}: InsuranceDocumentAnalyzerProps) {
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
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG, WebP o PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    await analyzeDocument(file);
  };

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/insurance-document-analysis', {
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

    const dataToApply: Partial<InsuranceFormData> = {};

    analysisResult.fields.forEach(field => {
      if (selectedFields.has(field.fieldName)) {
        const mappedField = FIELD_MAPPING[field.fieldName] || field.targetField;
        if (mappedField) {
          dataToApply[mappedField as keyof InsuranceFormData] = field.fieldValue;
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-500">Alta</Badge>;
    if (confidence >= 0.5) return <Badge className="bg-yellow-500 text-black">Media</Badge>;
    return <Badge variant="outline">Baja</Badge>;
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      tipoSeguro: 'Tipo de seguro',
      numeroPoliza: 'Número de póliza',
      aseguradora: 'Aseguradora',
      fechaInicio: 'Fecha de inicio',
      fechaFin: 'Fecha de vencimiento',
      primaAnual: 'Prima anual',
      cobertura: 'Capital asegurado',
      franquicia: 'Franquicia',
    };
    return labels[fieldName] || fieldName;
  };

  return (
    <div className={className}>
      <Card className="border-dashed border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">Análisis de Póliza IA</CardTitle>
                <CardDescription>
                  Sube la póliza de seguro para extraer datos automáticamente
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
                'hover:border-emerald-400 hover:bg-emerald-50/50',
                isDragging && 'border-emerald-500 bg-emerald-100/50',
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
              <Upload className="h-10 w-10 text-emerald-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Sube la póliza de seguro
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Condiciones generales, recibo, certificado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analizando...</span>
                  </div>
                )}
              </div>

              {analysisResult && !showConfirmDialog && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {analysisResult.fields.length} datos extraídos
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

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Datos de la Póliza
            </DialogTitle>
            <DialogDescription>
              Datos extraídos del documento. Selecciona los que deseas aplicar.
            </DialogDescription>
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-muted-foreground">Tipo de documento:</span>
                <Badge variant="outline">{analysisResult.documentType}</Badge>
              </div>

              {analysisResult.coverageDetails && analysisResult.coverageDetails.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Coberturas detectadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.coverageDetails.map((coverage, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {coverage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {analysisResult.fields.map((field, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedFields.has(field.fieldName)
                        ? 'bg-emerald-50 border-emerald-300'
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
                              ? 'bg-emerald-500 border-emerald-500'
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
                        {field.fieldValue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

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

              <Button
                onClick={applySelectedData}
                disabled={selectedFields.size === 0}
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500"
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
