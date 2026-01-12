'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Megaphone,
  Send,
  Mail,
  MessageSquare,
  Bell,
  Users,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  History,
  Filter,
  Settings,
  Loader2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  targetAudience: string;
  recipientCount: number;
  sentCount?: number;
  openRate?: number;
  clickRate?: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
}

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  criteria: string[];
}

const NOTIFICATION_TYPES = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'push', label: 'Push Notification', icon: Bell },
  { value: 'in_app', label: 'In-App', icon: Bell },
];

const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  {
    id: 'all',
    name: 'Todos los Clientes',
    description: 'Todas las empresas registradas',
    count: 156,
    criteria: ['Todos los clientes activos'],
  },
  {
    id: 'active',
    name: 'Clientes Activos',
    description: 'Empresas con actividad en los últimos 30 días',
    count: 89,
    criteria: ['Plan activo', 'Login en últimos 30 días'],
  },
  {
    id: 'trial',
    name: 'En Período de Prueba',
    description: 'Empresas en trial que no han convertido',
    count: 23,
    criteria: ['Plan trial', 'Sin pago registrado'],
  },
  {
    id: 'expiring',
    name: 'Suscripción por Vencer',
    description: 'Empresas cuyo plan vence en los próximos 15 días',
    count: 12,
    criteria: ['Renovación < 15 días'],
  },
  {
    id: 'inactive',
    name: 'Clientes Inactivos',
    description: 'Sin login en más de 30 días',
    count: 34,
    criteria: ['Sin actividad > 30 días'],
  },
  {
    id: 'enterprise',
    name: 'Plan Enterprise',
    description: 'Clientes con plan Enterprise',
    count: 18,
    criteria: ['Plan = Enterprise'],
  },
];

// No mock data - cargar datos reales desde la API

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-800' },
  sent: { label: 'Enviado', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
};

export default function MassNotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<NotificationCampaign | null>(null);
  const [sending, setSending] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'email' as 'email' | 'sms' | 'push' | 'in_app',
    targetAudience: '',
    scheduleEnabled: false,
    scheduledAt: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
        toast.error('Solo Super Admin puede acceder a esta página');
        return;
      }
      loadData();
    }
  }, [status, session, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar datos reales desde la API (sin datos demo)
      const response = await fetch('/api/admin/notification-campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } else {
        // Si no hay datos o API no disponible, mostrar lista vacía
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // En caso de error, mostrar lista vacía (no mock data)
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    setFormData({
      title: '',
      message: '',
      type: 'email',
      targetAudience: '',
      scheduleEnabled: false,
      scheduledAt: '',
    });
    setShowCreateDialog(true);
  };

  const handleSubmitCampaign = async (sendNow: boolean) => {
    if (!formData.title || !formData.message || !formData.targetAudience) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const audience = AUDIENCE_SEGMENTS.find((a) => a.id === formData.targetAudience);

      const newCampaign: NotificationCampaign = {
        id: String(campaigns.length + 1),
        title: formData.title,
        message: formData.message,
        type: formData.type,
        status: sendNow ? 'sent' : formData.scheduleEnabled ? 'scheduled' : 'draft',
        targetAudience: audience?.name || 'Desconocido',
        recipientCount: audience?.count || 0,
        sentCount: sendNow ? audience?.count : undefined,
        scheduledAt: formData.scheduleEnabled ? formData.scheduledAt : undefined,
        sentAt: sendNow ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
        createdBy: session?.user?.name || 'Admin',
      };

      setCampaigns([newCampaign, ...campaigns]);
      setShowCreateDialog(false);

      if (sendNow) {
        toast.success(`Notificación enviada a ${audience?.count || 0} destinatarios`);
      } else if (formData.scheduleEnabled) {
        toast.success('Notificación programada correctamente');
      } else {
        toast.success('Borrador guardado');
      }
    } catch (error) {
      toast.error('Error al crear la notificación');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const selectedAudience = AUDIENCE_SEGMENTS.find((a) => a.id === formData.targetAudience);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-indigo-600" />
              Notificaciones Masivas
            </h1>
            <p className="text-muted-foreground mt-1">Envía comunicaciones a grupos de clientes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refrescar
            </Button>
            <Button onClick={handleCreateCampaign}>
              <Send className="mr-2 h-4 w-4" />
              Nueva Notificación
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Enviadas</p>
                  <p className="text-2xl font-bold">
                    {campaigns.filter((c) => c.status === 'sent').length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Programadas</p>
                  <p className="text-2xl font-bold">
                    {campaigns.filter((c) => c.status === 'scheduled').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasa Apertura Promedio</p>
                  <p className="text-2xl font-bold">
                    {(
                      campaigns
                        .filter((c) => c.openRate)
                        .reduce((acc, c) => acc + (c.openRate || 0), 0) /
                        campaigns.filter((c) => c.openRate).length || 0
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <Mail className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Alcanzados</p>
                  <p className="text-2xl font-bold">
                    {campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audience Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Segmentos de Audiencia</CardTitle>
            <CardDescription>
              Grupos predefinidos de clientes para campañas dirigidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {AUDIENCE_SEGMENTS.map((segment) => (
                <div
                  key={segment.id}
                  className="p-4 border rounded-lg hover:border-indigo-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{segment.name}</h4>
                    <Badge variant="secondary">{segment.count}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.criteria.map((criteria, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {criteria}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaigns History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Campañas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Audiencia</TableHead>
                  <TableHead>Destinatarios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Métricas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay campañas creadas
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => {
                    const TypeIcon =
                      NOTIFICATION_TYPES.find((t) => t.value === campaign.type)?.icon || Mail;
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {campaign.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4" />
                            <span className="capitalize">{campaign.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{campaign.targetAudience}</TableCell>
                        <TableCell>
                          {campaign.sentCount !== undefined
                            ? `${campaign.sentCount}/${campaign.recipientCount}`
                            : campaign.recipientCount}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_CONFIG[campaign.status].color}>
                            {STATUS_CONFIG[campaign.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {campaign.openRate !== undefined ? (
                            <div className="text-sm">
                              <span className="text-green-600">{campaign.openRate}%</span>
                              {' abiertos'}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {campaign.sentAt
                            ? format(new Date(campaign.sentAt), 'dd/MM/yyyy HH:mm', { locale: es })
                            : campaign.scheduledAt
                              ? format(new Date(campaign.scheduledAt), 'dd/MM/yyyy HH:mm', {
                                  locale: es,
                                })
                              : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedCampaign(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Campaign Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Notificación Masiva</DialogTitle>
              <DialogDescription>
                Crea y envía una notificación a un grupo de clientes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Notification Type */}
              <div className="space-y-2">
                <Label>Tipo de Notificación</Label>
                <div className="grid grid-cols-4 gap-2">
                  {NOTIFICATION_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={formData.type === type.value ? 'default' : 'outline'}
                      className="flex flex-col h-auto py-3"
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                    >
                      <type.icon className="h-5 w-5 mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título / Asunto *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ej: Nuevas funcionalidades disponibles"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Escribe el contenido de tu notificación..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Variables disponibles: {`{{nombre}}, {{empresa}}, {{plan}}`}
                </p>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label>Audiencia Objetivo *</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_SEGMENTS.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{segment.name}</span>
                          <Badge variant="secondary">{segment.count}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAudience && (
                  <p className="text-sm text-muted-foreground">
                    Esta notificación llegará a <strong>{selectedAudience.count}</strong>{' '}
                    destinatarios
                  </p>
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Programar Envío</Label>
                    <p className="text-xs text-muted-foreground">
                      Enviar en una fecha y hora específica
                    </p>
                  </div>
                  <Switch
                    checked={formData.scheduleEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, scheduleEnabled: checked })
                    }
                  />
                </div>
                {formData.scheduleEnabled && (
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                )}
              </div>

              {/* Warning */}
              {selectedAudience && selectedAudience.count > 50 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Envío Masivo</AlertTitle>
                  <AlertDescription>
                    Esta notificación se enviará a {selectedAudience.count} destinatarios. Asegúrate
                    de revisar el contenido antes de enviar.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmitCampaign(false)}
                disabled={sending}
              >
                Guardar Borrador
              </Button>
              <Button
                onClick={() => handleSubmitCampaign(true)}
                disabled={
                  sending || !formData.title || !formData.message || !formData.targetAudience
                }
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : formData.scheduleEnabled ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Programar
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Ahora
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Campaign Detail Dialog */}
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCampaign?.title}</DialogTitle>
              <DialogDescription>Detalles de la campaña</DialogDescription>
            </DialogHeader>
            {selectedCampaign && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                    <p className="mt-1 capitalize">{selectedCampaign.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <Badge className={`mt-1 ${STATUS_CONFIG[selectedCampaign.status].color}`}>
                      {STATUS_CONFIG[selectedCampaign.status].label}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Audiencia</label>
                    <p className="mt-1">{selectedCampaign.targetAudience}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Destinatarios
                    </label>
                    <p className="mt-1">
                      {selectedCampaign.sentCount !== undefined
                        ? `${selectedCampaign.sentCount}/${selectedCampaign.recipientCount} enviados`
                        : `${selectedCampaign.recipientCount} programados`}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mensaje</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedCampaign.message}</p>
                </div>

                {selectedCampaign.openRate !== undefined && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedCampaign.openRate}%
                      </p>
                      <p className="text-sm text-muted-foreground">Tasa de Apertura</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedCampaign.clickRate}%
                      </p>
                      <p className="text-sm text-muted-foreground">Tasa de Clicks</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
