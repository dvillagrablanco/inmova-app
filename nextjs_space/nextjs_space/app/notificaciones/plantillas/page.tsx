'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Mail,
  Bell,
  MessageSquare,
  Globe,
  Building,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '@/lib/logger';

interface NotificationTemplate {
  id: string;
  companyId?: string;
  nombre: string;
  categoria: string;
  asuntoEmail?: string;
  mensajeEmail?: string;
  mensajePush?: string;
  mensajeSMS?: string;
  variables: string[];
  esPlantillaGlobal: boolean;
  activa: boolean;
  vecesUsada: number;
}

const CATEGORIAS = [
  { value: 'pagos', label: 'Pagos' },
  { value: 'contratos', label: 'Contratos' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'general', label: 'General' },
];

export default function NotificationTemplatesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>({
    nombre: '',
    categoria: 'general',
    asuntoEmail: '',
    mensajeEmail: '',
    mensajePush: '',
    mensajeSMS: '',
    variables: [],
    activa: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchTemplates();
    }
  }, [status, router]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notification-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      logger.error('Error fetching templates:', error);
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (
        !formData.nombre ||
        (!formData.mensajeEmail && !formData.mensajePush && !formData.mensajeSMS)
      ) {
        toast.error('Nombre y al menos un mensaje son obligatorios');
        return;
      }

      const url = editingTemplate
        ? `/api/notification-templates/${editingTemplate.id}`
        : '/api/notification-templates';

      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingTemplate ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente'
        );
        setIsDialogOpen(false);
        resetForm();
        fetchTemplates();
      } else {
        toast.error('Error al guardar la plantilla');
      }
    } catch (error) {
      logger.error('Error saving template:', error);
      toast.error('Error al guardar la plantilla');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) return;

    try {
      const response = await fetch(`/api/notification-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Plantilla eliminada exitosamente');
        fetchTemplates();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al eliminar la plantilla');
      }
    } catch (error) {
      logger.error('Error deleting template:', error);
      toast.error('Error al eliminar la plantilla');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'general',
      asuntoEmail: '',
      mensajeEmail: '',
      mensajePush: '',
      mensajeSMS: '',
      variables: [],
      activa: true,
    });
    setEditingTemplate(null);
  };

  const openEditDialog = (template: NotificationTemplate) => {
    if (template.esPlantillaGlobal) {
      toast.error('No se pueden editar plantillas globales');
      return;
    }
    setEditingTemplate(template);
    setFormData({
      nombre: template.nombre,
      categoria: template.categoria,
      asuntoEmail: template.asuntoEmail,
      mensajeEmail: template.mensajeEmail,
      mensajePush: template.mensajePush,
      mensajeSMS: template.mensajeSMS,
      variables: template.variables,
      activa: template.activa,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.categoria === selectedCategory);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Skeleton className="h-10 w-96" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Notificación</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona plantillas reutilizables para tus notificaciones
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Filtros por Categoría */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {CATEGORIAS.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Lista de Plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay plantillas</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera plantilla de notificación
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Plantilla
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{template.nombre}</CardTitle>
                      {template.esPlantillaGlobal ? (
                        <Badge variant="default">
                          <Globe className="w-3 h-3 mr-1" />
                          Global
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Building className="w-3 h-3 mr-1" />
                          Personalizada
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {CATEGORIAS.find((c) => c.value === template.categoria)?.label}
                    </CardDescription>
                  </div>
                  {!template.esPlantillaGlobal && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(template)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Canales Disponibles */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Canales disponibles:</p>
                  <div className="flex gap-2">
                    {template.mensajeEmail && (
                      <Badge variant="outline">
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Badge>
                    )}
                    {template.mensajePush && (
                      <Badge variant="outline">
                        <Bell className="w-3 h-3 mr-1" />
                        Push
                      </Badge>
                    )}
                    {template.mensajeSMS && (
                      <Badge variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        SMS
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Preview del Mensaje */}
                {template.mensajePush && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-xs font-medium mb-1">Vista previa:</p>
                    <p className="text-sm line-clamp-2">{template.mensajePush}</p>
                  </div>
                )}

                {/* Variables */}
                {template.variables.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {'{' + variable + '}'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estadísticas */}
                <div className="text-xs text-muted-foreground">
                  Usada {template.vecesUsada} veces
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo Crear/Editar Plantilla */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Notificación'}
            </DialogTitle>
            <DialogDescription>
              Crea plantillas reutilizables para diferentes tipos de notificaciones
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información Básica */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Recordatorio de pago"
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mensajes por Canal */}
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="push">
                  <Bell className="w-4 h-4 mr-2" />
                  Push
                </TabsTrigger>
                <TabsTrigger value="sms">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <div>
                  <Label htmlFor="asuntoEmail">Asunto del Email</Label>
                  <Input
                    id="asuntoEmail"
                    value={formData.asuntoEmail}
                    onChange={(e) => setFormData({ ...formData, asuntoEmail: e.target.value })}
                    placeholder="Asunto del correo electrónico"
                  />
                </div>
                <div>
                  <Label htmlFor="mensajeEmail">Mensaje del Email</Label>
                  <Textarea
                    id="mensajeEmail"
                    value={formData.mensajeEmail}
                    onChange={(e) => setFormData({ ...formData, mensajeEmail: e.target.value })}
                    placeholder="Contenido del correo electrónico"
                    rows={6}
                  />
                </div>
              </TabsContent>

              <TabsContent value="push" className="space-y-4">
                <div>
                  <Label htmlFor="mensajePush">Mensaje de Notificación Push</Label>
                  <Textarea
                    id="mensajePush"
                    value={formData.mensajePush}
                    onChange={(e) => setFormData({ ...formData, mensajePush: e.target.value })}
                    placeholder="Mensaje que aparecerá en la notificación push (máximo 200 caracteres)"
                    maxLength={200}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.mensajePush?.length || 0}/200 caracteres
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="sms" className="space-y-4">
                <div>
                  <Label htmlFor="mensajeSMS">Mensaje SMS</Label>
                  <Textarea
                    id="mensajeSMS"
                    value={formData.mensajeSMS}
                    onChange={(e) => setFormData({ ...formData, mensajeSMS: e.target.value })}
                    placeholder="Mensaje que se enviará por SMS (máximo 160 caracteres)"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.mensajeSMS?.length || 0}/160 caracteres
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Variables */}
            <div>
              <Label>Variables Disponibles</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Usa estas variables en tus mensajes. Se reemplazarán automáticamente:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'nombre_inquilino',
                  'monto',
                  'fecha_vencimiento',
                  'propiedad',
                  'unidad',
                  'empresa',
                ].map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {'{' + variable + '}'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
