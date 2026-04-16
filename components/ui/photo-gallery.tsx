'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2, X, Loader2, ImageIcon, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  folder?: string;
  title?: string;
  description?: string;
  maxPhotos?: number;
  editable?: boolean;
  className?: string;
}

export function PhotoGallery({
  images = [],
  onImagesChange = () => {},
  folder = 'properties',
  title = 'Fotos del activo',
  description = 'Sube fotos para documentar el estado del inmueble',
  maxPhotos = 20,
  editable = true,
  className,
}: PhotoGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image client-side before upload (max 1920px, quality 0.8, WebP)
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_SIZE = 1920;
        let { width, height } = img;
        
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try WebP first, fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const ext = blob.type === 'image/webp' ? '.webp' : '.jpg';
            const name = file.name.replace(/\.[^.]+$/, ext);
            resolve(new File([blob], name, { type: blob.type }));
          },
          'image/webp',
          0.80
        );
      };
      
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxPhotos) {
      toast.error(`Máximo ${maxPhotos} fotos por activo`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} supera el límite de 20MB`);
        continue;
      }

      try {
        // Compress before uploading
        const compressed = await compressImage(file);
        
        const formData = new FormData();
        formData.append('file', compressed);
        formData.append('folder', folder);

        const res = await fetch('/api/upload/photos', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            newUrls.push(data.url);
          }
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || `Error subiendo ${file.name}`);
        }
      } catch {
        toast.error(`Error subiendo ${file.name}`);
      }
    }

    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} foto${newUrls.length > 1 ? 's' : ''} subida${newUrls.length > 1 ? 's' : ''}`);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (url: string) => {
    onImagesChange(images.filter(img => img !== url));
    toast.success('Foto eliminada');
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {editable && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || images.length >= maxPhotos}
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Subir Fotos</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer",
                    idx === 0 && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => setPreviewUrl(url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium z-10">
                      Portada
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {editable && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx !== 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const reordered = [...images];
                            const [moved] = reordered.splice(idx, 1);
                            reordered.unshift(moved);
                            onImagesChange(reordered);
                          }}
                          className="p-1.5 rounded-full bg-primary text-white hover:bg-primary/80"
                          title="Establecer como portada"
                        >
                          <Camera className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(url); }}
                        className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {editable && images.length < maxPhotos && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 flex flex-col items-center justify-center text-muted-foreground hover:text-indigo-600 transition-colors"
                >
                  <Camera className="h-8 w-8 mb-1" />
                  <span className="text-xs">Añadir</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay fotos</p>
              {editable && (
                <p className="text-xs mt-1">Sube fotos para documentar el estado del activo</p>
              )}
            </div>
          )}
          {images.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-right">
              {images.length}/{maxPhotos} fotos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Vista previa"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </>
  );
}
