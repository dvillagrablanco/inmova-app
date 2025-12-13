'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Bell,
  Mail,
  MessageSquare,
  AlertCircle,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '@/lib/logger';

interface NotificationRule {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  tipoEvento: string;
  condiciones: any;
  diasAnticipo?: number;
  canales: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  rolesDestinatarios: string[];
  usuariosEspecificos: string[];
  asunto?: string;
  mensaje: string;
  prioridad: string;
  vecesEjecutada: number;
  ultimaEjecucion?: string;
  template?: {
    id: string;
    nombre: string;
    categoria: string;
  };
}

interface NotificationTemplate {
  id: string;
  nombre: string;
  categoria: string;
}

const TIPOS_EVENTO = [
  { value: 'pago_vencido', label: 'Pago Vencido' },
  { value: 'contrato_expira', label: 'Contrato por Expirar' },
  { value: 'mantenimiento_urgente', label: 'Mantenimiento Urgente' },
  { value: 'nuevo_inquilino', label: 'Nuevo Inquilino' },
  { value: 'fin_contrato', label: 'Fin de Contrato' },
  { value: 'pago_recibido', label: 'Pago Recibido' },
  { value: 'documento_pendiente', label: 'Documento Pendiente' },
];

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'tenant', label: 'Inquilino' },
  { value: 'owner', label: 'Propietario' },
];

const PRIORIDADES = [
  { value: 'bajo', label: 'Baja', color: 'bg-green-500' },
  { value: 'medio', label: 'Media', color: 'bg-yellow-500' },
  { value: 'alto', label: 'Alta', color: 'bg-orange-500' },
  { value: 'critico', label: 'Crítica', color: 'bg-red-500' },
];

export default function NotificationRulesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [formData, setFormData] = useState<Partial<NotificationRule>>({
    nombre: '',
    descripcion: '',
    activa: true,
    tipoEvento: 'pago_vencido',
    canales: { email: true, push: false, sms: false },
    rolesDestinatarios: [],
    mensaje: '',
    prioridad: 'medio',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchRules();
      fetchTemplates();
    }
  }, [status, router]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notification-rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      logger.error('Error fetching rules:', error);
      toast.error('Error al cargar reglas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/notification-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      logger.error('Error fetching templates:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.nombre || !formData.mensaje) {
        toast.error('Nombre y mensaje son obligatorios');
        return;
      }

      const url = editingRule
        ? `/api/notification-rules/${editingRule.id}`
        : '/api/notification-rules';

      const method = editingRule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingRule ? 'Regla actualizada exitosamente' : 'Regla creada exitosamente');
        setIsDialogOpen(false);
        resetForm();
        fetchRules();
      } else {
        toast.error('Error al guardar la regla');
      }
    } catch (error) {
      logger.error('Error saving rule:', error);
      toast.error('Error al guardar la regla');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta regla?')) return;

    try {
      const response = await fetch(`/api/notification-rules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Regla eliminada exitosamente');
        fetchRules();
      } else {
        toast.error('Error al eliminar la regla');
      }
    } catch (error) {
      logger.error('Error deleting rule:', error);
      toast.error('Error al eliminar la regla');
    }
  };

  const toggleRuleStatus = async (rule: NotificationRule) => {
    try {
      const response = await fetch(`/api/notification-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, activa: !rule.activa }),
      });

      if (response.ok) {
        toast.success(rule.activa ? 'Regla desactivada' : 'Regla activada');
        fetchRules();
      } else {
        toast.error('Error al cambiar el estado');
      }
    } catch (error) {
      logger.error('Error toggling rule:', error);
      toast.error('Error al cambiar el estado');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activa: true,
      tipoEvento: 'pago_vencido',
      canales: { email: true, push: false, sms: false },
      rolesDestinatarios: [],
      mensaje: '',
      prioridad: 'medio',
    });
    setEditingRule(null);
  };

  const openEditDialog = (rule: NotificationRule) => {
    setEditingRule(rule);
    setFormData({
      nombre: rule.nombre,
      descripcion: rule.descripcion,
      activa: rule.activa,
      tipoEvento: rule.tipoEvento,
      canales: rule.canales,
      rolesDestinatarios: rule.rolesDestinatarios,
      diasAnticipo: rule.diasAnticipo,
      asunto: rule.asunto,
      mensaje: rule.mensaje,
      prioridad: rule.prioridad,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

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
          <h1 className="text-3xl font-bold">Reglas de Notificación</h1>
          <p className="text-muted-foreground mt-2">
            Configura reglas automatizadas para enviar notificaciones basadas en eventos
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Regla
        </Button>
      </div>

      {/* Lista de Reglas */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay reglas configuradas</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera regla de notificación automática
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Regla
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{rule.nombre}</CardTitle>
                      {rule.activa ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactiva
                        </Badge>
                      )}
                      <Badge className={PRIORIDADES.find((p) => p.value === rule.prioridad)?.color}>
                        {PRIORIDADES.find((p) => p.value === rule.prioridad)?.label}
                      </Badge>
                    </div>
                    {rule.descripcion && <CardDescription>{rule.descripcion}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rule.activa} onCheckedChange={() => toggleRuleStatus(rule)} />
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(rule)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tipo de Evento</p>
                    <p className="font-medium">
                      {TIPOS_EVENTO.find((t) => t.value === rule.tipoEvento)?.label}
                    </p>
                  </div>
                  {rule.diasAnticipo && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Anticipación</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <p className="font-medium">{rule.diasAnticipo} días</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Canales</p>
                    <div className="flex gap-2">
                      {rule.canales.email && <Mail className="w-4 h-4" />}
                      {rule.canales.push && <Bell className="w-4 h-4" />}
                      {rule.canales.sms && <MessageSquare className="w-4 h-4" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Destinatarios</p>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <p className="font-medium">
                        {rule.rolesDestinatarios.length + rule.usuariosEspecificos.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">Mensaje:</p>
                  <p className="text-sm">{rule.mensaje}</p>
                </div>

                {rule.vecesEjecutada > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Ejecutada {rule.vecesEjecutada} veces
                    {rule.ultimaEjecucion && (
                      <span>
                        {' · '}
                        Última ejecución: {new Date(rule.ultimaEjecucion).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo Crear/Editar Regla */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regla' : 'Nueva Regla de Notificación'}
            </DialogTitle>
            <DialogDescription>
              Configura cuándo y cómo se enviarán las notificaciones automáticas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información Básica */}
            <div>
              <Label htmlFor="nombre">Nombre de la Regla *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Recordatorio de pago antes del vencimiento"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional de la regla"
              />
            </div>

            {/* Configuración del Evento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoEvento">Tipo de Evento *</Label>
                <Select
                  value={formData.tipoEvento}
                  onValueChange={(value) => setFormData({ ...formData, tipoEvento: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="diasAnticipo">Días de Anticipación</Label>
                <Input
                  id="diasAnticipo"
                  type="number"
                  min="0"
                  value={formData.diasAnticipo || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diasAnticipo: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="0 para inmediato"
                />
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
                  {PRIORIDADES.map((prioridad) => (
                    <SelectItem key={prioridad.value} value={prioridad.value}>
                      {prioridad.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Canales */}
            <div>
              <Label className="mb-3 block">Canales de Notificación</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.canales?.email}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        canales: { ...formData.canales!, email: checked },
                      })
                    }
                  />
                  <Mail className="w-4 h-4" />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.canales?.push}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        canales: { ...formData.canales!, push: checked },
                      })
                    }
                  />
                  <Bell className="w-4 h-4" />
                  <Label>Notificación Push</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.canales?.sms}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        canales: { ...formData.canales!, sms: checked },
                      })
                    }
                  />
                  <MessageSquare className="w-4 h-4" />
                  <Label>SMS</Label>
                </div>
              </div>
            </div>

            {/* Destinatarios */}
            <div>
              <Label className="mb-3 block">Roles Destinatarios</Label>
              <div className="space-y-2">
                {ROLES.map((rol) => (
                  <div key={rol.value} className="flex items-center space-x-2">
                    <Switch
                      checked={formData.rolesDestinatarios?.includes(rol.value)}
                      onCheckedChange={(checked) => {
                        const roles = formData.rolesDestinatarios || [];
                        setFormData({
                          ...formData,
                          rolesDestinatarios: checked
                            ? [...roles, rol.value]
                            : roles.filter((r) => r !== rol.value),
                        });
                      }}
                    />
                    <Label>{rol.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensaje */}
            {formData.canales?.email && (
              <div>
                <Label htmlFor="asunto">Asunto del Email</Label>
                <Input
                  id="asunto"
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  placeholder="Asunto del correo electrónico"
                />
              </div>
            )}

            <div>
              <Label htmlFor="mensaje">Mensaje *</Label>
              <Textarea
                id="mensaje"
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                placeholder="Escribe el mensaje de la notificación. Puedes usar variables como {nombre_inquilino}, {monto}, {fecha_vencimiento}"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Variables disponibles: {'{nombre_inquilino}'}, {'{monto}'}, {'{fecha_vencimiento}'}
              </p>
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
            <Button onClick={handleSave}>{editingRule ? 'Actualizar' : 'Crear'} Regla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
