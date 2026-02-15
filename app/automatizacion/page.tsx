'use client';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/lazy-dialog';
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
  Zap,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Bell,
  Mail,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Trash,
  TrendingUp,
  FileText,
  Users,
  DollarSign,
  AlertCircle,
  Eye,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Automation {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  triggerType: string;
  activa: boolean;
  vecesEjecutada: number;
  ultimaEjecucion?: string;
  proximaEjecucion?: string;
  prioridad: string;
  createdAt: string;
}

interface AutomationTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  icono: string;
  popular: boolean;
}

interface AutomationExecution {
  id: string;
  automationId: string;
  estado: string;
  mensaje?: string;
  ejecutadaEn: string;
  duracion?: number;
}

const AUTOMATION_TYPES = [
  { value: 'recordatorio', label: 'Recordatorio' },
  { value: 'notificacion', label: 'Notificación' },
  { value: 'accion', label: 'Acción' },
  { value: 'workflow', label: 'Workflow' },
];

const TRIGGER_TYPES = [
  { value: 'fecha', label: 'Fecha/Hora' },
  { value: 'evento', label: 'Evento del Sistema' },
  { value: 'condicion', label: 'Condición' },
  { value: 'manual', label: 'Manual' },
];

const PRIORITIES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

export default function AutomatizacionPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExecutionsDialog, setShowExecutionsDialog] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'recordatorio',
    triggerType: 'fecha',
    prioridad: 'media',
    activa: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar automatizaciones
      const automationsRes = await fetch('/api/automations');
      if (automationsRes.ok) {
        const automationsData = await automationsRes.json();
        setAutomations(automationsData);
      }

      // Cargar plantillas
      const templatesRes = await fetch('/api/automation-templates');
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }
    } catch (error) {
      logger.error('Error loading automations:', error);
      toast.error('Error al cargar automatizaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async (automationId: string) => {
    try {
      const res = await fetch(`/api/automations/${automationId}/executions`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(data);
        setShowExecutionsDialog(true);
      }
    } catch (error) {
      logger.error('Error loading executions:', error);
      toast.error('Error al cargar historial');
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Automatización creada con éxito');
        setShowCreateDialog(false);
        loadData();
        setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'recordatorio',
      triggerType: 'fecha',
      prioridad: 'media',
      activa: true,
        });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear automatización');
      }
    } catch (error) {
      logger.error('Error creating automation:', error);
      toast.error('Error al crear automatización');
    }
  };

  const toggleAutomation = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/automations/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !currentState }),
      });

      if (res.ok) {
        toast.success(`Automatización ${!currentState ? 'activada' : 'desactivada'}`);
        loadData();
      } else {
        toast.error('Error al actualizar automatización');
      }
    } catch (error) {
      logger.error('Error toggling automation:', error);
      toast.error('Error al actualizar automatización');
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta automatización?')) return;

    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Automatización eliminada');
        loadData();
      } else {
        toast.error('Error al eliminar automatización');
      }
    } catch (error) {
      logger.error('Error deleting automation:', error);
      toast.error('Error al eliminar automatización');
    }
  };

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'recordatorio':
        return Clock;
      case 'notificacion':
        return Bell;
      case 'accion':
        return Zap;
      case 'workflow':
        return Activity;
      default:
        return Zap;
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Automatizaciones Inteligentes
            </h1>
            <p className="text-gray-600 mt-1">
              Crea y gestiona flujos automatizados para tu negocio
            </p>
          </div>
      <Button onClick={() => setShowCreateDialog(true)} className="gradient-primary">
        <Plus className="h-4 w-4 mr-2" />
        Nueva Automatización
      </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Automatizaciones</CardTitle>
        <Zap className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold">{automations.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Activas</CardTitle>
        <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold">
        {automations.filter((a) => a.activa).length}
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Ejecuciones</CardTitle>
        <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold">
        {automations.reduce((sum, a) => sum + (a.vecesEjecutada || 0), 0)}
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Plantillas</CardTitle>
        <FileText className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold">{templates.length}</div>
        </CardContent>
      </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="automations" className="space-y-4">
      <TabsList>
        <TabsTrigger value="automations">Mis Automatizaciones</TabsTrigger>
        <TabsTrigger value="templates">Plantillas</TabsTrigger>
      </TabsList>

      {/* Automations Tab */}
      <TabsContent value="automations" className="space-y-4">
        {automations.length === 0 ? (
        <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
        <Zap className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay automatizaciones</h3>
        <p className="text-gray-500 mb-4">
        Crea tu primera automatización para empezar
        </p>
        <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nueva Automatización
        </Button>
        </CardContent>
        </Card>
        ) : (
        <div className="grid grid-cols-1 gap-4">
        {automations.map((automation) => {
        const TypeIcon = getIconForType(automation.tipo);
        return (
        <Card key={automation.id}>
        <CardHeader>
        <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
        <TypeIcon className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
        <CardTitle className="text-lg">{automation.nombre}</CardTitle>
        <CardDescription>{automation.descripcion}</CardDescription>
        </div>
        </div>
        <div className="flex items-center gap-2">
        <Badge variant={automation.activa ? 'default' : 'secondary'}>
        {automation.activa ? 'Activa' : 'Inactiva'}
        </Badge>
        <Badge variant="outline">{automation.tipo}</Badge>
        </div>
        </div>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
        <div className="text-sm text-gray-600">Tipo de Disparador</div>
        <div className="font-semibold">{automation.triggerType}</div>
        </div>
        <div>
        <div className="text-sm text-gray-600">Ejecuciones</div>
        <div className="font-semibold">{automation.vecesEjecutada}</div>
        </div>
        <div>
        <div className="text-sm text-gray-600">Última Ejecución</div>
        <div className="font-semibold">
        {automation.ultimaEjecucion
        ? format(
        new Date(automation.ultimaEjecucion),
        'dd/MM/yyyy HH:mm',
        { locale: es }
        )
        : 'Nunca'}
        </div>
        </div>
        <div>
        <div className="text-sm text-gray-600">Prioridad</div>
        <Badge
        variant={
        automation.prioridad === 'alta' ? 'destructive' : 'outline'
        }
        >
        {automation.prioridad}
        </Badge>
        </div>
        </div>
        <div className="flex gap-2">
        <Button
        size="sm"
        variant="outline"
        onClick={() => toggleAutomation(automation.id, automation.activa)}
        >
        {automation.activa ? (
        <Pause className="h-4 w-4 mr-1" />
        ) : (
        <Play className="h-4 w-4 mr-1" />
        )}
        {automation.activa ? 'Desactivar' : 'Activar'}
        </Button>
        <Button
        size="sm"
        variant="outline"
        onClick={() => {
        setSelectedAutomation(automation.id);
        loadExecutions(automation.id);
        }}
        >
        <Eye className="h-4 w-4 mr-1" />
        Ver Historial
        </Button>
        <Button
        size="sm"
        variant="outline"
        onClick={() => deleteAutomation(automation.id)}
        className="text-red-600 hover:bg-red-50"
        >
        <Trash className="h-4 w-4 mr-1" />
        Eliminar
        </Button>
        </div>
        </CardContent>
        </Card>
        );
        })}
        </div>
        )}
      </TabsContent>

      {/* Templates Tab */}
      <TabsContent value="templates" className="space-y-4">
        {templates.length === 0 ? (
        <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay plantillas disponibles</h3>
        <p className="text-gray-500">
        Las plantillas estarán disponibles próximamente
        </p>
        </CardContent>
        </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
        <div className="flex items-center gap-2 mb-2">
        {template.popular && (
        <Badge variant="default" className="bg-yellow-500">
        Popular
        </Badge>
        )}
        <Badge variant="outline">{template.categoria}</Badge>
        </div>
        <CardTitle className="text-base">{template.nombre}</CardTitle>
        <CardDescription className="text-sm">
        {template.descripcion}
        </CardDescription>
        </CardHeader>
        <CardContent>
        <Button size="sm" className="w-full">
        Usar Plantilla
        </Button>
        </CardContent>
        </Card>
        ))}
        </div>
        )}
      </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Nueva Automatización</DialogTitle>
        <DialogDescription>
        Crea una nueva automatización para gestionar tareas recurrentes
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
      <Label htmlFor="nombre">Nombre</Label>
      <Input
        id="nombre"
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        placeholder="Ej: Recordatorio de pago mensual"
        />
        </div>
        <div>
      <Label htmlFor="descripcion">Descripción</Label>
      <Textarea
        id="descripcion"
        value={formData.descripcion}
        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
        placeholder="Describe qué hace esta automatización"
        rows={3}
        />
        </div>
        <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <Select
        value={formData.tipo}
        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
        >
        <SelectTrigger>
        <SelectValue />
        </SelectTrigger>
        <SelectContent>
        {AUTOMATION_TYPES.map((type) => (
        <SelectItem key={type.value} value={type.value}>
        {type.label}
        </SelectItem>
        ))}
        </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="triggerType">Disparador</Label>
        <Select
        value={formData.triggerType}
        onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
        >
        <SelectTrigger>
        <SelectValue />
        </SelectTrigger>
        <SelectContent>
        {TRIGGER_TYPES.map((type) => (
        <SelectItem key={type.value} value={type.value}>
        {type.label}
        </SelectItem>
        ))}
        </SelectContent>
        </Select>
      </div>
        </div>
        <div>
      <Label htmlFor="prioridad">Prioridad</Label>
      <Select
        value={formData.prioridad}
        onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
        >
        <SelectTrigger>
        <SelectValue />
        </SelectTrigger>
        <SelectContent>
        {PRIORITIES.map((priority) => (
        <SelectItem key={priority.value} value={priority.value}>
        {priority.label}
        </SelectItem>
        ))}
        </SelectContent>
      </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
        Cancelar
        </Button>
        <Button onClick={handleCreate}>Crear Automatización</Button>
      </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Executions Dialog */}
      <Dialog open={showExecutionsDialog} onOpenChange={setShowExecutionsDialog}>
        <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Historial de Ejecuciones</DialogTitle>
        <DialogDescription>Últimas ejecuciones de esta automatización</DialogDescription>
      </DialogHeader>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {executions.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <p>No hay ejecuciones registradas</p>
      </div>
        ) : (
        executions.map((execution) => (
        <Card key={execution.id}>
        <CardContent className="pt-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
        {execution.estado === 'exitosa' ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
        ) : execution.estado === 'fallida' ? (
        <XCircle className="h-5 w-5 text-red-600" />
        ) : (
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        )}
        <div>
        <div className="font-semibold">
        {format(new Date(execution.ejecutadaEn), 'dd/MM/yyyy HH:mm:ss', {
        locale: es,
        })}
        </div>
        <div className="text-sm text-gray-600">
        {execution.mensaje || 'Sin mensaje'}
        </div>
        </div>
        </div>
        <div className="text-right">
        <Badge variant={execution.estado === 'exitosa' ? 'default' : 'destructive'}>
        {execution.estado}
        </Badge>
        {execution.duracion && (
        <div className="text-xs text-gray-500 mt-1">{execution.duracion}ms</div>
        )}
        </div>
        </div>
        </CardContent>
        </Card>
        ))
        )}
      </div>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
