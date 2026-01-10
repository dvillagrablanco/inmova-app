'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Phone,
  PhoneOutgoing,
  Users,
  Clock,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface OutboundStats {
  isRunning: boolean;
  currentCalls: number;
  stats: {
    pending: number;
    contacted: number;
    qualified: number;
    rejected: number;
    incomplete: number;
    scheduledToday: number;
  };
}

interface TodayStats {
  callsMade: number;
  avgDuration: number;
}

interface RecentCall {
  id: string;
  callId: string;
  status: string;
  resultado: string | null;
  duration: number | null;
  lead: {
    id: string;
    nombre: string;
    apellidos: string | null;
    empresa: string | null;
    cargo: string | null;
    outboundStatus: string | null;
  } | null;
  createdAt: string;
}

interface UpcomingLead {
  id: string;
  name: string;
  empresa: string | null;
  cargo: string | null;
  phone: string | null;
  scheduledAt: string | null;
  attempts: number;
}

export default function OutboundPage() {
  const [scheduler, setScheduler] = useState<OutboundStats | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [upcomingLeads, setUpcomingLeads] = useState<UpcomingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/outbound');
      if (!response.ok) throw new Error('Error cargando datos');
      
      const data = await response.json();
      setScheduler(data.scheduler);
      setTodayStats(data.todayStats);
      setRecentCalls(data.recentCalls);
      setUpcomingLeads(data.upcomingLeads);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error cargando datos outbound');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAction = async (action: string, leadId?: string) => {
    setActionLoading(action + (leadId || ''));
    try {
      const response = await fetch('/api/admin/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, leadId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        loadData();
      } else {
        toast.error(data.error || 'Error ejecutando acción');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      NEW: { color: 'bg-blue-500', label: 'Nuevo' },
      CONTACTED: { color: 'bg-yellow-500', label: 'Contactado' },
      QUALIFIED: { color: 'bg-green-500', label: 'Cualificado' },
      REJECTED: { color: 'bg-red-500', label: 'Rechazado' },
      INCOMPLETE: { color: 'bg-gray-500', label: 'Incompleto' },
      SCHEDULED: { color: 'bg-purple-500', label: 'Programado' },
    };

    const config = statusConfig[status || ''] || { color: 'bg-gray-400', label: status || 'Desconocido' };
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getCallStatusBadge = (status: string, resultado: string | null) => {
    if (status === 'ended') {
      if (resultado === 'cita_agendada') {
        return <Badge className="bg-green-500 text-white">Cita Agendada</Badge>;
      }
      if (resultado === 'lead_cualificado') {
        return <Badge className="bg-blue-500 text-white">Cualificado</Badge>;
      }
      if (resultado === 'no_interesado') {
        return <Badge className="bg-red-500 text-white">No Interesado</Badge>;
      }
      return <Badge variant="secondary">Finalizada</Badge>;
    }
    if (status === 'in_progress') {
      return <Badge className="bg-yellow-500 text-white">En Curso</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const totalLeads = scheduler 
    ? scheduler.stats.pending + scheduler.stats.contacted + 
      scheduler.stats.qualified + scheduler.stats.rejected + scheduler.stats.incomplete
    : 0;

  const conversionRate = totalLeads > 0 && scheduler
    ? Math.round((scheduler.stats.qualified / totalLeads) * 100)
    : 0;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Captación Proactiva</h1>
            <p className="text-muted-foreground">
              Gestión de campañas outbound con Retell AI
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => loadData()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={() => handleAction('start')}
              disabled={scheduler?.isRunning || actionLoading === 'start'}
            >
              {actionLoading === 'start' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : scheduler?.isRunning ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {scheduler?.isRunning ? 'En Ejecución' : 'Iniciar Campaña'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduler?.stats.pending || 0}</div>
              <p className="text-xs text-muted-foreground">
                {scheduler?.stats.scheduledToday || 0} para hoy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contactados</CardTitle>
              <PhoneOutgoing className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduler?.stats.contacted || 0}</div>
              <p className="text-xs text-muted-foreground">
                {todayStats?.callsMade || 0} llamadas hoy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cualificados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {scheduler?.stats.qualified || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {conversionRate}% conversión
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {scheduler?.stats.rejected || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                No interesados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incompletos</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {scheduler?.stats.incomplete || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Sin teléfono
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pipeline Outbound
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm">Pendientes</span>
                <Progress 
                  value={totalLeads > 0 ? ((scheduler?.stats.pending || 0) / totalLeads) * 100 : 0} 
                  className="flex-1"
                />
                <span className="w-12 text-sm text-right">{scheduler?.stats.pending || 0}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm">Contactados</span>
                <Progress 
                  value={totalLeads > 0 ? ((scheduler?.stats.contacted || 0) / totalLeads) * 100 : 0} 
                  className="flex-1 [&>div]:bg-yellow-500"
                />
                <span className="w-12 text-sm text-right">{scheduler?.stats.contacted || 0}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm">Cualificados</span>
                <Progress 
                  value={totalLeads > 0 ? ((scheduler?.stats.qualified || 0) / totalLeads) * 100 : 0} 
                  className="flex-1 [&>div]:bg-green-500"
                />
                <span className="w-12 text-sm text-right">{scheduler?.stats.qualified || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Próximas Llamadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Llamadas
              </CardTitle>
              <CardDescription>
                Leads programados para las próximas 2 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {upcomingLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Clock className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay llamadas programadas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lead.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {lead.empresa && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {lead.empresa}
                              </span>
                            )}
                            {lead.cargo && (
                              <span className="truncate">• {lead.cargo}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                            <span>•</span>
                            <span>
                              {lead.scheduledAt 
                                ? formatDistanceToNow(new Date(lead.scheduledAt), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })
                                : 'Sin programar'}
                            </span>
                            {lead.attempts > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {lead.attempts} intento{lead.attempts > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction('call-now', lead.id)}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === `call-now${lead.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Phone className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction('cancel-lead', lead.id)}
                            disabled={!!actionLoading}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Llamadas Recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneOutgoing className="h-5 w-5" />
                Llamadas Recientes
              </CardTitle>
              <CardDescription>
                Últimas llamadas outbound realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {recentCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Phone className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay llamadas recientes</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Duración</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCalls.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {call.lead 
                                  ? `${call.lead.nombre} ${call.lead.apellidos || ''}`
                                  : 'Lead eliminado'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {call.lead?.empresa || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(call.createdAt), 'dd/MM HH:mm', { locale: es })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getCallStatusBadge(call.status, call.resultado)}
                          </TableCell>
                          <TableCell className="text-right">
                            {call.duration 
                              ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cómo funciona la Captación Proactiva
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-600 dark:text-blue-400 text-sm space-y-2">
            <p>
              <strong>1. Ingestión:</strong> Los leads se importan automáticamente desde PhantomBuster/Clay 
              a través del webhook <code>/api/webhooks/leads/ingest</code>.
            </p>
            <p>
              <strong>2. Filtrado:</strong> Solo se procesan leads con teléfono válido. 
              Los que no tienen teléfono se marcan como &quot;Incompletos&quot;.
            </p>
            <p>
              <strong>3. Programación:</strong> Cada lead recibe un retraso aleatorio de 2-10 minutos 
              para evitar detección como spam.
            </p>
            <p>
              <strong>4. Llamada IA:</strong> Retell AI realiza la llamada con un script personalizado 
              basado en el perfil LinkedIn del lead.
            </p>
            <p>
              <strong>5. Cualificación:</strong> Si el lead muestra interés, la IA agenda una demo 
              y actualiza el CRM automáticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
