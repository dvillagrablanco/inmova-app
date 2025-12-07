'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, FileSignature, Send, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Firmante {
  id?: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
  orden: number;
  estado?: string;
}

interface DocumentoFirma {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipoDocumento: string;
  estado: string;
  urlDocumento: string | null;
  urlFirmado: string | null;
  requiereOrden: boolean;
  diasExpiracion: number;
  fechaExpiracion: string;
  recordatorios: boolean;
  diasRecordatorio: number;
  createdAt: string;
  enviadoEn: string | null;
  completadoEn: string | null;
  firmantes: Firmante[];
}

interface DocumentFormData {
  titulo: string;
  descripcion: string;
  tipoDocumento: string;
  requiereOrden: boolean;
  diasExpiracion: string;
  recordatorios: boolean;
  diasRecordatorio: string;
}

const tiposDocumento = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'adenda', label: 'Adenda' },
  { value: 'finiquito', label: 'Finiquito' },
  { value: 'acta', label: 'Acta' },
  { value: 'notificacion', label: 'Notificación' },
  { value: 'otro', label: 'Otro' }
];

const rolesFirmante = [
  'inquilino',
  'propietario',
  'fiador',
  'testigo',
  'administrador',
  'otro'
];

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  firmado: 'bg-green-50 text-green-700 border-green-200',
  rechazado: 'bg-red-50 text-red-700 border-red-200',
  cancelado: 'bg-gray-50 text-gray-700 border-gray-200',
  expirado: 'bg-orange-50 text-orange-700 border-orange-200'
};

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  firmado: 'Firmado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  expirado: 'Expirado'
};

export default function FirmaDigitalPage() {
  const { data: session } = useSession() || {};
  const [documentos, setDocumentos] = useState<DocumentoFirma[]>([]);
  const [filteredDocumentos, setFilteredDocumentos] = useState<DocumentoFirma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<DocumentoFirma | null>(null);
  const [viewingDocumento, setViewingDocumento] = useState<DocumentoFirma | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState<DocumentoFirma | null>(null);

  const [formData, setFormData] = useState<DocumentFormData>({
    titulo: '',
    descripcion: '',
    tipoDocumento: 'contrato',
    requiereOrden: false,
    diasExpiracion: '30',
    recordatorios: true,
    diasRecordatorio: '3'
  });

  const [firmantes, setFirmantes] = useState<Firmante[]>([{
    nombre: '',
    email: '',
    telefono: '',
    rol: 'inquilino',
    orden: 1
  }]);

  useEffect(() => {
    fetchDocumentos();
  }, []);

  useEffect(() => {
    filterDocumentos();
  }, [documentos, searchTerm, selectedEstado]);

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/firma-digital/documentos');
      if (!response.ok) throw new Error('Error al cargar documentos');
      const data = await response.json();
      setDocumentos(data);
    } catch (error) {
      toast.error('Error al cargar los documentos');
      logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const filterDocumentos = () => {
    let filtered = documentos;

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (doc.descripcion && doc.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
          doc.tipoDocumento.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEstado && selectedEstado !== 'all') {
      filtered = filtered.filter((doc) => doc.estado === selectedEstado);
    }

    setFilteredDocumentos(filtered);
  };

  const handleOpenDialog = (documento?: DocumentoFirma) => {
    if (documento) {
      setEditingDocumento(documento);
      setFormData({
        titulo: documento.titulo,
        descripcion: documento.descripcion || '',
        tipoDocumento: documento.tipoDocumento,
        requiereOrden: documento.requiereOrden,
        diasExpiracion: documento.diasExpiracion.toString(),
        recordatorios: documento.recordatorios,
        diasRecordatorio: documento.diasRecordatorio.toString()
      });
      setFirmantes(documento.firmantes.map(f => ({
        ...f,
        telefono: f.telefono || ''
      })));
    } else {
      setEditingDocumento(null);
      setFormData({
        titulo: '',
        descripcion: '',
        tipoDocumento: 'contrato',
        requiereOrden: false,
        diasExpiracion: '30',
        recordatorios: true,
        diasRecordatorio: '3'
      });
      setFirmantes([{
        nombre: '',
        email: '',
        telefono: '',
        rol: 'inquilino',
        orden: 1
      }]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDocumento(null);
  };

  const handleViewDocumento = (documento: DocumentoFirma) => {
    setViewingDocumento(documento);
    setIsViewDialogOpen(true);
  };

  const handleAddFirmante = () => {
    setFirmantes([...firmantes, {
      nombre: '',
      email: '',
      telefono: '',
      rol: 'inquilino',
      orden: firmantes.length + 1
    }]);
  };

  const handleRemoveFirmante = (index: number) => {
    if (firmantes.length > 1) {
      const newFirmantes = firmantes.filter((_, i) => i !== index);
      // Reordenar los firmantes
      newFirmantes.forEach((f, i) => {
        f.orden = i + 1;
      });
      setFirmantes(newFirmantes);
    }
  };

  const handleUpdateFirmante = (index: number, field: keyof Firmante, value: any) => {
    const newFirmantes = [...firmantes];
    newFirmantes[index] = { ...newFirmantes[index], [field]: value };
    setFirmantes(newFirmantes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar firmantes
    const invalidFirmante = firmantes.find(f => !f.nombre || !f.email);
    if (invalidFirmante) {
      toast.error('Todos los firmantes deben tener nombre y email');
      return;
    }

    try {
      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        tipoDocumento: formData.tipoDocumento,
        requiereOrden: formData.requiereOrden,
        diasExpiracion: parseInt(formData.diasExpiracion),
        recordatorios: formData.recordatorios,
        diasRecordatorio: parseInt(formData.diasRecordatorio),
        firmantes: firmantes.map(f => ({
          nombre: f.nombre,
          email: f.email,
          telefono: f.telefono || null,
          rol: f.rol,
          orden: f.orden
        }))
      };

      const url = editingDocumento
        ? `/api/admin/firma-digital/documentos/${editingDocumento.id}`
        : '/api/admin/firma-digital/documentos';

      const method = editingDocumento ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar el documento');
      }

      toast.success(editingDocumento ? 'Documento actualizado' : 'Documento creado');
      handleCloseDialog();
      fetchDocumentos();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el documento');
      logger.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = async () => {
    if (!documentoToDelete) return;

    try {
      const response = await fetch(`/api/admin/firma-digital/documentos/${documentoToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar el documento');

      toast.success('Documento eliminado');
      setIsDeleteDialogOpen(false);
      setDocumentoToDelete(null);
      fetchDocumentos();
    } catch (error) {
      toast.error('Error al eliminar el documento');
      logger.error(error instanceof Error ? error.message : String(error));
    }
  };

  const openDeleteDialog = (documento: DocumentoFirma) => {
    setDocumentoToDelete(documento);
    setIsDeleteDialogOpen(true);
  };

  const getTipoLabel = (tipo: string) => {
    const t = tiposDocumento.find((td) => td.value === tipo);
    return t ? t.label : tipo;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Firma Digital de Documentos</h1>
          <p className="text-muted-foreground mt-1">Gestiona los documentos para firma electrónica</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Documento
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedEstado} onValueChange={setSelectedEstado}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(estadoLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredDocumentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileSignature className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron documentos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocumentos.map((documento) => (
            <Card key={documento.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{documento.titulo}</CardTitle>
                    <CardDescription className="mt-1">
                      {getTipoLabel(documento.tipoDocumento)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDocumento(documento)}
                      title="Ver documento"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(documento)}
                      title="Editar"
                      disabled={documento.estado === 'firmado'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(documento)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {documento.descripcion && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {documento.descripcion}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge variant="outline" className={estadoColors[documento.estado]}>
                      {estadoLabels[documento.estado]}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Firmantes:</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">{documento.firmantes.length}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expira:</span>
                    <span className="text-sm">
                      {format(new Date(documento.fechaExpiracion), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                  {documento.completadoEn && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completado:</span>
                      <span className="text-sm">
                        {format(new Date(documento.completadoEn), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {documento.requiereOrden && (
                      <Badge variant="outline">Firma Secuencial</Badge>
                    )}
                    {documento.recordatorios && (
                      <Badge variant="outline">Con Recordatorios</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de creación/edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDocumento ? 'Editar Documento' : 'Nuevo Documento para Firma'}
            </DialogTitle>
            <DialogDescription>
              {editingDocumento
                ? 'Modifica los detalles del documento'
                : 'Completa la información del documento para envío de firma'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título del Documento *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="ej: Contrato de Arrendamiento - Calle Principal 123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={(value) => setFormData({ ...formData, tipoDocumento: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Descripción adicional del documento"
                />
              </div>

              {/* Configuración de firma */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Configuración de Firma</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diasExpiracion">Días para Expirar *</Label>
                    <Input
                      id="diasExpiracion"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.diasExpiracion}
                      onChange={(e) => setFormData({ ...formData, diasExpiracion: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diasRecordatorio">Días entre Recordatorios</Label>
                    <Input
                      id="diasRecordatorio"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.diasRecordatorio}
                      onChange={(e) => setFormData({ ...formData, diasRecordatorio: e.target.value })}
                      disabled={!formData.recordatorios}
                    />
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requiereOrden">Firma Secuencial</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Los firmantes deben firmar en el orden especificado
                      </p>
                    </div>
                    <Switch
                      id="requiereOrden"
                      checked={formData.requiereOrden}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiereOrden: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="recordatorios">Enviar Recordatorios</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recordar a los firmantes periódicamente
                      </p>
                    </div>
                    <Switch
                      id="recordatorios"
                      checked={formData.recordatorios}
                      onCheckedChange={(checked) => setFormData({ ...formData, recordatorios: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Firmantes */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Firmantes ({firmantes.length})</h4>
                  <Button type="button" size="sm" onClick={handleAddFirmante}>
                    <Plus className="mr-1 h-3 w-3" />
                    Añadir Firmante
                  </Button>
                </div>

                <div className="space-y-4">
                  {firmantes.map((firmante, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium">Firmante {index + 1}</h5>
                          {firmantes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFirmante(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label>Nombre *</Label>
                            <Input
                              value={firmante.nombre}
                              onChange={(e) => handleUpdateFirmante(index, 'nombre', e.target.value)}
                              placeholder="Nombre completo"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Email *</Label>
                            <Input
                              type="email"
                              value={firmante.email}
                              onChange={(e) => handleUpdateFirmante(index, 'email', e.target.value)}
                              placeholder="email@ejemplo.com"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Teléfono</Label>
                            <Input
                              type="tel"
                              value={firmante.telefono}
                              onChange={(e) => handleUpdateFirmante(index, 'telefono', e.target.value)}
                              placeholder="+34 600 000 000"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Rol</Label>
                            <Select
                              value={firmante.rol}
                              onValueChange={(value) => handleUpdateFirmante(index, 'rol', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {rolesFirmante.map((rol) => (
                                  <SelectItem key={rol} value={rol}>
                                    {rol.charAt(0).toUpperCase() + rol.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingDocumento ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de vista de documento */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingDocumento?.titulo}</DialogTitle>
            <DialogDescription>
              {viewingDocumento && getTipoLabel(viewingDocumento.tipoDocumento)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {viewingDocumento?.descripcion && (
              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">{viewingDocumento.descripcion}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Estado</h4>
                <Badge variant="outline" className={viewingDocumento ? estadoColors[viewingDocumento.estado] : ''}>
                  {viewingDocumento && estadoLabels[viewingDocumento.estado]}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Fecha de Expiración</h4>
                <p className="text-sm">
                  {viewingDocumento && format(new Date(viewingDocumento.fechaExpiracion), 'dd MMM yyyy HH:mm', { locale: es })}
                </p>
              </div>
            </div>

            {viewingDocumento?.firmantes && viewingDocumento.firmantes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Firmantes ({viewingDocumento.firmantes.length})</h4>
                <div className="space-y-2">
                  {viewingDocumento.firmantes.map((firmante, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{firmante.nombre}</p>
                            <p className="text-sm text-muted-foreground">{firmante.email}</p>
                            {firmante.telefono && (
                              <p className="text-sm text-muted-foreground">{firmante.telefono}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Rol: {firmante.rol.charAt(0).toUpperCase() + firmante.rol.slice(1)}
                              {viewingDocumento.requiereOrden && ` - Orden: ${firmante.orden}`}
                            </p>
                          </div>
                          {firmante.estado && (
                            <Badge variant="outline">
                              {firmante.estado.charAt(0).toUpperCase() + firmante.estado.slice(1)}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el documento "{documentoToDelete?.titulo}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDocumentoToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </div>
        </main>
      </div>
    </div>
  );
}
