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
import { Switch } from '@/components/ui/switch';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Search,
  Sparkles,
  Wand2,
  Loader2,
  Save,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface EmailTemplate {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  asunto: string;
  contenidoHtml: string;
  contenidoTexto: string;
  variables: string[];
  activa: boolean;
  envioAutomatico: boolean;
  eventoTrigger?: string;
  createdAt: string;
  updatedAt: string;
}

const tiposEmail = [
  { value: 'bienvenida', label: 'Bienvenida' },
  { value: 'recordatorio_pago', label: 'Recordatorio de Pago' },
  { value: 'confirmacion_pago', label: 'Confirmación de Pago' },
  { value: 'confirmacion_reserva', label: 'Confirmación de Reserva' },
  { value: 'notificacion_contrato', label: 'Notificación de Contrato' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'incidencia', label: 'Incidencia' },
  { value: 'renovacion_contrato', label: 'Renovación de Contrato' },
  { value: 'fin_contrato', label: 'Fin de Contrato' },
  { value: 'factura', label: 'Factura' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'general', label: 'General' },
];

const variablesDisponibles = [
  { nombre: '{{nombre}}', descripcion: 'Nombre del destinatario' },
  { nombre: '{{email}}', descripcion: 'Email del destinatario' },
  { nombre: '{{empresa}}', descripcion: 'Nombre de la empresa' },
  { nombre: '{{propiedad}}', descripcion: 'Dirección de la propiedad' },
  { nombre: '{{unidad}}', descripcion: 'Número de unidad' },
  { nombre: '{{monto}}', descripcion: 'Monto económico' },
  { nombre: '{{fecha}}', descripcion: 'Fecha' },
  { nombre: '{{enlace}}', descripcion: 'Enlace de acción' },
];

const tiposGeneracionIA = [
  { value: 'bienvenida_inquilino', label: 'Bienvenida a nuevo inquilino' },
  { value: 'recordatorio_pago', label: 'Recordatorio de pago pendiente' },
  { value: 'confirmacion_pago', label: 'Confirmación de pago recibido' },
  { value: 'notificacion_mantenimiento', label: 'Aviso de mantenimiento programado' },
  { value: 'respuesta_incidencia', label: 'Respuesta a incidencia' },
  { value: 'renovacion_contrato', label: 'Propuesta de renovación de contrato' },
  { value: 'fin_contrato', label: 'Aviso de fin de contrato' },
  { value: 'incremento_renta', label: 'Notificación de incremento de renta' },
  { value: 'agradecimiento', label: 'Agradecimiento general' },
];

export default function PlantillasEmailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillas, setPlantillas] = useState<EmailTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');

  // Dialog states
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);

  // AI states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTipo, setAiTipo] = useState('bienvenida_inquilino');
  const [aiContexto, setAiContexto] = useState('');
  const [aiTono, setAiTono] = useState('profesional');

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'general',
    asunto: '',
    contenidoHtml: '',
    contenidoTexto: '',
    activa: true,
    envioAutomatico: false,
    eventoTrigger: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/dashboard');
        toast.error('Solo Super Admin puede acceder');
        return;
      }
      fetchPlantillas();
    }
  }, [status, session, router]);

  const fetchPlantillas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/templates');
      if (response.ok) {
        const data = await response.json();
        setPlantillas(data.templates || []);
      }
    } catch (error) {
      logger.error('Error fetching email templates:', error);
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        nombre: template.nombre,
        descripcion: template.descripcion || '',
        tipo: template.tipo,
        asunto: template.asunto,
        contenidoHtml: template.contenidoHtml,
        contenidoTexto: template.contenidoTexto,
        activa: template.activa,
        envioAutomatico: template.envioAutomatico,
        eventoTrigger: template.eventoTrigger || '',
      });
    } else {
      setEditingTemplate(null);
      resetForm();
    }
    setShowFormDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'general',
      asunto: '',
      contenidoHtml: '',
      contenidoTexto: '',
      activa: true,
      envioAutomatico: false,
      eventoTrigger: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingTemplate
        ? `/api/email/templates/${editingTemplate.id}`
        : '/api/email/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables: extractVariables(formData.contenidoHtml + formData.asunto),
        }),
      });

      if (response.ok) {
        toast.success(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
        setShowFormDialog(false);
        fetchPlantillas();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      const response = await fetch(`/api/email/templates/${deletingTemplate.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Plantilla eliminada');
        setShowDeleteDialog(false);
        setDeletingTemplate(null);
        fetchPlantillas();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar plantilla');
    }
  };

  const handleDuplicate = (template: EmailTemplate) => {
    setEditingTemplate(null);
    setFormData({
      nombre: `${template.nombre} (Copia)`,
      descripcion: template.descripcion || '',
      tipo: template.tipo,
      asunto: template.asunto,
      contenidoHtml: template.contenidoHtml,
      contenidoTexto: template.contenidoTexto,
      activa: false,
      envioAutomatico: false,
      eventoTrigger: '',
    });
    setShowFormDialog(true);
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches)];
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      contenidoHtml: prev.contenidoHtml + variable,
    }));
  };

  // AI Generation
  const handleGenerateWithAI = async () => {
    if (!aiContexto.trim()) {
      toast.error('Por favor describe el contexto del email');
      return;
    }

    setAiGenerating(true);

    try {
      const response = await fetch('/api/email/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: aiTipo,
          contexto: aiContexto,
          tono: aiTono,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar');
      }

      const result = await response.json();

      setFormData({
        nombre: result.nombre || `Email ${aiTipo}`,
        descripcion: result.descripcion || '',
        tipo: 'general',
        asunto: result.asunto || '',
        contenidoHtml: result.contenidoHtml || '',
        contenidoTexto: result.contenidoTexto || '',
        activa: true,
        envioAutomatico: false,
        eventoTrigger: '',
      });

      setShowAIDialog(false);
      setShowFormDialog(true);
      toast.success('Email generado con IA');
    } catch (error) {
      toast.error('Error al generar email con IA');
    } finally {
      setAiGenerating(false);
    }
  };

  // Filter templates
  const plantillasFiltradas = plantillas.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.asunto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || p.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Plantillas de Email
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las plantillas de correo electrónico de la plataforma
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAIDialog(true)}
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10"
            >
              <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
              Generar con IA
            </Button>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </div>
        </div>

        {/* AI Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Wand2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">Asistente de Email con IA</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Genera emails profesionales adaptados a cada situación. La IA crea asuntos atractivos
                  y contenido personalizado con las variables correctas.
                </p>
              </div>
              <Button onClick={() => setShowAIDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                Empezar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {tiposEmail.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {plantillasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Mail className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No hay plantillas de email</p>
              <Button onClick={() => setShowAIDialog(true)} variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Crear una con IA
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantillasFiltradas.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.nombre}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-1">
                        {template.asunto}
                      </CardDescription>
                    </div>
                    <Badge variant={template.activa ? 'default' : 'secondary'}>
                      {template.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span>{tiposEmail.find((t) => t.value === template.tipo)?.label || template.tipo}</span>
                    </div>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((v) => (
                          <Badge key={v} variant="outline" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleOpenForm(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDeletingTemplate(template);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* AI Generation Dialog */}
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Generar Email con IA
              </DialogTitle>
              <DialogDescription>
                Describe qué tipo de email necesitas y la IA lo generará
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de email</Label>
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
                <Label>Tono</Label>
                <Select value={aiTono} onValueChange={setAiTono}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profesional">Profesional</SelectItem>
                    <SelectItem value="amigable">Amigable</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="cercano">Cercano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contexto y detalles *</Label>
                <Textarea
                  value={aiContexto}
                  onChange={(e) => setAiContexto(e.target.value)}
                  placeholder="Ej: Email de bienvenida para inquilinos de un edificio de oficinas premium en el centro de Madrid..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>
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
                    Generar Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Form Dialog */}
        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Email'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre de la plantilla"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposEmail.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción breve"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Asunto del email *</Label>
                  <Input
                    value={formData.asunto}
                    onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                    placeholder="Asunto del correo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Contenido HTML *</Label>
                    <div className="flex gap-1 flex-wrap">
                      {variablesDisponibles.slice(0, 4).map((v) => (
                        <Button
                          key={v.nombre}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(v.nombre)}
                        >
                          {v.nombre}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={formData.contenidoHtml}
                    onChange={(e) => setFormData({ ...formData, contenidoHtml: e.target.value })}
                    placeholder="<html>...</html>"
                    rows={8}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contenido texto plano</Label>
                  <Textarea
                    value={formData.contenidoTexto}
                    onChange={(e) => setFormData({ ...formData, contenidoTexto: e.target.value })}
                    placeholder="Versión en texto plano..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Plantilla Activa</Label>
                    <p className="text-xs text-muted-foreground">Disponible para envíos</p>
                  </div>
                  <Switch
                    checked={formData.activa}
                    onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowFormDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editingTemplate ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewTemplate?.nombre}</DialogTitle>
              <DialogDescription>Asunto: {previewTemplate?.asunto}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="border rounded-lg p-4 bg-white">
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewTemplate?.contenidoHtml || '', {
                    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'div', 'span', 
                      'strong', 'b', 'em', 'i', 'u', 'a', 'img', 'ul', 'ol', 'li', 'table', 'thead', 
                      'tbody', 'tr', 'th', 'td', 'blockquote', 'pre', 'code'],
                    allowedAttributes: {
                      a: ['href', 'title', 'target', 'rel'],
                      img: ['src', 'alt', 'width', 'height', 'style'],
                      '*': ['style', 'class'],
                    },
                  }) }}
                  className="prose max-w-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowPreviewDialog(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Plantilla</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de eliminar "{deletingTemplate?.nombre}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
