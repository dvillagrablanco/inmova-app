'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Upload, Download, Trash2, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  cloudStoragePath: string;
  fechaSubida: string;
  fechaVencimiento: string | null;
  tenant?: { nombreCompleto: string };
  unit?: { numero: string };
  building?: { nombre: string };
}

export default function DocumentosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    nombre: '',
    tipo: 'otro',
    fechaVencimiento: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchDocuments();
    }
  }, [session]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.nombre) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('nombre', uploadForm.nombre);
      formData.append('tipo', uploadForm.tipo);
      if (uploadForm.fechaVencimiento) {
        formData.append('fechaVencimiento', uploadForm.fechaVencimiento);
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success('Documento subido exitosamente');
        setOpenUploadDialog(false);
        setUploadForm({ file: null, nombre: '', tipo: 'otro', fechaVencimiento: '' });
        fetchDocuments();
      } else {
        toast.error('Error al subir documento');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/download`);
      if (res.ok) {
        const data = await res.json();
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error('Error al descargar documento');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar documento');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Documento eliminado exitosamente');
        fetchDocuments();
      } else {
        toast.error('Error al eliminar documento');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar documento');
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      contrato: 'bg-blue-500',
      dni: 'bg-green-500',
      nomina: 'bg-yellow-500',
      certificado_energetico: 'bg-purple-500',
      ite: 'bg-orange-500',
      seguro: 'bg-red-500',
      factura: 'bg-indigo-500',
      otro: 'bg-gray-500',
    };
    return colors[tipo] || 'bg-gray-500';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      contrato: 'Contrato',
      dni: 'DNI',
      nomina: 'Nómina',
      certificado_energetico: 'Certificado Energético',
      ite: 'ITE',
      seguro: 'Seguro',
      factura: 'Factura',
      otro: 'Otro',
    };
    return labels[tipo] || tipo;
  };

  const filteredDocuments = documents.filter(doc => {
    if (filterTipo === 'all') return true;
    return doc.tipo === filterTipo;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Gestiona todos los documentos del sistema</p>
        </div>
        <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">Archivo *</Label>
                <Input
                  id="file"
                  type="file"
                  required
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                />
              </div>
              <div>
                <Label htmlFor="nombre">Nombre del documento *</Label>
                <Input
                  id="nombre"
                  value={uploadForm.nombre}
                  onChange={(e) => setUploadForm({ ...uploadForm, nombre: e.target.value })}
                  placeholder="Ej: Contrato Juan Pérez"
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de documento *</Label>
                <Select
                  value={uploadForm.tipo}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="dni">DNI</SelectItem>
                    <SelectItem value="nomina">Nómina</SelectItem>
                    <SelectItem value="certificado_energetico">Certificado Energético</SelectItem>
                    <SelectItem value="ite">ITE</SelectItem>
                    <SelectItem value="seguro">Seguro</SelectItem>
                    <SelectItem value="factura">Factura</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fechaVencimiento">Fecha de vencimiento (opcional)</Label>
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={uploadForm.fechaVencimiento}
                  onChange={(e) => setUploadForm({ ...uploadForm, fechaVencimiento: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenUploadDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Subiendo...' : 'Subir Documento'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Tipo de documento</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="nomina">Nómina</SelectItem>
                  <SelectItem value="certificado_energetico">Certificado Energético</SelectItem>
                  <SelectItem value="ite">ITE</SelectItem>
                  <SelectItem value="seguro">Seguro</SelectItem>
                  <SelectItem value="factura">Factura</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay documentos para mostrar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Fecha Subida</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const isExpiringSoon = doc.fechaVencimiento && 
                    new Date(doc.fechaVencimiento) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.nombre}</TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(doc.tipo)}>
                          {getTipoLabel(doc.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.tenant && <span>Inquilino: {doc.tenant.nombreCompleto}</span>}
                        {doc.unit && <span>Unidad: {doc.unit.numero}</span>}
                        {doc.building && <span>Edificio: {doc.building.nombre}</span>}
                        {!doc.tenant && !doc.unit && !doc.building && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {new Date(doc.fechaSubida).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        {doc.fechaVencimiento ? (
                          <div className="flex items-center gap-2">
                            {isExpiringSoon && (
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                            )}
                            <span className={isExpiringSoon ? 'text-orange-500 font-medium' : ''}>
                              {new Date(doc.fechaVencimiento).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc.id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}