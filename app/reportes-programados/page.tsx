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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Home,
  ArrowLeft,
  Plus,
  Clock,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Trash2,
  Send,
  FileSpreadsheet,
  FileDown,
  Settings,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface ScheduledReport {
  id: string;
  nombre: string;
  tipo: string;
  frecuencia: string;
  destinatarios: string[];
  incluirPdf: boolean;
  incluirCsv: boolean;
  activo: boolean;
  proximoEnvio: string;
  ultimoEnvio?: string;
  createdAt: string;
}

interface ReportFormData {
  nombre: string;
  tipo: string;
  frecuencia: string;
  destinatarios: string;
  incluirPdf: boolean;
  incluirCsv: boolean;
  activo: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ReportesProgramadosPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ReportFormData>({
    nombre: '',
    tipo: 'ingresos',
    frecuencia: 'semanal',
    destinatarios: '',
    incluirPdf: true,
    incluirCsv: true,
    activo: true,
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadReports();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scheduled-reports');
      if (response.ok) {
        const data = await response.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nombre || !formData.destinatarios) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          destinatarios: formData.destinatarios.split(',').map(e => e.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear reporte');
      }

      toast.success('Reporte programado creado');
      setShowNewDialog(false);
      loadReports();

      // Reset form
      setFormData({
        nombre: '',
        tipo: 'ingresos',
        frecuencia: 'semanal',
        destinatarios: '',
        incluirPdf: true,
        incluirCsv: true,
        activo: true,
      });
    } catch (error) {
      toast.error('Error al crear reporte');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, activo: boolean) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo }),
      });

      if (response.ok) {
        toast.success(activo ? 'Reporte activado' : 'Reporte pausado');
        loadReports();
      }
    } catch (error) {
      toast.error('Error al actualizar reporte');
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm('¿Eliminar este reporte programado?')) return;

    try {
      const response = await fetch(`/api/scheduled-reports/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Reporte eliminado');
        loadReports();
      }
    } catch (error) {
      toast.error('Error al eliminar reporte');
    }
  };

  const sendNow = async (id: string) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Reporte enviado');
        loadReports();
      } else {
        throw new Error('Error');
      }
    } catch (error) {
      toast.error('Error al enviar reporte');
    }
  };

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ingresos: 'Ingresos',
      gastos: 'Gastos',
      ocupacion: 'Ocupación',
      morosidad: 'Morosidad',
      mantenimiento: 'Mantenimiento',
      resumen: 'Resumen General',
      contratos: 'Contratos',
      inquilinos: 'Inquilinos',
    };
    return labels[tipo] || tipo;
  };

  const getFrequencyLabel = (frecuencia: string) => {
    const labels: Record<string, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
    };
    return labels[frecuencia] || frecuencia;
  };

  // Stats
  const stats = {
    total: reports.length,
    activos: reports.filter(r => r.activo).length,
    pausados: reports.filter(r => !r.activo).length,
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Reportes Programados</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Reportes Programados</h1>
              <p className="text-muted-foreground">
                Automatiza el envío de reportes por email
              </p>
            </div>
          </div>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Reporte
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Reportes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.activos}</p>
                  <p className="text-xs text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Pause className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pausados}</p>
                  <p className="text-xs text-muted-foreground">Pausados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Reportes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reportes Configurados
            </CardTitle>
            <CardDescription>
              Gestiona los reportes automáticos de tu empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Sin reportes programados</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primer reporte automático para recibir información periódica
                </p>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Reporte
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`border rounded-lg p-4 transition-all ${
                      report.activo ? 'hover:shadow-md' : 'opacity-60 bg-muted/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{report.nombre}</h4>
                          <Badge variant={report.activo ? 'default' : 'secondary'}>
                            {report.activo ? 'Activo' : 'Pausado'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            {getTypeLabel(report.tipo)}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {getFrequencyLabel(report.frecuencia)}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {report.destinatarios?.length || 0} destinatarios
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {report.incluirPdf && (
                            <Badge variant="outline" className="gap-1">
                              <FileDown className="h-3 w-3" />
                              PDF
                            </Badge>
                          )}
                          {report.incluirCsv && (
                            <Badge variant="outline" className="gap-1">
                              <FileSpreadsheet className="h-3 w-3" />
                              CSV
                            </Badge>
                          )}
                        </div>

                        {report.proximoEnvio && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Próximo envío: {new Date(report.proximoEnvio).toLocaleString('es-ES')}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendNow(report.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Enviar Ahora
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(report.id, !report.activo)}
                        >
                          {report.activo ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nuevo Reporte */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Reporte Programado
            </DialogTitle>
            <DialogDescription>
              Configura un reporte automático que se enviará periódicamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nombre del Reporte *</Label>
              <Input
                placeholder="Ej: Reporte semanal de ingresos"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div>
              <Label>Tipo de Reporte *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resumen">Resumen General</SelectItem>
                  <SelectItem value="ingresos">Ingresos</SelectItem>
                  <SelectItem value="gastos">Gastos</SelectItem>
                  <SelectItem value="ocupacion">Ocupación</SelectItem>
                  <SelectItem value="morosidad">Morosidad</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="contratos">Contratos</SelectItem>
                  <SelectItem value="inquilinos">Inquilinos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Frecuencia *</Label>
              <Select
                value={formData.frecuencia}
                onValueChange={(value) => setFormData({ ...formData, frecuencia: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diario</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Destinatarios (emails separados por coma) *</Label>
              <Input
                placeholder="admin@empresa.com, gestor@empresa.com"
                value={formData.destinatarios}
                onChange={(e) => setFormData({ ...formData, destinatarios: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Formatos a incluir</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pdf"
                  checked={formData.incluirPdf}
                  onCheckedChange={(checked) => setFormData({ ...formData, incluirPdf: !!checked })}
                />
                <Label htmlFor="pdf" className="cursor-pointer">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="csv"
                  checked={formData.incluirCsv}
                  onCheckedChange={(checked) => setFormData({ ...formData, incluirCsv: !!checked })}
                />
                <Label htmlFor="csv" className="cursor-pointer">CSV (Excel)</Label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Activar inmediatamente</Label>
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear Reporte'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
