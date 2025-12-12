'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Home,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';


interface Workflow {
  id: string;
  nombre: string;
  descripcion?: string;
  status: 'borrador' | 'activo' | 'inactivo';
  isActive: boolean;
  triggerType: string;
  triggerConfig: any;
  actions: any[];
  executions: any[];
  _count: {
    executions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    triggerType: 'manual' as const,
    actions: [
      {
        orden: 1,
        actionType: 'enviar_notificacion' as const,
        config: {
          titulo: '',
          mensaje: '',
          tipo: 'sistema',
          nivel: 'info'
        }
      }
    ]
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadWorkflows();
    }
  }, [status]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');
      if (!response.ok) throw new Error('Error cargando workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      logError(error as Error, { context: 'Error cargando workflows' });
      toast.error('No se pudieron cargar los workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          triggerConfig: { manual: true }
        }),
      });

      if (!response.ok) throw new Error('Error creando workflow');

      toast.success('Workflow creado exitosamente');
      setShowCreateDialog(false);
      loadWorkflows();
      
      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        triggerType: 'manual',
        actions: [{
          orden: 1,
          actionType: 'enviar_notificacion',
          config: {
            titulo: '',
            mensaje: '',
            tipo: 'sistema',
            nivel: 'info'
          }
        }]
      });
    } catch (error) {
      logError(error as Error, { context: 'Error creando workflow' });
      toast.error('No se pudo crear el workflow');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (workflowId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          isActive: !currentState
        }),
      });

      if (!response.ok) throw new Error('Error actualizando workflow');

      toast.success(!currentState ? 'Workflow activado' : 'Workflow desactivado');
      loadWorkflows();
    } catch (error) {
      logError(error as Error, { context: 'Error actualizando workflow' });
      toast.error('No se pudo actualizar el workflow');
    }
  };

  const handleExecute = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          triggerData: { companyId: session?.user?.companyId }
        }),
      });

      if (!response.ok) throw new Error('Error ejecutando workflow');

      const result = await response.json();
      toast.success('Workflow ejecutado exitosamente');
      loadWorkflows();
    } catch (error) {
      logError(error as Error, { context: 'Error ejecutando workflow' });
      toast.error('No se pudo ejecutar el workflow');
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('¿Estás seguro de eliminar este workflow?')) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error eliminando workflow');

      toast.success('Workflow eliminado');
      loadWorkflows();
    } catch (error) {
      logError(error as Error, { context: 'Error eliminando workflow' });
      toast.error('No se pudo eliminar el workflow');
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    switch (status) {
      case 'activo':
        return <Badge variant="default" className="bg-green-600">Activo</Badge>;
      case 'borrador':
        return <Badge variant="outline">Borrador</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando workflows...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/workflows">Workflows</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
                <Zap className="h-8 w-8" />
                Automatizaciones Inteligentes
              </h1>
              <p className="text-gray-600 mt-1">Gestiona workflows automatizados para tu empresa</p>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gradient-primary hover:opacity-90 shadow-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre del Workflow</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Notificar pagos pendientes"
                    />
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Describe qué hace este workflow..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="triggerType">Tipo de Disparador</Label>
                    <Select
                      value={formData.triggerType}
                      onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="evento">Por Evento</SelectItem>
                        <SelectItem value="programado">Programado</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Acción del Workflow</Label>
                    <Select
                      value={formData.actions[0].actionType}
                      onValueChange={(value: any) => {
                        const newActions = [...formData.actions];
                        newActions[0].actionType = value;
                        setFormData({ ...formData, actions: newActions });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enviar_notificacion">Enviar Notificación</SelectItem>
                        <SelectItem value="crear_tarea">Crear Tarea</SelectItem>
                        <SelectItem value="enviar_email">Enviar Email</SelectItem>
                        <SelectItem value="actualizar_registro">Actualizar Registro</SelectItem>
                        <SelectItem value="crear_incidencia">Crear Incidencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.actions[0].actionType === 'enviar_notificacion' && (
                    <>
                      <div>
                        <Label htmlFor="titulo">Título de la Notificación</Label>
                        <Input
                          id="titulo"
                          value={formData.actions[0].config.titulo}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[0].config.titulo = e.target.value;
                            setFormData({ ...formData, actions: newActions });
                          }}
                          placeholder="Título de la notificación"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mensaje">Mensaje</Label>
                        <Textarea
                          id="mensaje"
                          value={formData.actions[0].config.mensaje}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[0].config.mensaje = e.target.value;
                            setFormData({ ...formData, actions: newActions });
                          }}
                          placeholder="Contenido de la notificación"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      disabled={creating}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={creating || !formData.nombre}
                      className="gradient-primary"
                    >
                      {creating ? 'Creando...' : 'Crear Workflow'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Workflows Grid */}
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay workflows configurados</h3>
                <p className="text-gray-600 mb-4">Crea tu primer workflow de automatización</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="gradient-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{workflow.nombre}</CardTitle>
                        <CardDescription className="mt-1">
                          {workflow.descripcion || 'Sin descripción'}
                        </CardDescription>
                      </div>
                      {getStatusBadge(workflow.status, workflow.isActive)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Disparador:</span>
                        <Badge variant="outline">{workflow.triggerType}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Acciones:</span>
                        <span className="font-medium">{workflow.actions.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Ejecuciones:</span>
                        <span className="font-medium">{workflow._count.executions}</span>
                      </div>

                      {workflow.executions.length > 0 && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>Última ejecución:</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {workflow.executions[0].status === 'completado' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-xs">
                              {new Date(workflow.executions[0].startedAt).toLocaleString('es-ES')}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleToggle(workflow.id, workflow.isActive)}
                        >
                          {workflow.isActive ? (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Activar
                            </>
                          )}
                        </Button>
                        {workflow.triggerType === 'manual' && workflow.isActive && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-indigo-600"
                            onClick={() => handleExecute(workflow.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Ejecutar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(workflow.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
