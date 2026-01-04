/**
 * Componente: FileUpload
 * 
 * Upload de archivos con drag & drop
 * Soporta imágenes y documentos
 * Preview de archivos
 * Progress indicator
 * Validación client-side
 * 
 * @example
 * <FileUpload
 *   folder="properties"
 *   fileType="image"
 *   maxFiles={5}
 *   onUploadComplete={(urls) => console.log(urls)}
 * />
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';

export type FileType = 'image' | 'document';

interface FileUploadProps {
  /** Carpeta destino en S3 */
  folder: string;
  /** Tipo de archivos permitidos */
  fileType: FileType;
  /** Número máximo de archivos */
  maxFiles?: number;
  /** Tamaño máximo por archivo en MB */
  maxSizeMB?: number;
  /** Callback cuando el upload se completa */
  onUploadComplete?: (urls: string[]) => void;
  /** Callback cuando hay error */
  onError?: (error: string) => void;
  /** Archivos existentes (para mostrar preview) */
  existingFiles?: string[];
  /** Clase CSS adicional */
  className?: string;
}

interface UploadFile {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export function FileUpload({
  folder,
  fileType,
  maxFiles = 5,
  maxSizeMB = 10,
  onUploadComplete,
  onError,
  existingFiles = [],
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tipos MIME permitidos
  const allowedTypes = fileType === 'image'
    ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  // Extensiones para el input
  const acceptString = fileType === 'image'
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : '.pdf,.doc,.docx';

  /**
   * Valida un archivo
   */
  const validateFile = useCallback((file: File): string | null => {
    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}`;
    }

    // Validar tamaño
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
      return `Archivo demasiado grande: ${sizeMB.toFixed(1)} MB (máximo ${maxSizeMB} MB)`;
    }

    return null;
  }, [allowedTypes, maxSizeMB]);

  /**
   * Procesa archivos seleccionados
   */
  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    // Verificar límite de archivos
    const currentCount = files.length + existingFiles.length;
    const newFilesArray = Array.from(fileList);
    
    if (currentCount + newFilesArray.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    // Validar y crear previews
    const newUploadFiles: UploadFile[] = [];

    for (const file of newFilesArray) {
      const error = validateFile(file);
      
      if (error) {
        toast.error(error);
        continue;
      }

      const uploadFile: UploadFile = {
        file,
        status: 'pending',
      };

      // Preview para imágenes
      if (fileType === 'image') {
        uploadFile.preview = URL.createObjectURL(file);
      }

      newUploadFiles.push(uploadFile);
    }

    setFiles((prev) => [...prev, ...newUploadFiles]);
  }, [files, existingFiles, maxFiles, fileType, validateFile]);

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  /**
   * Elimina un archivo de la lista
   */
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      // Revocar URL del preview si existe
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  /**
   * Upload de archivos a S3
   */
  const uploadFiles = useCallback(async () => {
    if (files.length === 0) {
      toast.error('No hay archivos para subir');
      return;
    }

    setUploading(true);

    try {
      // Preparar FormData
      const formData = new FormData();
      files.forEach((f) => {
        formData.append('files', f.file);
      });
      formData.append('folder', folder);
      formData.append('fileType', fileType);

      // Upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error subiendo archivos');
      }

      if (data.success) {
        // Actualizar estado de archivos
        setFiles((prev) =>
          prev.map((f, i) => ({
            ...f,
            status: 'success',
            url: data.uploads[i]?.url,
          }))
        );

        toast.success(`${data.count} archivo(s) subido(s) correctamente`);

        // Callback
        if (onUploadComplete) {
          const urls = data.uploads.map((u: any) => u.url);
          onUploadComplete(urls);
        }

        // Limpiar después de 2 segundos
        setTimeout(() => {
          setFiles([]);
        }, 2000);
      }
    } catch (error: any) {
      console.error('[FileUpload] Error:', error);
      toast.error(error.message || 'Error subiendo archivos');

      // Marcar archivos como error
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error',
          error: error.message,
        }))
      );

      if (onError) {
        onError(error.message);
      }
    } finally {
      setUploading(false);
    }
  }, [files, folder, fileType, onUploadComplete, onError]);

  /**
   * Icono según el tipo de archivo
   */
  const FileIcon = fileType === 'image' ? ImageIcon : FileText;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptString}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
            <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Arrastra archivos aquí o haz click para seleccionar
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {fileType === 'image' ? 'Imágenes' : 'Documentos'} • Máximo {maxFiles} archivos • Max {maxSizeMB} MB cada uno
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Seleccionar Archivos
          </Button>
        </div>
      </div>

      {/* Lista de archivos existentes */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Archivos actuales ({existingFiles.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {existingFiles.map((url, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {fileType === 'image' ? (
                  <Image
                    src={url}
                    alt={`Archivo ${index + 1}`}
                    width={200}
                    height={150}
                    className="object-cover w-full h-32"
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de archivos a subir */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Archivos a subir ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((uploadFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {/* Preview o icono */}
                <div className="flex-shrink-0">
                  {uploadFile.preview ? (
                    <Image
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      width={48}
                      height={48}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                      <FileIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Estado */}
                <div className="flex-shrink-0">
                  {uploadFile.status === 'pending' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {uploadFile.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {uploadFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" title={uploadFile.error} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botón de upload */}
          <Button
            onClick={uploadFiles}
            disabled={uploading || files.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir {files.length} archivo(s)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
