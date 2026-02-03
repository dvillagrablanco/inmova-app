/**
 * Componente: Document Manager
 *
 * UI completa para gestión de documentos.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Download, Trash2, Share2, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';
import { toast } from 'sonner';

interface DocumentManagerProps {
  entityType?: string;
  entityId?: string;
}

export function DocumentManager({ entityType, entityId }: DocumentManagerProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    category: '',
    tags: [] as string[],
    isPublic: false,
  });

  // Fetch documents
  const { data, isLoading } = useQuery({
    queryKey: ['documents', { entityType, entityId, searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (entityType) params.append('entityType', entityType);

      const response = await fetch(`/api/v1/documents/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'metadata',
        JSON.stringify({
          entityType,
          entityId,
          ...uploadMetadata,
        })
      );

      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedFile(null);
      setUploadMetadata({ category: '', tags: [], isPublic: false });
    },
  });

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDownload = (documentId: string) => {
    window.open(`/api/v1/documents/${documentId}/download`, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📁';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documentos</h2>

        {/* Upload Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <AIDocumentAssistant
                context={entityType || 'documentos'}
                variant="inline"
                position="bottom-right"
                onApplyData={(data) => {
                  if (data.tipo || data.documentType || data.category) {
                    setUploadMetadata((prev) => ({
                      ...prev,
                      category: String(data.tipo || data.documentType || data.category),
                    }));
                  }
                  if (data.tags || data.etiquetas || data.keywords) {
                    const raw = data.tags || data.etiquetas || data.keywords;
                    const tags = Array.isArray(raw)
                      ? raw.map((tag) => String(tag).trim()).filter(Boolean)
                      : String(raw)
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter(Boolean);
                    if (tags.length > 0) {
                      setUploadMetadata((prev) => ({ ...prev, tags }));
                    }
                  }
                  toast.success('Metadatos aplicados al documento');
                }}
              />
              <div>
                <label className="block text-sm font-medium mb-2">Archivo</label>
                <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <Input
                  value={uploadMetadata.category}
                  onChange={(e) =>
                    setUploadMetadata({ ...uploadMetadata, category: e.target.value })
                  }
                  placeholder="Ej: Contrato, Factura, Foto..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (separados por comas)</label>
                <Input
                  placeholder="importante, urgente, legal..."
                  onChange={(e) =>
                    setUploadMetadata({
                      ...uploadMetadata,
                      tags: e.target.value.split(',').map((t) => t.trim()),
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadMetadata.isPublic}
                  onChange={(e) =>
                    setUploadMetadata({ ...uploadMetadata, isPublic: e.target.checked })
                  }
                />
                <label htmlFor="isPublic" className="text-sm">
                  Documento público
                </label>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? 'Subiendo...' : 'Subir'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : data?.documents?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay documentos aún</div>
        ) : (
          data?.documents?.map((doc: any) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="text-3xl">{getFileIcon(doc.mimeType)}</div>

                <div className="flex-1">
                  <h3 className="font-medium">{doc.filename}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(doc.size)}</span>
                    {doc.category && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {doc.category}
                      </span>
                    )}
                    {doc.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.id)}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.total > 20 && (
        <div className="flex justify-center space-x-2">
          <Button variant="outline">Anterior</Button>
          <Button variant="outline">Siguiente</Button>
        </div>
      )}
    </div>
  );
}
