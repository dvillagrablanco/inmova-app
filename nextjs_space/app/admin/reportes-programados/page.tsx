'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDays,
  FileText,
  Mail,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import logger, { logError } from '@/lib/logger';

interface ScheduledReport {
  id: string;
  nombre: string;
  tipo: 'morosidad' | 'ocupacion' | 'ingresos' | 'gastos' | 'mantenimiento' | 'general';
  frecuencia: 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'anual';
  destinatarios: string[];
  ultimoEnvio: string | null;
  proximoEnvio: string;
  activo: boolean;
  incluirPdf: boolean;
  incluirCsv: boolean;
  filtros?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportHistory {
  id: string;
  reportId: string;
  fechaEnvio: string;
  destinatarios: string[];
  estado: 'exitoso' | 'fallido';
  error?: string;
}

export default function ReportesProgramadosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingReport, setDeletingReport] = useState<{ id: string; nombre: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendingReport, setSendingReport] = useState<{ id: string; nombre: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [formData, setFormData] = useState<{
    nombre: string;
    tipo: 'morosidad' | 'ocupacion' | 'ingresos' | 'gastos' | 'mantenimiento' | 'general';
    frecuencia: 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'anual';
    destinatarios: string;
    activo: boolean;
    incluirPdf: boolean;
    incluirCsv: boolean;
    filtros: string;
  }>({
    nombre: '',
    tipo: 'morosidad',
    frecuencia: 'semanal',
    destinatarios: '',
    activo: true,
    incluirPdf: true,
    incluirCsv: true,
    filtros: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'administrador' && session?.user?.role !== 'super_admin' && session?.user?.role !== 'gestor') {
        router.push('/unauthorized');
        return;
      }
      fetchReports();
    }
  }, [status, session, router]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/scheduled-reports');
      if (!response.ok) throw new Error('Error al cargar reportes');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar reportes programados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/scheduled-reports/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const fetchHistory = async (reportId: string) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleSave = async () => {
    try {
      const destinatariosArray = formData.destinatarios
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email);

      if (destinatariosArray.length === 0) {
        toast.error('Debes agregar al menos un destinatario');
        return;
      }

      const body = {
        ...formData,
        destinatarios: destinatariosArray,
      };

      const url = editingReport
        ? `/api/scheduled-reports/${editingReport.id}`
        : '/api/scheduled-reports';
      
      const method = editingReport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar reporte');
      }

      toast.success(
        editingReport
          ? 'Reporte actualizado correctamente'
          : 'Reporte programado creado correctamente'
      );

      setOpenDialog(false);
      resetForm();
      fetchReports();
    } catch (error: any) {
      logger.error('Error:', error);
      toast.error(error.message || 'Error al guardar reporte');
    }
  };

  const confirmDelete = (report: ScheduledReport) => {
    setDeletingReport({ id: report.id, nombre: report.nombre });
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingReport) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/scheduled-reports/${deletingReport.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar reporte');

      toast.success('Reporte eliminado correctamente');
      fetchReports();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar reporte');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeletingReport(null);
    }
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          activo: !report.activo,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar reporte');

      toast.success(
        report.activo ? 'Reporte desactivado' : 'Reporte activado'
      );
      fetchReports();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar reporte');
    }
  };

  const confirmSendNow = (report: ScheduledReport) => {
    setSendingReport({ id: report.id, nombre: report.nombre });
    setShowSendDialog(true);
  };

  const handleSendNow = async () => {
    if (!sendingReport) return;

    try {
      setIsSending(true);
      setSending(sendingReport.id);
      const response = await fetch(`/api/scheduled-reports/${sendingReport.id}/send`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error al enviar reporte');

      toast.success('Reporte enviado correctamente');
      fetchReports();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al enviar reporte');
    } finally {
      setIsSending(false);
      setSending(null);
      setShowSendDialog(false);
      setSendingReport(null);
    }
  };

  const handleShowHistory = (reportId: string) => {
    setSelectedReportId(reportId);
    fetchHistory(reportId);
    setOpenHistoryDialog(true);
  };

  const openNewDialog = () => {
    resetForm();
    setEditingReport(null);
    setOpenDialog(true);
  };

  const openTemplatesDialogHandler = () => {
    fetchTemplates();
    setShowTemplatesDialog(true);
  };

  const useTemplate = (template: any) => {
    setFormData({
      nombre: template.nombre,
      tipo: template.tipo,
      frecuencia: template.frecuenciaSugerida,
      destinatarios: '',
      activo: true,
      incluirPdf: template.incluirPdf,
      incluirCsv: template.incluirCsv,
      filtros: template.filtros || '',
    });
    setShowTemplatesDialog(false);
    setEditingReport(null);
    setOpenDialog(true);
  };

  const openEditDialog = (report: ScheduledReport) => {
    setFormData({
      nombre: report.nombre,
      tipo: report.tipo,
      frecuencia: report.frecuencia,
      destinatarios: report.destinatarios.join(', '),
      activo: report.activo,
      incluirPdf: report.incluirPdf,
      incluirCsv: report.incluirCsv,
      filtros: report.filtros || '',
    });
    setEditingReport(report);
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'morosidad',
      frecuencia: 'semanal',
      destinatarios: '',
      activo: true,
      incluirPdf: true,
      incluirCsv: true,
      filtros: '',
    });
    setEditingReport(null);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      morosidad: 'Morosidad',
      ocupacion: 'Ocupación',
      ingresos: 'Ingresos',
      gastos: 'Gastos',
      mantenimiento: 'Mantenimiento',
      general: 'General',
    };
    return labels[tipo] || tipo;
  };

  const getFrecuenciaLabel = (frecuencia: string) => {
    const labels: Record<string, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
      trimestral: 'Trimestral',
      anual: 'Anual',
    };
    return labels[frecuencia] || frecuencia;
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      morosidad: 'bg-red-100 text-red-800',
      ocupacion: 'bg-blue-100 text-blue-800',
      ingresos: 'bg-green-100 text-green-800',
      gastos: 'bg-amber-100 text-amber-800',
      mantenimiento: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="mt-2 text-sm text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  Reportes Programados
                </h1>
                <p className="text-gray-600 mt-1">
                  Configura reportes automáticos por email
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={openTemplatesDialogHandler} variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Plantillas
                </Button>
                <Button onClick={openNewDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Reporte
                </Button>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{reports.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Activos</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reports.filter((r) => r.activo).length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pausados</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {reports.filter((r) => !r.activo).length}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Próximos 7 días</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reports.filter((r) => {
                          const days = Math.ceil(
                            (new Date(r.proximoEnvio).getTime() - Date.now()) /
                              (1000 * 60 * 60 * 24)
                          );
                          return days <= 7 && days >= 0;
                        }).length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Reportes */}
            <Card>
              <CardHeader>
                <CardTitle>Reportes Configurados</CardTitle>
                <CardDescription>
                  Gestiona tus reportes automáticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No hay reportes programados
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Comienza creando tu primer reporte automático.
                    </p>
                    <Button onClick={openNewDialog} className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Crear Reporte
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {report.nombre}
                            </h3>
                            <Badge className={getTipoBadgeColor(report.tipo)}>
                              {getTipoLabel(report.tipo)}
                            </Badge>
                            <Badge variant="outline">
                              {getFrecuenciaLabel(report.frecuencia)}
                            </Badge>
                            {report.activo ? (
                              <Badge className="bg-green-100 text-green-800">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pausado</Badge>
                            )}
                          </div>

                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>
                                {report.destinatarios.length} destinatario
                                {report.destinatarios.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              <span>
                                Próximo envío:{' '}
                                {format(new Date(report.proximoEnvio), 'PPP', {
                                  locale: es,
                                })}{' '}
                                (
                                {formatDistanceToNow(new Date(report.proximoEnvio), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                                )
                              </span>
                            </div>
                            {report.ultimoEnvio && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>
                                  Último envío:{' '}
                                  {format(new Date(report.ultimoEnvio), 'PPP', {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            {report.incluirPdf && (
                              <Badge variant="outline" className="text-xs">
                                PDF
                              </Badge>
                            )}
                            {report.incluirCsv && (
                              <Badge variant="outline" className="text-xs">
                                CSV
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmSendNow(report)}
                            disabled={sending === report.id}
                          >
                            {sending === report.id ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar ahora
                              </>
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(report)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(report)}
                              >
                                {report.activo ? (
                                  <>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Pausar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleShowHistory(report.id)}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Ver historial
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => confirmDelete(report)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialog Crear/Editar */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'Editar Reporte' : 'Nuevo Reporte Programado'}
            </DialogTitle>
            <DialogDescription>
              Configura un reporte automático que se enviará por email según la
              frecuencia seleccionada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Reporte *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Reporte Semanal de Morosidad"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Reporte *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morosidad">Morosidad</SelectItem>
                    <SelectItem value="ocupacion">Ocupación</SelectItem>
                    <SelectItem value="ingresos">Ingresos</SelectItem>
                    <SelectItem value="gastos">Gastos</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frecuencia">Frecuencia *</Label>
                <Select
                  value={formData.frecuencia}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, frecuencia: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diario</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinatarios">
                Destinatarios (separados por comas) *
              </Label>
              <Textarea
                id="destinatarios"
                placeholder="email1@ejemplo.com, email2@ejemplo.com"
                value={formData.destinatarios}
                onChange={(e) =>
                  setFormData({ ...formData, destinatarios: e.target.value })
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Ingresa uno o más emails separados por comas
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Formatos de Exportación</Label>
              <div className="flex items-center justify-between">
                <Label htmlFor="incluirPdf" className="cursor-pointer">
                  Incluir PDF
                </Label>
                <Switch
                  id="incluirPdf"
                  checked={formData.incluirPdf}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, incluirPdf: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="incluirCsv" className="cursor-pointer">
                  Incluir CSV
                </Label>
                <Switch
                  id="incluirCsv"
                  checked={formData.incluirCsv}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, incluirCsv: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="activo" className="cursor-pointer">
                  Activar inmediatamente
                </Label>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, activo: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingReport ? 'Actualizar' : 'Crear'} Reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Historial */}
      <Dialog open={openHistoryDialog} onOpenChange={setOpenHistoryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historial de Envíos</DialogTitle>
            <DialogDescription>
              Últimos envíos de este reporte
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay historial de envíos
              </p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  {item.estado === 'exitoso' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {format(new Date(item.fechaEnvio), 'PPP HH:mm', {
                          locale: es,
                        })}
                      </span>
                      <Badge
                        variant={
                          item.estado === 'exitoso' ? 'default' : 'destructive'
                        }
                      >
                        {item.estado}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enviado a: {item.destinatarios.join(', ')}
                    </p>
                    {item.error && (
                      <p className="text-sm text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenHistoryDialog(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Plantillas */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plantillas de Reportes</DialogTitle>
            <DialogDescription>
              Selecciona una plantilla predefinida para crear tu reporte r\u00e1pidamente
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="all" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="morosidad">Morosidad</TabsTrigger>
              <TabsTrigger value="ocupacion">Ocupaci\u00f3n</TabsTrigger>
              <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
              <TabsTrigger value="gastos">Gastos</TabsTrigger>
              <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition cursor-pointer" onClick={() => useTemplate(template)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.nombre}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getTipoBadgeColor(template.tipo)}>
                          {getTipoLabel(template.tipo)}
                        </Badge>
                        <Badge variant="outline">
                          {getFrecuenciaLabel(template.frecuenciaSugerida)}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{template.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {template.incluirPdf && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          PDF
                        </div>
                      )}
                      {template.incluirCsv && (
                        <div className="flex items-center gap-1">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        {template.campos.length} campos
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {['morosidad', 'ocupacion', 'ingresos', 'gastos', 'mantenimiento', 'general'].map((tipo) => (
              <TabsContent key={tipo} value={tipo} className="space-y-3 mt-4">
                {templates.filter(t => t.tipo === tipo).map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition cursor-pointer" onClick={() => useTemplate(template)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.nombre}</CardTitle>
                        <Badge variant="outline">
                          {getFrecuenciaLabel(template.frecuenciaSugerida)}
                        </Badge>
                      </div>
                      <CardDescription>{template.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {template.incluirPdf && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            PDF
                          </div>
                        )}
                        {template.incluirCsv && (
                          <div className="flex items-center gap-1">
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Database className="h-4 w-4" />
                          {template.campos.length} campos
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {templates.filter(t => t.tipo === tipo).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay plantillas para esta categor\u00eda
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplatesDialog(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ConfirmDialog para eliminar reporte */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Eliminar reporte programado?"
        description={`¿Estás seguro de que deseas eliminar el reporte "${deletingReport?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />

      {/* ConfirmDialog para enviar reporte */}
      <ConfirmDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        title="¿Enviar reporte ahora?"
        description={`¿Estás seguro de que deseas enviar el reporte "${sendingReport?.nombre}" a todos los destinatarios configurados?`}
        onConfirm={handleSendNow}
        confirmText="Enviar"
        isLoading={isSending}
      />
    </div>
  );
}
