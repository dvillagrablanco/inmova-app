'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';

interface PhotoUploaderProps {
  propertyId?: string;
  existingPhotos?: string[];
  onPhotosChange?: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({
  propertyId,
  existingPhotos = [],
  onPhotosChange,
  maxPhotos = 10,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const uploadToS3 = async (file: File): Promise<string> => {
    // Upload real a S3 vía API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', propertyId ? `properties/${propertyId}` : 'properties/temp');

    try {
      const response = await fetch('/api/upload/photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir archivo');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error('Upload to S3 failed:', error);
      // Fallback a URL temporal si falla
      toast.error('Error al subir foto, se usará versión temporal');
      return URL.createObjectURL(file);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validar cantidad
    if (photos.length + fileArray.length > maxPhotos) {
      toast.error(`Máximo ${maxPhotos} fotos permitidas`);
      return;
    }

    // Validar tipos
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = fileArray.filter((file) => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error('Solo se permiten imágenes (JPG, PNG, WEBP)');
      return;
    }

    // Validar tamaño (máx 5MB por imagen)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = fileArray.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error('Las imágenes deben ser menores a 5MB');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = fileArray.map((file) => uploadToS3(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      const newPhotos = [...photos, ...uploadedUrls];
      setPhotos(newPhotos);
      onPhotosChange?.(newPhotos);
      
      toast.success(`${fileArray.length} foto(s) subida(s) exitosamente`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir las fotos');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processFiles(e.dataTransfer.files);
      }
    },
    [photos, maxPhotos, onPhotosChange]
  );

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange?.(newPhotos);
    
    // Ajustar índice de foto principal si es necesario
    if (mainPhotoIndex >= newPhotos.length) {
      setMainPhotoIndex(Math.max(0, newPhotos.length - 1));
    }
    
    toast.success('Foto eliminada');
  };

  const setMainPhoto = (index: number) => {
    setMainPhotoIndex(index);
    toast.success('Foto principal actualizada');
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading || photos.length >= maxPhotos}
        />
        
        <div className="space-y-4">
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Subiendo fotos...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Arrastra fotos aquí o haz click para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG o WEBP (máx. 5MB por imagen)
                </p>
                <p className="text-xs text-muted-foreground">
                  {photos.length}/{maxPhotos} fotos subidas
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Fotos de la Propiedad ({photos.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Overlay con acciones */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant={index === mainPhotoIndex ? 'default' : 'secondary'}
                      onClick={() => setMainPhoto(index)}
                      className="h-8 px-2"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removePhoto(index)}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Badge de foto principal */}
                  {index === mainPhotoIndex && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Principal
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {photos.length < maxPhotos && (
            <p className="text-xs text-muted-foreground text-center">
              Puedes agregar {maxPhotos - photos.length} foto(s) más
            </p>
          )}
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aún no hay fotos subidas</p>
        </div>
      )}
    </div>
  );
}
