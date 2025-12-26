'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Image from 'next/image';

interface MobilePhotoCaptureProps {
  workOrderId: string;
  onPhotosUploaded: () => void;
}

export default function MobilePhotoCapture({
  workOrderId,
  onPhotosUploaded,
}: MobilePhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes tomar al menos una foto',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      // Subir cada foto
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        // Convertir base64 a blob
        const response = await fetch(photo);
        const blob = await response.blob();

        // Crear FormData
        const formData = new FormData();
        formData.append('file', blob, `workorder-${workOrderId}-${Date.now()}.jpg`);
        formData.append('folder', 'work-orders');

        // Subir a S3 (usando el endpoint de fotos existente)
        const uploadRes = await fetch('/api/photos', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Error al subir foto');
        }

        const uploadData = await uploadRes.json();
        uploadedUrls.push(uploadData.url);
      }

      // Asociar fotos a la orden de trabajo
      const associateRes = await fetch(`/api/operador/work-orders/${workOrderId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: uploadedUrls }),
      });

      if (!associateRes.ok) {
        throw new Error('Error al asociar fotos a la orden');
      }

      toast({
        title: 'Éxito',
        description: `${photos.length} foto(s) subida(s) correctamente`,
      });

      setPhotos([]);
      onPhotosUploaded();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al subir fotos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Capturar Fotos</h3>
          {photos.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {photos.length} foto{photos.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Input de cámara (oculto) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleCapture}
          className="hidden"
        />

        {/* Botón para abrir cámara */}
        <Button
          variant="outline"
          className="w-full h-24 border-dashed border-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <div className="flex flex-col items-center gap-2">
            <Camera className="h-8 w-8" />
            <span className="text-sm">Tomar Foto</span>
          </div>
        </Button>

        {/* Previsualización de fotos */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square group">
                <div className="relative w-full h-full rounded-lg overflow-hidden bg-muted">
                  <Image src={photo} alt={`Foto ${index + 1}`} fill className="object-cover" />
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Botón de subida */}
        {photos.length > 0 && (
          <Button className="w-full" onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir {photos.length} Foto{photos.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
