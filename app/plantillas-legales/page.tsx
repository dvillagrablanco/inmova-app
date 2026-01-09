'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Sparkles,
  Copy,
  Download,
  Wand2,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
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

interface AIGeneratedTemplate {
  titulo: string;
  contenido: string;
  variables: string[];
  descripcionVariables?: Record<string, string>;
  notas?: string;
  clausulasOpcionales?: string[];
}

const categorias = [
  { value: 'contrato_arrendamiento', label: 'Contrato de Arrendamiento' },
  { value: 'anexo_contrato', label: 'Anexo de Contrato' },
  { value: 'notificacion_inquilino', label: 'Notificación a Inquilino' },
  { value: 'reclamacion', label: 'Reclamación' },
  { value: 'finalizacion_contrato', label: 'Finalización de Contrato' },
  { value: 'inspeccion', label: 'Inspección' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'autorizacion', label: 'Autorización' },
  { value: 'otro', label: 'Otro' },
];

const tiposGeneracionIA = [
  { value: 'contrato_vivienda', label: 'Contrato de alquiler de vivienda' },
  { value: 'contrato_local', label: 'Contrato de alquiler de local comercial' },
  { value: 'contrato_habitacion', label: 'Contrato de alquiler de habitación' },
  { value: 'prorroga_contrato', label: 'Prórroga de contrato' },
  { value: 'rescision_contrato', label: 'Rescisión de contrato' },
  { value: 'carta_impago', label: 'Carta de reclamación de impago' },
  { value: 'inventario', label: 'Inventario de inmueble' },
  { value: 'acta_entrega', label: 'Acta de entrega de llaves' },
  { value: 'autorizacion_obras', label: 'Autorización de obras menores' },
  { value: 'incremento_renta', label: 'Notificación de incremento de renta' },
];

export default function PlantillasLegalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LegalTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<LegalTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<LegalTemplate | null>(null);

  // AI Generation states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTipo, setAiTipo] = useState('contrato_vivienda');
  const [aiContexto, setAiContexto] = useState('');
  const [aiJurisdiccion, setAiJurisdiccion] = useState('España');
  const [aiResult, setAiResult] = useState<AIGeneratedTemplate | null>(null);

  // Permission check
  const canEdit = ['super_admin', 'administrador', 'gestor'].includes(session?.user?.role || '');
  const canDelete = ['super_admin', 'administrador'].includes(session?.user?.role || '');

  const [formData, setFormData] = useState<TemplateFormData>({
    nombre: '',
    categoria: 'contrato_arrendamiento',
    descripcion: '',
    contenido: '',
    variables: '',
    jurisdiccion: 'España',
    aplicableA: '',
    activo: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchTemplates();
    }
  }, [status, router]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/legal-templates');
      if (!response.ok) {
        throw new Error('Error al cargar plantillas');
      }
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
            template.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
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
        jurisdiccion: template.jurisdiccion || 'España',
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
        jurisdiccion: 'España',
        aplicableA: '',
        activo: true,
      });
    }
    setIsDialogOpen(true);
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
          ? formData.variables.split(',').map((v) => v.trim()).filter((v) => v)
          : [],
        jurisdiccion: formData.jurisdiccion || null,
        aplicableA: formData.aplicableA
          ? formData.aplicableA.split(',').map((v) => v.trim()).filter((v) => v)
          : [],
        activo: formData.activo,
      };

      const url = editingTemplate
        ? `/api/legal-templates/${editingTemplate.id}`
        : '/api/legal-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar');
      }

      toast.success(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
      setIsDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la plantilla');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/legal-templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      toast.success('Plantilla eliminada');
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Error al eliminar la plantilla');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Contenido copiado al portapapeles');
  };

  const handleDownload = (template: LegalTemplate) => {
    const blob = new Blob([template.contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.nombre.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Plantilla descargada');
  };

  // AI Generation
  const handleGenerateWithAI = async () => {
    if (!aiContexto.trim()) {
      toast.error('Por favor describe el contexto del documento');
      return;
    }

    setAiGenerating(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/legal-templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: aiTipo,
          contexto: aiContexto,
          jurisdiccion: aiJurisdiccion,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar');
      }

      const result = await response.json();
      setAiResult(result);
      toast.success('Documento generado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el documento');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUseAIResult = () => {
    if (!aiResult) return;

    setFormData({
      nombre: aiResult.titulo,
      categoria: 'contrato_arrendamiento',
      descripcion: aiResult.notas || '',
      contenido: aiResult.contenido,
      variables: aiResult.variables?.join(', ') || '',
      jurisdiccion: aiJurisdiccion,
      aplicableA: '',
      activo: true,
    });

    setIsAIDialogOpen(false);
    setIsDialogOpen(true);
    setAiResult(null);
    setAiContexto('');
  };

  const getCategoriaLabel = (categoria: string) => {
    const cat = categorias.find((c) => c.value === categoria);
    return cat ? cat.label : categoria;
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Plantillas Legales
            </h1>
            <p className="text-muted-foreground mt-1">
              Genera y gestiona documentos legales profesionales con ayuda de IA
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAIDialogOpen(true)}
              variant="outline"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200"
            >
              <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
              Generar con IA
            </Button>
            {canEdit && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Plantilla
              </Button>
            )}
          </div>
        </div>

        {/* AI Feature Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Wand2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">Asistente Legal con IA</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Genera contratos, notificaciones y documentos legales personalizados en segundos.
                  Nuestra IA conoce la legislación española vigente y crea documentos profesionales
                  adaptados a tus necesidades.
                </p>
              </div>
              <Button
                onClick={() => setIsAIDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Empezar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
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

        {/* Templates Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No se encontraron plantillas</p>
              <Button onClick={() => setIsAIDialogOpen(true)} variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Crear una con IA
              </Button>
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
                    <Badge variant={template.activo ? 'default' : 'secondary'}>
                      {template.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.descripcion && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.descripcion}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {template.jurisdiccion && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Jurisdicción:</span>
                        <span>{template.jurisdiccion}</span>
                      </div>
                    )}
                    {template.variables.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Variables:</span>
                        <span>{template.variables.length}</span>
                      </div>
                    )}
                    {template.ultimaRevision && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Última revisión:</span>
                        <span>
                          {format(new Date(template.ultimaRevision), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setViewingTemplate(template);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyContent(template.contenido)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(template)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTemplateToDelete(template);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* AI Generation Dialog */}
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Generar Documento Legal con IA
              </DialogTitle>
              <DialogDescription>
                Describe qué tipo de documento necesitas y nuestra IA lo generará adaptado a la
                legislación española
              </DialogDescription>
            </DialogHeader>

            {!aiResult ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select value={aiTipo} onValueChange={setAiTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposGeneracionIA.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jurisdicción</Label>
                  <Input
                    value={aiJurisdiccion}
                    onChange={(e) => setAiJurisdiccion(e.target.value)}
                    placeholder="España, Madrid..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Describe el contexto y detalles específicos *</Label>
                  <Textarea
                    value={aiContexto}
                    onChange={(e) => setAiContexto(e.target.value)}
                    placeholder="Ej: Contrato para un piso de 3 habitaciones en Barcelona, alquiler mensual de 1.200€, con opción a mascotas pequeñas, duración de 1 año..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cuanto más detallada sea la descripción, mejor será el resultado
                  </p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleGenerateWithAI}
                    disabled={aiGenerating || !aiContexto.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generar Documento
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">{aiResult.titulo}</h3>
                  {aiResult.notas && (
                    <p className="text-sm text-green-700">{aiResult.notas}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Contenido generado</Label>
                  <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {aiResult.contenido}
                    </pre>
                  </div>
                </div>

                {aiResult.variables && aiResult.variables.length > 0 && (
                  <div className="space-y-2">
                    <Label>Variables a personalizar</Label>
                    <div className="flex flex-wrap gap-2">
                      {aiResult.variables.map((variable) => (
                        <Badge key={variable} variant="secondary">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {aiResult.clausulasOpcionales && aiResult.clausulasOpcionales.length > 0 && (
                  <div className="space-y-2">
                    <Label>Cláusulas opcionales disponibles</Label>
                    <ul className="text-sm list-disc list-inside text-muted-foreground">
                      {aiResult.clausulasOpcionales.map((clausula, i) => (
                        <li key={i}>{clausula}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiResult(null);
                      setAiContexto('');
                    }}
                  >
                    Generar otro
                  </Button>
                  <Button variant="outline" onClick={() => handleCopyContent(aiResult.contenido)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  {canEdit && (
                    <Button onClick={handleUseAIResult}>
                      <Plus className="mr-2 h-4 w-4" />
                      Guardar como Plantilla
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create/Edit Dialog */}
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
                      onChange={(e) => setFormData({ ...formData, jurisdiccion: e.target.value })}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aplicableA">Aplicable a (separados por comas)</Label>
                  <Input
                    id="aplicableA"
                    value={formData.aplicableA}
                    onChange={(e) => setFormData({ ...formData, aplicableA: e.target.value })}
                    placeholder="ej: residencial, comercial, turistico"
                  />
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingTemplate ? 'Actualizar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
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

              {viewingTemplate?.variables && viewingTemplate.variables.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {`{{${variable}}}`}
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
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => viewingTemplate && handleCopyContent(viewingTemplate.contenido)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                onClick={() => viewingTemplate && handleDownload(viewingTemplate)}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
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
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
