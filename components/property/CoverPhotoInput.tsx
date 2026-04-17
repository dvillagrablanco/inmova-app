'use client';

import { useState } from 'react';
import { Upload, Star, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';

interface CoverPhotoInputProps {
  propertyId?: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

/**
 * Input dedicado para la foto de portada de la propiedad.
 * - La portada es siempre `photos[0]` (consumida por la vista previa de /propiedades).
 * - Al subir una nueva foto desde aquí, se pone en la posición 0 (reemplaza la portada).
 * - El resto de fotos se gestiona en el PhotoUploader debajo.
 */
export function CoverPhotoInput({ propertyId, photos, onPhotosChange }: CoverPhotoInputProps) {
  const [uploading, setUploading] = useState(false);
  const cover = photos.length > 0 ? photos[0] : null;

  const uploadToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', propertyId ? `properties/${propertyId}` : 'properties/temp');
    try {
      const response = await fetch('/api/upload/photos', { method: 'POST', body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Error al subir foto');
      }
      const data = await response.json();
      return data.url;
    } catch (e: any) {
      console.error('Upload cover failed', e);
      throw e;
    }
  };

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes (JPG, PNG, WEBP)');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToS3(file);
      // La portada siempre va en el índice 0
      const without = photos.filter((p) => p !== url);
      onPhotosChange([url, ...without]);
      toast.success('Foto de portada actualizada — aparecerá en la vista previa');
    } catch (err: any) {
      toast.error(err?.message || 'Error al subir la foto de portada');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    if (!cover) return;
    onPhotosChange(photos.slice(1));
    toast.success('Portada eliminada');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {/* Preview cuadrada de la portada */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted">
          {cover ? (
            <>
              <Image src={cover} alt="Foto de portada" fill className="object-cover" />
              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Portada
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Star className="h-8 w-8 mb-1" />
              <span className="text-xs">Sin portada</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-sm">
            La <strong>foto de portada</strong> se muestra como vista previa en el listado de
            propiedades. Si subes una imagen aquí, sustituirá a la portada actual.
          </p>
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor="cover-photo-input"
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 text-sm font-medium"
            >
              <Upload className="h-4 w-4" />
              {cover ? 'Cambiar foto de portada' : 'Subir foto de portada'}
              <input
                id="cover-photo-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {cover && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-1" />
                Quitar portada
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG o WEBP · máx. 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
