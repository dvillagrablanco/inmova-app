'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { Shield, Home, ArrowLeft, AlertTriangle, FileText, CheckCircle2, Clock, Users, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface AuditStats {
  totalSecurityEvents: number;
  criticalEvents: number;
  unresolvedEvents: number;
  totalAuditLogs: number;
  recentAuditLogs: number;
  activeUsers: number;
}

interface SecurityEvent {
  id: string;
  tipo: string;
  severidad: string;
  descripcion: string;
  resuelta: boolean;
  createdAt: string;
  user?: { email: string; name: string };
}

interface AuditReport {
  id: string;
  titulo: string;
  tipoReporte: string;
  fechaInicio: string;
  fechaFin: string;
  totalEventos: number;
  eventosError: number;
  eventosCriticos: number;
  generadoPor: string;
  createdAt: string;
}

export default function AuditoriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<AuditStats | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterResolved, setFilterResolved] = useState('all');

  const [reportForm, setReportForm] = useState({
    titulo: '',
    descripcion: '',
    tipoReporte: 'accesos',
    fechaInicio: '',
    fechaFin: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchStats(), fetchSecurityEvents(), fetchAuditReports()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/audit/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (filterSeverity !== 'all') params.append('severidad', filterSeverity);
      if (filterResolved !== 'all') params.append('resuelta', filterResolved);
      const res = await fetch(`/api/audit/security-events?${params}`);
      const data = await res.json();
      setSecurityEvents(data);
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const fetchAuditReports = async () => {
    try {
      const res = await fetch('/api/audit/reports');
      const data = await res.json();
      setAuditReports(data);
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.titulo || !reportForm.fechaInicio || !reportForm.fechaFin) {
      toast.error('Completa los campos requeridos');
      return;
    }
    try {
      const res = await fetch('/api/audit/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm),
      });
      if (res.ok) {
        toast.success('Reporte creado exitosamente');
        setOpenReportDialog(false);
        setReportForm({ titulo: '', descripcion: '', tipoReporte: 'accesos', fechaInicio: '', fechaFin: '' });
        fetchAuditReports();
      } else {
        toast.error('Error al crear reporte');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear reporte');
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    const nota = prompt('Nota de resolución:');
    if (!nota) return;
    try {
      const res = await fetch('/api/audit/security-events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, resolucionNota: nota }),
      });
      if (res.ok) {
        toast.success('Evento resuelto');
        fetchSecurityEvents();
      } else {
        toast.error('Error al resolver evento');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al resolver evento');
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchSecurityEvents();
  }, [filterSeverity, filterResolved, status]);

  const getSeverityBadge = (severidad: string) => {
    const variants: any = { info: 'default', warning: 'secondary', error: 'destructive', critical: 'destructive' };
    const labels: any = { info: 'Info', warning: 'Advertencia', error: 'Error', critical: 'Crítico' };
    return <Badge variant={variants[severidad] || 'default'}>{labels[severidad] || severidad}</Badge>;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Auditoría y Seguridad</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Auditoría y Seguridad</h1>
                <p className="text-muted-foreground mt-1">Monitorea actividad y eventos de seguridad</p>
              </div>
              <Dialog open={openReportDialog} onOpenChange={setOpenReportDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto"><FileText className="mr-2 h-4 w-4" />Generar Reporte</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Generar Reporte de Auditoría</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateReport} className="space-y-4">
                    <div>
                      <Label>Título *</Label>
                      <Input value={reportForm.titulo} onChange={(e) => setReportForm({ ...reportForm, titulo: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Tipo de Reporte *</Label>
                      <Select value={reportForm.tipoReporte} onValueChange={(value) => setReportForm({ ...reportForm, tipoReporte: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accesos">Accesos</SelectItem>
                          <SelectItem value="cambios">Cambios</SelectItem>
                          <SelectItem value="errores">Errores</SelectItem>
                          <SelectItem value="seguridad">Seguridad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Fecha Inicio *</Label>
                        <Input type="date" value={reportForm.fechaInicio} onChange={(e) => setReportForm({ ...reportForm, fechaInicio: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Fecha Fin *</Label>
                        <Input type="date" value={reportForm.fechaFin} onChange={(e) => setReportForm({ ...reportForm, fechaFin: e.target.value })} required />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setOpenReportDialog(false)}>Cancelar</Button>
                      <Button type="submit">Generar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eventos de Seguridad</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSecurityEvents}</div>
                  <p className="text-xs text-muted-foreground">{stats.unresolvedEvents} sin resolver</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.criticalEvents}</div>
                  <p className="text-xs text-muted-foreground">Requieren atención</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Logs de Auditoría</CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAuditLogs}</div>
                  <p className="text-xs text-muted-foreground">{stats.recentAuditLogs} últimos 30 días</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">En la plataforma</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="events" className="space-y-4">
            <TabsList>
              <TabsTrigger value="events">Eventos de Seguridad</TabsTrigger>
              <TabsTrigger value="reports">Reportes</TabsTrigger>
            </TabsList>
            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Severidad</Label>
                      <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Advertencia</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="critical">Crítico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Select value={filterResolved} onValueChange={setFilterResolved}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="false">Sin resolver</SelectItem>
                          <SelectItem value="true">Resueltos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                {securityEvents.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No se encontraron eventos</p>
                    </CardContent>
                  </Card>
                ) : (
                  securityEvents.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              {getSeverityBadge(event.severidad)}
                              <Badge variant="outline">{event.tipo}</Badge>
                              {event.resuelta ? (
                                <Badge variant="outline" className="bg-green-50">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />Resuelto
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50">
                                  <Clock className="mr-1 h-3 w-3" />Pendiente
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium">{event.descripcion}</p>
                            {event.user && <p className="text-xs text-muted-foreground">Usuario: {event.user.name}</p>}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                          {!event.resuelta && <Button size="sm" onClick={() => handleResolveEvent(event.id)}>Resolver</Button>}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="reports" className="space-y-4">
              {auditReports.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay reportes generados</p>
                  </CardContent>
                </Card>
              ) : (
                auditReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{report.titulo}</h3>
                          <Badge>{report.tipoReporte}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Eventos</p>
                            <p className="font-medium">{report.totalEventos}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Errores</p>
                            <p className="font-medium text-red-600">{report.eventosError}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Críticos</p>
                            <p className="font-medium text-orange-600">{report.eventosCriticos}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Generado por</p>
                            <p className="font-medium text-xs">{report.generadoPor}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Período: {format(new Date(report.fechaInicio), 'dd/MM/yyyy')} - {format(new Date(report.fechaFin), 'dd/MM/yyyy')}</span>
                          <span>•</span>
                          <span>Creado: {format(new Date(report.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
