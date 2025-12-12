'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface DocumentUploaderOCRProps {
  onUploadComplete?: (result: {
    s3Key: string;
    fileName: string;
    extractedData: any;
  }) => void;
  documentType?: 'dni' | 'contrato' | 'nomina' | 'curriculum' | 'otro';
  allowedTypes?: string[];
  maxSizeMB?: number;
  title?: string;
  description?: string;
}

export function DocumentUploaderOCR({
  onUploadComplete,
  documentType = 'otro',
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  maxSizeMB = 10,
  title = 'Subir Documento',
  description = 'Sube un documento para extraer información automáticamente',
}: DocumentUploaderOCRProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>(documentType);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Tipo de archivo no válido');
      return;
    }

    // Validar tamaño
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast.error(`El archivo es demasiado grande. Máximo ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    setUploadSuccess(false);
    setExtractedData(null);

    // Crear preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedDocType);

      const response = await fetch('/api/documents/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir el documento');
      }

      const result = await response.json();
      setExtractedData(result.extractedData);
      setUploadSuccess(true);
      toast.success('Documento procesado exitosamente');

      if (onUploadComplete) {
        onUploadComplete({
          s3Key: result.s3Key,
          fileName: result.fileName,
          extractedData: result.extractedData,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadSuccess(false);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de tipo de documento */}
        <div className="space-y-2">
          <Label htmlFor="documentType">Tipo de Documento</Label>
          <Select value={selectedDocType} onValueChange={setSelectedDocType}>
            <SelectTrigger id="documentType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dni">DNI / Documento de Identidad</SelectItem>
              <SelectItem value="contrato">Contrato</SelectItem>
              <SelectItem value="nomina">Nómina</SelectItem>
              <SelectItem value="curriculum">Currículum Vitae</SelectItem>
              <SelectItem value="otro">Otro Documento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Área de selección de archivo */}
        {!file ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Haz clic para seleccionar o arrastra un archivo aquí
            </p>
            <p className="text-xs text-gray-500">
              PDF, JPEG o PNG (máx. {maxSizeMB}MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview del archivo */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {file.type === 'application/pdf' ? (
                    <FileText className="h-10 w-10 text-red-500" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadSuccess && (
                    <Badge variant="default" className="mt-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Procesado
                    </Badge>
                  )}
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Preview de imagen */}
              {previewUrl && (
                <div className="mt-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg object-contain"
                  />
                </div>
              )}
            </div>

            {/* Botón de subida */}
            {!uploadSuccess && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir y Procesar con OCR
                  </>
                )}
              </Button>
            )}

            {/* Datos extraídos */}
            {extractedData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-900 mb-2">
                  Información Extraída:
                </h4>
                <pre className="text-xs text-green-800 whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
