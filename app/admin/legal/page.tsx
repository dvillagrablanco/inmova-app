'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


interface LegalTemplate {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  contenido: string;
  variables: string[];
  jurisdiccion: string | null;
  aplicableA: string[];
  activo: boolean;
  ultimaRevision: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  nombre: string;
  categoria: string;
  descripcion: string;
  contenido: string;
  variables: string;
  jurisdiccion: string;
  aplicableA: string;
  activo: boolean;
}

const categorias = [
  { value: 'contrato_arrendamiento', label: 'Contrato de Arrendamiento' },
  { value: 'anexo_contrato', label: 'Anexo de Contrato' },
  { value: 'notificacion_inquilino', label: 'Notificación a Inquilino' },
  { value: 'reclamacion', label: 'Reclamación' },
  { value: 'finalizacion_contrato', label: 'Finalización de Contrato' },
  { value: 'inspeccion', label: 'Inspección' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'otro', label: 'Otro' },
];

const tiposAplicacion = ['residencial', 'comercial', 'turistico', 'todos'];

export default function LegalPage() {
  const { data: session } = useSession() || {};
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LegalTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<LegalTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<LegalTemplate | null>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    nombre: '',
    categoria: 'contrato_arrendamiento',
    descripcion: '',
    contenido: '',
    variables: '',
    jurisdiccion: '',
    aplicableA: '',
    activo: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/legal/templates');
      if (!response.ok) throw new Error('Error al cargar plantillas');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      toast.error('Error al cargar las plantillas');
      logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(
        (template) =>
          template.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (template.descripcion &&
            template.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
          template.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((template) => template.categoria === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const handleOpenDialog = (template?: LegalTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        nombre: template.nombre,
        categoria: template.categoria,
        descripcion: template.descripcion || '',
        contenido: template.contenido,
        variables: template.variables.join(', '),
        jurisdiccion: template.jurisdiccion || '',
        aplicableA: template.aplicableA.join(', '),
        activo: template.activo,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        nombre: '',
        categoria: 'contrato_arrendamiento',
        descripcion: '',
        contenido: '',
        variables: '',
        jurisdiccion: '',
        aplicableA: '',
        activo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleViewTemplate = (template: LegalTemplate) => {
    setViewingTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        nombre: formData.nombre,
        categoria: formData.categoria,
        descripcion: formData.descripcion || null,
        contenido: formData.contenido,
        variables: formData.variables
          ? formData.variables
              .split(',')
              .map((v) => v.trim())
              .filter((v) => v)
          : [],
        jurisdiccion: formData.jurisdiccion || null,
        aplicableA: formData.aplicableA
          ? formData.aplicableA
              .split(',')
              .map((v) => v.trim())
              .filter((v) => v)
          : [],
        activo: formData.activo,
      };

      const url = editingTemplate
        ? `/api/admin/legal/templates/${editingTemplate.id}`
        : '/api/admin/legal/templates';

      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar la plantilla');
      }

      toast.success(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
      handleCloseDialog();
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la plantilla');
      logger.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/admin/legal/templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar la plantilla');

      toast.success('Plantilla eliminada');
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Error al eliminar la plantilla');
      logger.error(error instanceof Error ? error.message : String(error));
    }
  };

  const openDeleteDialog = (template: LegalTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const getCategoriaLabel = (categoria: string) => {
    const cat = categorias.find((c) => c.value === categoria);
    return cat ? cat.label : categoria;
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
                <h1 className="text-3xl font-bold">Plantillas Legales</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona las plantillas legales y documentos de la plataforma
                </p>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Plantilla
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
                        placeholder="Buscar plantillas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-[250px]">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de plantillas */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No se encontraron plantillas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.nombre}</CardTitle>
                          <CardDescription className="mt-1">
                            {getCategoriaLabel(template.categoria)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewTemplate(template)}
                            title="Ver plantilla"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(template)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(template)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {template.descripcion && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {template.descripcion}
                        </p>
                      )}
                      <div className="space-y-2">
                        {template.jurisdiccion && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Jurisdicción:</span>
                            <span className="text-sm font-medium">{template.jurisdiccion}</span>
                          </div>
                        )}
                        {template.variables.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Variables:</span>
                            <span className="text-sm font-medium">{template.variables.length}</span>
                          </div>
                        )}
                        {template.aplicableA.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Aplicable a:</span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {template.aplicableA.map((tipo) => (
                                <Badge key={tipo} variant="outline" className="text-xs">
                                  {tipo}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {template.ultimaRevision && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Última revisión:</span>
                            <span className="text-sm">
                              {format(new Date(template.ultimaRevision), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {template.activo ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Activa
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-700 border-gray-200"
                            >
                              Inactiva
                            </Badge>
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
                    {editingTemplate ? 'Editar Plantilla Legal' : 'Nueva Plantilla Legal'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTemplate
                      ? 'Modifica los detalles de la plantilla'
                      : 'Completa la información de la nueva plantilla legal'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="ej: Contrato Estándar de Arrendamiento"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoria">Categoría *</Label>
                        <Select
                          value={formData.categoria}
                          onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jurisdiccion">Jurisdicción</Label>
                        <Input
                          id="jurisdiccion"
                          value={formData.jurisdiccion}
                          onChange={(e) =>
                            setFormData({ ...formData, jurisdiccion: e.target.value })
                          }
                          placeholder="ej: España, Madrid"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        rows={2}
                        placeholder="Breve descripción de la plantilla"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contenido">Contenido de la Plantilla *</Label>
                      <Textarea
                        id="contenido"
                        value={formData.contenido}
                        onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                        rows={10}
                        placeholder="Escribe el contenido de la plantilla aquí..."
                        required
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tip: Usa {`{{variable}}`} para definir variables que se pueden reemplazar
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="variables">Variables (separadas por comas)</Label>
                      <Input
                        id="variables"
                        value={formData.variables}
                        onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                        placeholder="ej: nombre_inquilino, direccion_propiedad, fecha_inicio"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lista las variables que se usarán en la plantilla
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aplicableA">Aplicable a (separados por comas)</Label>
                      <Input
                        id="aplicableA"
                        value={formData.aplicableA}
                        onChange={(e) => setFormData({ ...formData, aplicableA: e.target.value })}
                        placeholder="ej: residencial, comercial, turistico"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tipos de propiedades a las que aplica esta plantilla
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="activo">Plantilla Activa</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Las plantillas activas están disponibles para su uso
                        </p>
                      </div>
                      <Switch
                        id="activo"
                        checked={formData.activo}
                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingTemplate ? 'Actualizar' : 'Crear'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog de vista de plantilla */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{viewingTemplate?.nombre}</DialogTitle>
                  <DialogDescription>
                    {viewingTemplate && getCategoriaLabel(viewingTemplate.categoria)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {viewingTemplate?.descripcion && (
                    <div>
                      <h4 className="font-semibold mb-2">Descripción</h4>
                      <p className="text-sm text-muted-foreground">{viewingTemplate.descripcion}</p>
                    </div>
                  )}

                  {viewingTemplate?.jurisdiccion && (
                    <div>
                      <h4 className="font-semibold mb-2">Jurisdicción</h4>
                      <p className="text-sm">{viewingTemplate.jurisdiccion}</p>
                    </div>
                  )}

                  {viewingTemplate?.variables && viewingTemplate.variables.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Variables</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingTemplate.variables.map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingTemplate?.aplicableA && viewingTemplate.aplicableA.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Aplicable a</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingTemplate.aplicableA.map((tipo) => (
                          <Badge key={tipo} variant="outline">
                            {tipo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Contenido</h4>
                    <div className="bg-muted p-4 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {viewingTemplate?.contenido}
                      </pre>
                    </div>
                  </div>
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
                    ¿Estás seguro de que deseas eliminar la plantilla "{templateToDelete?.nombre}"?
                    Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setTemplateToDelete(null);
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
        </main>
      </div>
    </div>
  );
}
