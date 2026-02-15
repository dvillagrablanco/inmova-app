'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Home,
  ArrowLeft,
  Plus,
  Search,
  Download,
  Copy,
  Eye,
  Edit,
  Trash2,
  FileSignature,
  Scale,
  Shield,
  Building2,
  Users,
  Wallet,
  ClipboardList,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface LegalTemplate {
  id: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  contenido: string;
  variables: string[];
  jurisdiccion?: string;
  aplicableA: string[];
  activo: boolean;
  ultimaRevision?: string;
  createdAt: string;
}

interface TemplateFormData {
  nombre: string;
  categoria: string;
  descripcion: string;
  contenido: string;
  variables: string;
  jurisdiccion: string;
  aplicableA: string[];
  activo: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PlantillasLegalesPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState<LegalTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState<TemplateFormData>({
    nombre: '',
    categoria: 'contratos',
    descripcion: '',
    contenido: '',
    variables: '',
    jurisdiccion: 'España',
    aplicableA: [],
    activo: true,
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadTemplates();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, filterCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('categoria', filterCategory);

      const response = await fetch(`/api/legal-templates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.contenido) {
      toast.error('Nombre y contenido son obligatorios');
      return;
    }

    try {
      setSaving(true);
      const url = editingTemplate
        ? `/api/legal-templates/${editingTemplate.id}`
        : '/api/legal-templates';

      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables: formData.variables.split(',').map(v => v.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error('Error');

      toast.success(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
      setShowNewDialog(false);
      setEditingTemplate(null);
      loadTemplates();
      resetForm();
    } catch (error) {
      toast.error('Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;

    try {
      const response = await fetch(`/api/legal-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Plantilla eliminada');
        loadTemplates();
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleEdit = (template: LegalTemplate) => {
    setEditingTemplate(template);
    setFormData({
      nombre: template.nombre,
      categoria: template.categoria,
      descripcion: template.descripcion || '',
      contenido: template.contenido,
      variables: template.variables?.join(', ') || '',
      jurisdiccion: template.jurisdiccion || 'España',
      aplicableA: template.aplicableA || [],
      activo: template.activo,
    });
    setShowNewDialog(true);
  };

  const handlePreview = (template: LegalTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Contenido copiado al portapapeles');
  };

  const generateDocument = async (templateId: string) => {
    try {
      const response = await fetch('/api/legal-templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        toast.success('Documento generado');
      }
    } catch (error) {
      toast.error('Error al generar documento');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'contratos',
      descripcion: '',
      contenido: '',
      variables: '',
      jurisdiccion: 'España',
      aplicableA: [],
      activo: true,
    });
  };

  const getCategoryIcon = (categoria: string) => {
    const icons: Record<string, any> = {
      contratos: FileSignature,
      clausulas: Scale,
      notificaciones: ClipboardList,
      actas: FileText,
      recibos: Wallet,
      otros: FileText,
    };
    const Icon = icons[categoria?.toLowerCase()] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      contratos: 'bg-blue-100 text-blue-600',
      clausulas: 'bg-purple-100 text-purple-600',
      notificaciones: 'bg-yellow-100 text-yellow-600',
      actas: 'bg-green-100 text-green-600',
      recibos: 'bg-orange-100 text-orange-600',
      otros: 'bg-gray-100 text-gray-600',
    };
    return colors[categoria?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  // Filtrar templates
  const filteredTemplates = templates.filter(template =>
    template.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: templates.length,
    activas: templates.filter(t => t.activo).length,
    categorias: [...new Set(templates.map(t => t.categoria))].length,
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Plantillas Legales</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Scale className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Plantillas Legales</h1>
              <p className="text-muted-foreground">
                Contratos, cláusulas y documentos legales predefinidos
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setEditingTemplate(null); setShowNewDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Plantillas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.activas}</p>
                  <p className="text-xs text-muted-foreground">Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.categorias}</p>
                  <p className="text-xs text-muted-foreground">Categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar plantilla..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="contratos">Contratos</SelectItem>
                  <SelectItem value="clausulas">Cláusulas</SelectItem>
                  <SelectItem value="notificaciones">Notificaciones</SelectItem>
                  <SelectItem value="actas">Actas</SelectItem>
                  <SelectItem value="recibos">Recibos</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Plantillas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Sin plantillas</h3>
                <p className="text-muted-foreground mb-4">
                  Crea plantillas legales para agilizar la generación de documentos
                </p>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Plantilla
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className={`hover:shadow-md transition-all ${!template.activo && 'opacity-60'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge className={getCategoryColor(template.categoria)}>
                      {getCategoryIcon(template.categoria)}
                      <span className="ml-1 capitalize">{template.categoria}</span>
                    </Badge>
                    {!template.activo && (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-2">{template.nombre}</CardTitle>
                  {template.descripcion && (
                    <CardDescription className="line-clamp-2">
                      {template.descripcion}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {template.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables.slice(0, 3).map((v, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {`{${v}}`}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-muted-foreground">
                      {template.jurisdiccion || 'España'}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(template.contenido)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Dialog Nueva/Editar Plantilla */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla Legal'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Modifica los datos de la plantilla' : 'Crea una nueva plantilla de documento legal'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej: Contrato de Arrendamiento"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label>Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contratos">Contratos</SelectItem>
                    <SelectItem value="clausulas">Cláusulas</SelectItem>
                    <SelectItem value="notificaciones">Notificaciones</SelectItem>
                    <SelectItem value="actas">Actas</SelectItem>
                    <SelectItem value="recibos">Recibos</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                placeholder="Breve descripción de la plantilla"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div>
              <Label>Contenido *</Label>
              <Textarea
                placeholder="Contenido de la plantilla. Usa {variable} para campos dinámicos."
                className="min-h-[200px] font-mono text-sm"
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa llaves para variables dinámicas: {'{nombre_inquilino}'}, {'{direccion}'}, {'{fecha}'}
              </p>
            </div>

            <div>
              <Label>Variables (separadas por coma)</Label>
              <Input
                placeholder="nombre_inquilino, direccion, fecha, precio"
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
              />
            </div>

            <div>
              <Label>Jurisdicción</Label>
              <Select
                value={formData.jurisdiccion}
                onValueChange={(value) => setFormData({ ...formData, jurisdiccion: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="España">España</SelectItem>
                  <SelectItem value="Cataluña">Cataluña</SelectItem>
                  <SelectItem value="País Vasco">País Vasco</SelectItem>
                  <SelectItem value="Navarra">Navarra</SelectItem>
                  <SelectItem value="Internacional">Internacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setEditingTemplate(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Preview */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.nombre}</DialogTitle>
            <DialogDescription>
              Vista previa del contenido de la plantilla
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] border rounded-lg p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {selectedTemplate?.contenido}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => selectedTemplate && copyToClipboard(selectedTemplate.contenido)}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
            <Button onClick={() => setShowPreviewDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
