'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreHorizontal,
  Folder,
  File,
  Download,
  Trash2,
  Eye,
  Upload,
  RefreshCw,
  FolderPlus,
  Image,
  FileIcon
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  categoria?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  folderId?: string;
  folder?: {
    id: string;
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Folder {
  id: string;
  nombre: string;
  descripcion?: string;
  _count?: {
    documents: number;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/documents/folders'),
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(Array.isArray(docsData) ? docsData : docsData.data || []);
      }

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(Array.isArray(foldersData) ? foldersData : foldersData.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || doc.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const getFileIcon = (mimeType?: string, nombre?: string) => {
    if (!mimeType && !nombre) return <File className="h-8 w-8 text-gray-400" />;
    
    const type = mimeType || '';
    const name = nombre || '';
    
    if (type.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(name)) {
      return <Image className="h-8 w-8 text-purple-500" />;
    }
    if (type.includes('pdf') || /\.pdf$/i.test(name)) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    if (type.includes('word') || /\.(doc|docx)$/i.test(name)) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }
    if (type.includes('excel') || type.includes('spreadsheet') || /\.(xls|xlsx)$/i.test(name)) {
      return <FileText className="h-8 w-8 text-green-500" />;
    }
    return <FileIcon className="h-8 w-8 text-gray-400" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleViewDocument = (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
      return;
    }
    toast.info('Vista previa no disponible');
  };

  const handleDownloadDocument = (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
      return;
    }
    toast.info('Descarga no disponible');
  };

  const handleDeleteDocument = (doc: Document) => {
    toast.success(`Documento "${doc.nombre}" enviado a papelera`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todos tus documentos y archivos
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" asChild>
            <Link href="/documentos/subir">
              <Upload className="h-4 w-4 mr-2" />
              Subir Documento
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Carpetas</p>
                <p className="text-2xl font-bold">{folders.length}</p>
              </div>
              <Folder className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Contratos</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.categoria === 'contrato' || d.tipo === 'contrato').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Este mes</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => {
                    const date = new Date(d.createdAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Upload className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Carpeta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las carpetas</SelectItem>
            {folders.map(folder => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && selectedFolder === 'all' && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-yellow-500" />
            Carpetas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map(folder => (
              <Card 
                key={folder.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <CardContent className="pt-6 text-center">
                  <Folder className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <p className="font-medium truncate">{folder.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {folder._count?.documents || 0} archivos
                  </p>
                </CardContent>
              </Card>
            ))}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-dashed">
              <CardContent className="pt-6 text-center">
                <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-500">Nueva Carpeta</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <File className="h-5 w-5 mr-2 text-blue-500" />
          Documentos {selectedFolder !== 'all' && `en ${folders.find(f => f.id === selectedFolder)?.nombre}`}
        </h2>
        
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay documentos</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron documentos con ese criterio' : 'Sube tu primer documento'}
            </p>
            <Button asChild>
              <Link href="/documentos/subir">
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    {getFileIcon(doc.mimeType, doc.nombre)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => undefined}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="font-medium truncate" title={doc.nombre}>
                    {doc.nombre}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500">
                      {formatFileSize(doc.size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {doc.folder && (
                    <Badge variant="secondary" className="mt-2">
                      {doc.folder.nombre}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
