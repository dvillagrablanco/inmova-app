"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  Pause,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { WorkflowForm } from './WorkflowForm';
import toast from 'react-hot-toast';

type Workflow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  status: string;
  isActive: boolean;
  triggerType: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    nombre: string;
    email: string;
  };
  _count: {
    executions: number;
  };
};

export default function WorkflowsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadWorkflows();
    }
  }, [status, router]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      } else {
        toast.error('Error al cargar workflows');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Estado del workflow actualizado');
        loadWorkflows();
      } else {
        toast.error('Error al cambiar estado del workflow');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar estado del workflow');
    }
  };

  const handleExecute = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: {} }),
      });

      if (response.ok) {
        toast.success('Workflow ejecutado correctamente');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al ejecutar workflow');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al ejecutar workflow');
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este workflow?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Workflow eliminado correctamente');
        loadWorkflows();
      } else {
        toast.error('Error al eliminar workflow');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar workflow');
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      manual: 'Manual',
      evento: 'Evento',
      programado: 'Programado',
      webhook: 'Webhook',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (workflow: Workflow) => {
    if (workflow.isActive) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Activo
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Pause className="w-3 h-3 mr-1" />
        Inactivo
      </Badge>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary" />
            Workflows Automáticos
          </h1>
          <p className="text-muted-foreground mt-1">
            Automatiza tareas y procesos con workflows inteligentes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{workflows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {workflows.filter((w) => w.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-600">
              {workflows.filter((w) => !w.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ejecuciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {workflows.reduce((acc, w) => acc + w._count.executions, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
          <CardDescription>
            Gestiona y monitorea tus workflows de automatización
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                No hay workflows creados
              </h3>
              <p className="text-muted-foreground mb-6">
                Crea tu primer workflow para automatizar tareas
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Crear Primer Workflow
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ejecuciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{workflow.nombre}</p>
                          {workflow.descripcion && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {workflow.descripcion}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTriggerTypeLabel(workflow.triggerType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(workflow)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">
                          {workflow._count.executions}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(workflow.id)}
                            >
                              {workflow.isActive ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExecute(workflow.id)}
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Ejecutar Ahora
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditingWorkflow(workflow)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(workflow.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingWorkflow}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingWorkflow(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? 'Editar Workflow' : 'Crear Workflow'}
            </DialogTitle>
            <DialogDescription>
              Configura el trigger y las acciones que se ejecutarán automáticamente
            </DialogDescription>
          </DialogHeader>
          <WorkflowForm
            workflow={editingWorkflow}
            onSuccess={() => {
              setShowCreateDialog(false);
              setEditingWorkflow(null);
              loadWorkflows();
            }}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingWorkflow(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
