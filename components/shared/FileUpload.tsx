/**
 * Componente: Upload de archivos
 * Soporta:
 * - Fotos públicas (S3 público)
 * - Documentos privados (S3 privado)
 * - Progress bar
 * - Preview de imágenes
 */

'use client';

import { useState } from 'react';
import { Upload, X, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  type: 'public' | 'private';
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  entityType?: 'property' | 'contract' | 'tenant' | 'user';
  entityId?: string;
  className?: string;
}

export function FileUpload({
  type = 'public',
  folder = 'general',
  accept = 'image/*',
  maxSize = 5,
  onSuccess,
  onError,
  entityType,
  entityId,
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tamaño
    if (selectedFile.size > maxSize * 1024 * 1024) {
      onError?.(`El archivo es demasiado grande (máximo ${maxSize}MB)`);
      return;
    }

    setFile(selectedFile);

    // Preview para imágenes
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      if (type === 'private' && entityType) {
        formData.append('entityType', entityType);
        if (entityId) formData.append('entityId', entityId);
      }

      // Simular progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const endpoint = type === 'public' 
        ? '/api/upload/public' 
        : '/api/upload/private';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error subiendo archivo');
      }

      const data = await response.json();
      
      if (type === 'public') {
        setUploadedUrl(data.url);
      }

      onSuccess?.(data);

      // Reset after 2 seconds
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setProgress(0);
        setUploading(false);
      }, 2000);

    } catch (error: any) {
      console.error('[Upload Error]:', error);
      onError?.(error.message);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setUploadedUrl(null);
    setUploading(false);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {!file && !uploadedUrl && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="space-y-2">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600 hover:text-blue-500">
                  Click para subir
                </span>{' '}
                o arrastra y suelta
              </div>
              <p className="text-xs text-gray-500">
                {accept === 'image/*' ? 'PNG, JPG, WEBP' : 'PDF, DOC, DOCX, JPG, PNG'} 
                {' '}(máximo {maxSize}MB)
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {/* Preview */}
      {file && !uploadedUrl && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {preview ? (
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="h-16 w-16 object-cover rounded"
                />
              ) : (
                <File className="h-16 w-16 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-center text-gray-500">
                Subiendo... {progress}%
              </p>
            </div>
          )}

          {/* Upload Button */}
          {!uploading && (
            <Button 
              onClick={handleUpload} 
              className="w-full"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir archivo
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Success State */}
      {uploadedUrl && type === 'public' && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                ¡Archivo subido!
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              Subir otro
            </Button>
          </div>
          {preview && (
            <img 
              src={preview} 
              alt="Uploaded" 
              className="w-full h-48 object-cover rounded"
            />
          )}
          <p className="text-xs text-gray-600 break-all">
            URL: {uploadedUrl}
          </p>
        </div>
      )}

      {/* Success State (Private) */}
      {progress === 100 && type === 'private' && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <File className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              ¡Documento subido de forma segura!
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full mt-2"
          >
            Subir otro documento
          </Button>
        </div>
      )}
    </div>
  );
}
