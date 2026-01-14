'use client';

import { useState } from 'react';
import { useDocuments } from '@/hooks/queries/useDocuments';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Search, Upload, Folder, Sparkles, Loader2 } from 'lucide-react';
import { Document } from '@/types/documents';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';

export function DocumentsDataTable() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);

  // Note: API filtering is by ID, not generic search text yet.
  // We'll implement client-side filtering for now as the endpoint returns all docs.
  const { data, isLoading, isError } = useDocuments({});

  const filteredData = data?.data?.filter(doc => 
    doc.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    doc.tipo.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) || [];

  const handleAnalyzeDocument = async (docId: string) => {
    setAnalyzingDocId(docId);
    toast.info('Iniciando análisis inteligente...');
    
    try {
      const formData = new FormData();
      formData.append('documentId', docId);
      
      const response = await fetch('/api/ai/documents/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Error en análisis');
      
      const result = await response.json();
      toast.success(`Documento analizado: ${result.classification.specificType} (${Math.round(result.classification.confidence * 100)}%)`);
      
      // Aquí podríamos mostrar un modal con los resultados
      console.log('Analysis Result:', result);
      
    } catch (error) {
      console.error(error);
      toast.error('Error al analizar el documento');
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (item: Document) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{item.nombre}</span>
            <span className="text-xs text-gray-500">{item.tipo}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'related',
      header: 'Relacionado con',
      render: (item: Document) => (
        <div className="flex flex-col text-sm text-gray-600">
          {item.building && <span>Edificio: {item.building.nombre}</span>}
          {item.unit && <span>Unidad: {item.unit.numero}</span>}
          {item.tenant && <span>Inquilino: {item.tenant.nombreCompleto}</span>}
        </div>
      ),
    },
    {
      key: 'folder',
      header: 'Carpeta',
      render: (item: Document) => (
        item.folder ? (
          <Badge variant="outline" className="gap-1">
            <Folder size={10} /> {item.folder.nombre}
          </Badge>
        ) : <span className="text-gray-400 text-sm">-</span>
      ),
    },
    {
      key: 'date',
      header: 'Subido',
      render: (item: Document) => (
        <span className="text-sm text-gray-500">
          {formatDate(item.fechaSubida)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item: Document) => (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleAnalyzeDocument(item.id)}
            disabled={analyzingDocId === item.id}
            title="Analizar con IA"
          >
            {analyzingDocId === item.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            ) : (
              <Sparkles className="h-4 w-4 text-purple-600" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.open(`/api/documents/${item.id}/download`, '_blank')}>
            Descargar
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        Error al cargar documentos. Por favor, intenta de nuevo más tarde.
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar documentos..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.location.href = '/dashboard/documents/upload'}>
            <Upload className="mr-2 h-4 w-4" /> Subir Documento
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-white">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
             <DataTable
              data={filteredData}
              columns={columns}
              emptyMessage={
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-indigo-50 rounded-full p-4 mb-4">
                    <FileText className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No hay documentos</h3>
                  <p className="text-gray-500 max-w-sm mb-6">
                    No se encontraron documentos. Sube uno nuevo para empezar.
                  </p>
                </div>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
