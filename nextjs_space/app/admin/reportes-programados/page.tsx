'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Home,
  Mail,
  MoreVertical,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface ScheduledReport {
  id: string;
  nombre: string;
  tipo: 'morosidad' | 'ocupacion' | 'ingresos' | 'gastos' | 'mantenimiento' | 'general';
  frecuencia: 'diario' | 'semanal' | 'quincenal' | 'mensual';
  destinatarios: string[];
  ultimoEnvio: string | null;
  proximoEnvio: string;
  activo: boolean;
  incluirPdf: boolean;
  incluirCsv: boolean;
}

export default function ReportesProgramadosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'morosidad' as const,
    frecuencia: 'semanal' as const,
    destinatarios: '',
    activo: true,
    incluirPdf: true,
    incluirCsv: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'administrador' && session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        fetchReports();
      }
    }
  }, [status, session, router]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/scheduled-reports');
      if (!res.ok) throw new Error('Error al cargar reportes');
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar reportes programados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const destinatariosArray = formData.destinatarios
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (destinatariosArray.length === 0) {
        toast.error('Debe agregar al menos un destinatario');
        return;
      }

      const res = await fetch('/api/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          destinatarios: destinatariosArray,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear reporte');
      }

      toast.success('Reporte programado creado correctamente');
      setOpenDialog(false);
      resetForm();
      fetchReports();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al crear reporte programado');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este reporte programado?')) return;

    try {
      const res = await fetch(`/api/scheduled-reports/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar reporte');

      toast.success('Reporte eliminado correctamente');
      fetchReports();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar reporte');
    }
  };

  const handleSendReport = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduled-reports/${id}/send`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Error al enviar reporte');

      toast.success('Reporte enviado correctamente');
      fetchReports();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar reporte');
    }
  };

  const handleToggleStatus = async (report: ScheduledReport) => {
    try {
      const res = await fetch(`/api/scheduled-reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          activo: !report.activo,
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar reporte');

      toast.success(
        report.activo ? 'Reporte desactivado' : 'Reporte activado'
      );
      fetchReports();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar reporte');
    }
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
    };
    return labels[frecuencia] || frecuencia;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 lg:p-8">
          {/* Header con Breadcrumbs */}
          <div className="mb-6 space-y-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Inicio
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Reportes Programados</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Reportes Programados
                </h1>
                <p className="text-muted-foreground mt-2">
                  Configura el envío automático de reportes por email
                </p>
              </div>
              <div className="flex gap-2">
                <BackButton fallbackUrl="/dashboard" label="Volver al Dashboard" variant="outline" />
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Reporte
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Reportes Programados */}
          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No hay reportes programados
                </p>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Reporte
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <Card key={report.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {report.nombre}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            {getTipoLabel(report.tipo)}
                          </Badge>
                          <Badge
                            variant={report.activo ? 'default' : 'outline'}
                          >
                            {report.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleSendReport(report.id)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Ahora
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(report)}
                          >
                            {report.activo ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Frecuencia: {getFrecuenciaLabel(report.frecuencia)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {report.destinatarios.length} destinatario(s)
                    </div>
                    {report.ultimoEnvio && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Último envío:
                        </span>{' '}
                        {format(
                          new Date(report.ultimoEnvio),
                          'dd MMM yyyy',
                          { locale: es }
                        )}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Próximo envío:
                      </span>{' '}
                      {format(
                        new Date(report.proximoEnvio),
                        'dd MMM yyyy',
                        { locale: es }
                      )}
                    </div>
                    <div className="flex gap-2 text-xs">
                      {report.incluirPdf && (
                        <Badge variant="outline">PDF</Badge>
                      )}
                      {report.incluirCsv && (
                        <Badge variant="outline">CSV</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dialog para crear reporte */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo Reporte Programado</DialogTitle>
                <DialogDescription>
                  Configura el envío automático de reportes por email
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre del Reporte</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder="Ej: Reporte Semanal de Morosidad"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo de Reporte</Label>
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
                      <SelectItem value="mantenimiento">
                        Mantenimiento
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frecuencia">Frecuencia de Envío</Label>
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destinatarios">
                    Destinatarios (separados por comas)
                  </Label>
                  <Input
                    id="destinatarios"
                    value={formData.destinatarios}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destinatarios: e.target.value,
                      })
                    }
                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="incluirPdf">Incluir PDF</Label>
                  <Switch
                    id="incluirPdf"
                    checked={formData.incluirPdf}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, incluirPdf: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="incluirCsv">Incluir CSV</Label>
                  <Switch
                    id="incluirCsv"
                    checked={formData.incluirCsv}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, incluirCsv: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activo">Activar inmediatamente</Label>
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, activo: checked })
                    }
                  />
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
                <Button onClick={handleCreateReport}>Crear Reporte</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
