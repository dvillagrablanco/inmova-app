"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, X, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowAction {
  orden: number;
  actionType: string;
  config: Record<string, any>;
  conditions?: Record<string, any> | null;
}

interface WorkflowFormProps {
  workflow?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const actionTypes = [
  { value: 'enviar_notificacion', label: 'Enviar Notificación', icon: '🔔' },
  { value: 'crear_tarea', label: 'Crear Tarea', icon: '✓' },
  { value: 'enviar_email', label: 'Enviar Email', icon: '📧' },
  { value: 'ejecutar_script', label: 'Ejecutar Script', icon: '💻' },
  { value: 'actualizar_registro', label: 'Actualizar Registro', icon: '📝' },
  { value: 'crear_incidencia', label: 'Crear Incidencia', icon: '⚠️' },
  { value: 'generar_documento', label: 'Generar Documento', icon: '📄' },
  { value: 'webhook', label: 'Llamar Webhook', icon: '🔗' },
];

const triggerTypes = [
  { value: 'manual', label: 'Manual', description: 'Ejecutar manualmente' },
  {
    value: 'evento',
    label: 'Evento',
    description: 'Al ocurrir un evento específico',
  },
  {
    value: 'programado',
    label: 'Programado',
    description: 'En horario específico',
  },
  { value: 'webhook', label: 'Webhook', description: 'Al recibir llamada HTTP' },
];

export function WorkflowForm({ workflow, onSuccess, onCancel }: WorkflowFormProps) {
  const [nombre, setNombre] = useState(workflow?.nombre || '');
  const [descripcion, setDescripcion] = useState(workflow?.descripcion || '');
  const [triggerType, setTriggerType] = useState(
    workflow?.triggerType || 'manual'
  );
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>(
    workflow?.triggerConfig || {}
  );
  const [isActive, setIsActive] = useState(workflow?.isActive || false);
  const [actions, setActions] = useState<WorkflowAction[]>(
    workflow?.actions?.map((a: any, idx: number) => ({
      orden: idx + 1,
      actionType: a.actionType,
      config: a.config || {},
      conditions: a.conditions || null,
    })) || []
  );
  const [saving, setSaving] = useState(false);

  const addAction = () => {
    setActions([
      ...actions,
      {
        orden: actions.length + 1,
        actionType: 'enviar_notificacion',
        config: {},
        conditions: null,
      },
    ]);
  };

  const removeAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    // Renumerar
    newActions.forEach((action, idx) => {
      action.orden = idx + 1;
    });
    setActions(newActions);
  };

  const updateAction = (
    index: number,
    field: keyof WorkflowAction,
    value: any
  ) => {
    const newActions = [...actions];
    newActions[index] = {
      ...newActions[index],
      [field]: value,
    };
    setActions(newActions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (actions.length === 0) {
      toast.error('Debes agregar al menos una acción');
      return;
    }

    try {
      setSaving(true);

      const data = {
        nombre,
        descripcion,
        triggerType,
        triggerConfig,
        isActive,
        actions,
      };

      const url = workflow
        ? `/api/workflows/${workflow.id}`
        : '/api/workflows';

      const response = await fetch(url, {
        method: workflow ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(
          workflow
            ? 'Workflow actualizado correctamente'
            : 'Workflow creado correctamente'
        );
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar workflow');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre del Workflow *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Notificar pagos vencidos"
              required
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe qué hace este workflow..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Activar workflow</Label>
              <p className="text-sm text-muted-foreground">
                El workflow se ejecutará automáticamente cuando esté activo
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Trigger (Disparador)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tipo de Trigger *</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {triggerType === 'programado' && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="cron">Expresión Cron</Label>
              <Input
                id="cron"
                value={triggerConfig.cron || ''}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, cron: e.target.value })
                }
                placeholder="0 9 * * * (Cada día a las 9:00)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="w-3 h-3 inline" /> Formato: minuto hora día mes día_semana
              </p>
            </div>
          )}

          {triggerType === 'evento' && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Select
                value={triggerConfig.eventType || ''}
                onValueChange={(value) =>
                  setTriggerConfig({ ...triggerConfig, eventType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_received">Pago Recibido</SelectItem>
                  <SelectItem value="contract_expiring">Contrato Por Vencer</SelectItem>
                  <SelectItem value="maintenance_requested">
                    Mantenimiento Solicitado
                  </SelectItem>
                  <SelectItem value="tenant_registered">
                    Inquilino Registrado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {triggerType === 'webhook' && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label>URL del Webhook</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Se generará automáticamente al guardar
              </p>
              <code className="block p-2 bg-background rounded text-xs">
                {workflow?.id
                  ? `https://inmova.app/api/webhooks/${workflow.id}`
                  : 'Se generará después de crear el workflow'}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Acciones</CardTitle>
            <Button type="button" onClick={addAction} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Acción
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay acciones configuradas</p>
              <p className="text-sm">Las acciones se ejecutarán en orden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-3 relative"
                >
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="mb-2">
                      Acción {action.orden}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>

                  <div>
                    <Label>Tipo de Acción</Label>
                    <Select
                      value={action.actionType}
                      onValueChange={(value) =>
                        updateAction(index, 'actionType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <span>{type.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Config específica por tipo de acción */}
                  <div className="space-y-2 pl-4 border-l-2">
                    {action.actionType === 'enviar_notificacion' && (
                      <>
                        <div>
                          <Label className="text-sm">Título</Label>
                          <Input
                            value={action.config.titulo || ''}
                            onChange={(e) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                titulo: e.target.value,
                              })
                            }
                            placeholder="Título de la notificación"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Mensaje</Label>
                          <Textarea
                            value={action.config.mensaje || ''}
                            onChange={(e) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                mensaje: e.target.value,
                              })
                            }
                            placeholder="Contenido de la notificación"
                            rows={2}
                          />
                        </div>
                      </>
                    )}

                    {action.actionType === 'enviar_email' && (
                      <>
                        <div>
                          <Label className="text-sm">Destinatario</Label>
                          <Input
                            value={action.config.destinatario || ''}
                            onChange={(e) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                destinatario: e.target.value,
                              })
                            }
                            placeholder="email@ejemplo.com"
                            type="email"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Asunto</Label>
                          <Input
                            value={action.config.asunto || ''}
                            onChange={(e) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                asunto: e.target.value,
                              })
                            }
                            placeholder="Asunto del email"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Mensaje</Label>
                          <Textarea
                            value={action.config.mensaje || ''}
                            onChange={(e) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                mensaje: e.target.value,
                              })
                            }
                            placeholder="Contenido del email"
                            rows={3}
                          />
                        </div>
                      </>
                    )}

                    {action.actionType === 'crear_tarea' && (
                      <>
                        <div>
                          <Label className="text-sm">Título</Label>
                          <Input
                            value={action.config.titulo || ''}
                            onChange={(e) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                titulo: e.target.value,
                              })
                            }
                            placeholder="Título de la tarea"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Prioridad</Label>
                          <Select
                            value={action.config.prioridad || 'media'}
                            onValueChange={(value) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                prioridad: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baja">Baja</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {action.actionType === 'webhook' && (
                      <>
                        <div>
                          <Label className="text-sm">URL</Label>
                          <Input
                            value={action.config.url || ''}
                            onChange={(e) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                url: e.target.value,
                              })
                            }
                            placeholder="https://api.ejemplo.com/webhook"
                            type="url"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Método</Label>
                          <Select
                            value={action.config.method || 'POST'}
                            onValueChange={(value) =>
                              updateAction(index, 'config', {
                                ...action.config,
                                method: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              {workflow ? 'Actualizar' : 'Crear'} Workflow
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
