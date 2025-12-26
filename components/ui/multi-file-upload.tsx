'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface MultiFileUploadProps {
  /**
   * Máximo de archivos permitidos. Default: 10
   */
  maxFiles?: number;
  /**
   * Tamaño máximo por archivo en MB. Default: 10
   */
  maxSizeMB?: number;
  /**
   * Tipos de archivo aceptados. Default: todos
   */
  acceptedFileTypes?: string[];
  /**
   * Callback cuando los archivos son seleccionados
   */
  onFilesSelect?: (files: File[]) => void;
  /**
   * Callback para subir cada archivo individualmente
   */
  onUpload?: (file: File, onProgress: (progress: number) => void) => Promise<void>;
  /**
   * Si true, sube automáticamente al seleccionar
   */
  autoUpload?: boolean;
  /**
   * Texto del botón de subida
   */
  uploadButtonText?: string;
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente de subida múltiple de archivos con drag & drop
 *
 * Ejemplo de uso:
 * ```tsx
 * <MultiFileUpload
 *   maxFiles={5}
 *   maxSizeMB={10}
 *   acceptedFileTypes={['.pdf', '.doc', '.docx']}
 *   onUpload={async (file, onProgress) => {
 *     // Tu lógica de subida aquí
 *     const formData = new FormData();
 *     formData.append('file', file);
 *     await fetch('/api/upload', { method: 'POST', body: formData });
 *   }}
 * />
 * ```
 */
export function MultiFileUpload({
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedFileTypes,
  onFilesSelect,
  onUpload,
  autoUpload = false,
  uploadButtonText = 'Subir Archivos',
  className,
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FileImage className="h-8 w-8 text-blue-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case 'doc':
      case 'docx':
        return <FileCode className="h-8 w-8 text-blue-600" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `El archivo excede el tamaño máximo de ${maxSizeMB}MB`;
    }

    if (acceptedFileTypes && acceptedFileTypes.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        return `Tipo de archivo no permitido. Permitidos: ${acceptedFileTypes.join(', ')}`;
      }
    }

    return null;
  };

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList);

      // Validar número máximo de archivos
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Máximo ${maxFiles} archivos permitidos`);
        return;
      }

      const validatedFiles: UploadedFile[] = [];

      newFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
        } else {
          validatedFiles.push({
            file,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            progress: 0,
          });
        }
      });

      if (validatedFiles.length > 0) {
        const updatedFiles = [...files, ...validatedFiles];
        setFiles(updatedFiles);

        // Notificar a la función padre
        if (onFilesSelect) {
          onFilesSelect(validatedFiles.map((f) => f.file));
        }

        // Auto-subir si está habilitado
        if (autoUpload && onUpload) {
          validatedFiles.forEach((uploadedFile) => {
            uploadFile(uploadedFile);
          });
        }
      }
    },
    [files, maxFiles, onFilesSelect, autoUpload, onUpload]
  );

  const uploadFile = async (uploadedFile: UploadedFile) => {
    if (!onUpload) return;

    // Actualizar estado a uploading
    setFiles((prev) =>
      prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'uploading' as const } : f))
    );

    try {
      await onUpload(uploadedFile.file, (progress) => {
        setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress } : f)));
      });

      // Éxito
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: 'success' as const, progress: 100 } : f
        )
      );
      toast.success(`${uploadedFile.file.name} subido correctamente`);
    } catch (error) {
      // Error
      const errorMessage = error instanceof Error ? error.message : 'Error al subir';
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: 'error' as const, error: errorMessage } : f
        )
      );
      toast.error(`Error al subir ${uploadedFile.file.name}`);
    }
  };

  const uploadAll = async () => {
    if (!onUpload) return;

    const pendingFiles = files.filter((f) => f.status === 'pending');
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
          'cursor-pointer'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload
          className={cn(
            'h-12 w-12 mx-auto mb-4',
            isDragging ? 'text-primary' : 'text-muted-foreground'
          )}
        />
        <h3 className="text-lg font-semibold mb-2">
          Arrastra archivos aquí o haz clic para seleccionar
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          Máximo {maxFiles} archivos, hasta {maxSizeMB}MB cada uno
        </p>
        {acceptedFileTypes && acceptedFileTypes.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Tipos permitidos: {acceptedFileTypes.join(', ')}
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept={acceptedFileTypes?.join(',')}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              Archivos seleccionados ({files.length}/{maxFiles})
            </h4>
            {!autoUpload && onUpload && files.some((f) => f.status === 'pending') && (
              <Button onClick={uploadAll} size="sm">
                {uploadButtonText}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">{getFileIcon(uploadedFile.file.name)}</div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                        <div className="flex items-center gap-2">
                          {uploadedFile.status === 'success' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {uploadedFile.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {uploadedFile.status === 'pending' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => removeFile(uploadedFile.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(uploadedFile.file.size)}
                        </span>
                        <Badge
                          variant={
                            uploadedFile.status === 'success'
                              ? 'default'
                              : uploadedFile.status === 'error'
                                ? 'destructive'
                                : uploadedFile.status === 'uploading'
                                  ? 'secondary'
                                  : 'outline'
                          }
                          className="text-xs"
                        >
                          {uploadedFile.status === 'pending' && 'Pendiente'}
                          {uploadedFile.status === 'uploading' && 'Subiendo...'}
                          {uploadedFile.status === 'success' && 'Completado'}
                          {uploadedFile.status === 'error' && 'Error'}
                        </Badge>
                      </div>

                      {uploadedFile.status === 'uploading' && (
                        <Progress value={uploadedFile.progress} className="h-1" />
                      )}

                      {uploadedFile.status === 'error' && uploadedFile.error && (
                        <p className="text-xs text-red-600 mt-1">{uploadedFile.error}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
