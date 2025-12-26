'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import logger, { logError } from '@/lib/logger';

interface Photo {
  id: string;
  key: string;
  url: string;
  isPortada: boolean;
}

interface PhotoGalleryProps {
  entityType: 'unit' | 'building';
  entityId: string;
  canEdit?: boolean;
}

export function PhotoGallery({ entityType, entityId, canEdit = false }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openUpload, setOpenUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPortada, setIsPortada] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [entityType, entityId]);

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/photos?entityType=${entityType}&entityId=${entityId}`);
      if (!res.ok) throw new Error('Error al cargar fotos');
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar las fotos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona una foto');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      formData.append('isPortada', isPortada.toString());

      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir foto');

      toast.success('Foto subida correctamente');
      setOpenUpload(false);
      setSelectedFile(null);
      setIsPortada(false);
      fetchPhotos();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoKey: string) => {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return;

    try {
      const res = await fetch(
        `/api/photos?entityType=${entityType}&entityId=${entityId}&photoKey=${encodeURIComponent(photoKey)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Error al eliminar foto');

      toast.success('Foto eliminada correctamente');
      fetchPhotos();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar la foto');
    }
  };

  if (isLoading) {
    return <div className="text-center text-sm text-muted-foreground">Cargando fotos...</div>;
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <Button onClick={() => setOpenUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Subir Foto
        </Button>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No hay fotos disponibles</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="group relative overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="relative aspect-video cursor-pointer bg-muted"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <Image
                    src={photo.url}
                    alt="Foto de propiedad"
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  {photo.isPortada && (
                    <div className="absolute left-2 top-2">
                      <div className="flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
                        <Star className="h-3 w-3 fill-white" />
                        Portada
                      </div>
                    </div>
                  )}
                  {canEdit && (
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo.key);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para Upload */}
      <Dialog open={openUpload} onOpenChange={setOpenUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Foto</DialogTitle>
            <DialogDescription>Selecciona una foto para agregar a la galería</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="photo">Archivo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="portada"
                checked={isPortada}
                onChange={(e) => setIsPortada(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="portada" className="cursor-pointer">
                Establecer como foto de portada
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenUpload(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Subir Foto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Vista Completa */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Vista de Foto</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative aspect-video w-full bg-muted">
              <Image
                src={selectedPhoto.url}
                alt="Foto de propiedad"
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
