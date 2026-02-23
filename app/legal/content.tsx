'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  FileText,
  ClipboardCheck,
  Shield,
  AlertCircle,
  CheckCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

interface Template {
  id: string;
  nombre: string;
  categoria: string;
  activo: boolean;
}
interface Inspection {
  id: string;
  tipo: string;
  estado: string;
  fechaProgramada: string;
}
interface Insurance {
  id: string;
  tipoSeguro: string;
  numeroPoliza: string;
  aseguradora: string;
  fechaVencimiento: string;
  estado: string;
  primaAnual: number;
}
interface ComplianceAlert {
  id: string;
  tipo: string;
  titulo: string;
  fechaLimite: string;
  estado: string;
  prioridad: string;
  completada: boolean;
}

export default function LegalContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form visibility
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [showComplianceForm, setShowComplianceForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchData();
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [t, i, ins, c] = await Promise.all([
        fetch('/api/legal/templates').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/legal/inspections').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/legal/insurance').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/legal/compliance').then((r) => (r.ok ? r.json() : [])),
      ]);
      setTemplates(Array.isArray(t) ? t : t.data || []);
      setInspections(Array.isArray(i) ? i : i.data || []);
      setInsurances(Array.isArray(ins) ? ins : ins.data || []);
      setComplianceAlerts(Array.isArray(c) ? c : c.data || []);
    } catch {
      toast.error('Error al cargar datos legales');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (endpoint: string, id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      const res = await fetch(`/api/legal/${endpoint}/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 404) {
        toast.success('Registro eliminado');
        fetchData();
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  const handleCreate = async (
    endpoint: string,
    data: Record<string, any>,
    closeForm: () => void
  ) => {
    try {
      const res = await fetch(`/api/legal/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Registro creado');
        closeForm();
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Error al crear');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestión Legal</h1>
          <p className="text-muted-foreground">
            Plantillas, inspecciones, seguros y cumplimiento normativo
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Plantillas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.filter((t) => t.activo).length}</div>
              <p className="text-xs text-muted-foreground">{templates.length} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inspecciones</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inspections.length}</div>
              <p className="text-xs text-muted-foreground">
                {inspections.filter((i) => i.estado === 'programada').length} programadas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Seguros</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insurances.filter((i) => i.estado === 'activa').length}
              </div>
              <p className="text-xs text-muted-foreground">{insurances.length} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {complianceAlerts.filter((a) => !a.completada).length}
              </div>
              <p className="text-xs text-muted-foreground">pendientes</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
            <TabsTrigger value="inspections">Inspecciones</TabsTrigger>
            <TabsTrigger value="insurance">Seguros</TabsTrigger>
            <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          </TabsList>

          {/* PLANTILLAS */}
          <TabsContent value="templates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Plantillas Legales</CardTitle>
                <Button size="sm" onClick={() => setShowTemplateForm(!showTemplateForm)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Plantilla
                </Button>
              </CardHeader>
              <CardContent>
                {showTemplateForm && (
                  <form
                    className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      handleCreate(
                        'templates',
                        {
                          nombre: fd.get('nombre'),
                          categoria: fd.get('categoria') || 'contrato',
                          descripcion: fd.get('descripcion') || '',
                          contenido: '',
                        },
                        () => setShowTemplateForm(false)
                      );
                    }}
                  >
                    <Input name="nombre" placeholder="Nombre de la plantilla" required />
                    <Input
                      name="categoria"
                      placeholder="Categoría (ej: contrato, adenda, finiquito)"
                    />
                    <Input name="descripcion" placeholder="Descripción" />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Crear
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
                <div className="space-y-2">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between border-b py-3 last:border-0"
                    >
                      <div>
                        <div className="font-medium">{t.nombre}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {t.categoria?.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={t.activo ? 'default' : 'secondary'}>
                          {t.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('templates', t.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && !showTemplateForm && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay plantillas legales
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INSPECCIONES */}
          <TabsContent value="inspections">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Inspecciones</CardTitle>
                <Button size="sm" onClick={() => setShowInspectionForm(!showInspectionForm)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Inspección
                </Button>
              </CardHeader>
              <CardContent>
                {showInspectionForm && (
                  <form
                    className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      handleCreate(
                        'inspections',
                        {
                          tipo: fd.get('tipo') || 'general',
                          fechaProgramada: fd.get('fechaProgramada'),
                          descripcion: fd.get('descripcion') || '',
                        },
                        () => setShowInspectionForm(false)
                      );
                    }}
                  >
                    <Input
                      name="tipo"
                      placeholder="Tipo (ej: general, ite, cee, electrica)"
                      required
                    />
                    <Input name="fechaProgramada" type="date" required />
                    <Input name="descripcion" placeholder="Descripción" />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Crear
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInspectionForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
                <div className="space-y-2">
                  {inspections.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between border-b py-3 last:border-0"
                    >
                      <div>
                        <div className="font-medium capitalize">{i.tipo}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(i.fechaProgramada), 'dd/MM/yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            i.estado === 'completada'
                              ? 'bg-green-500'
                              : i.estado === 'programada'
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                          }
                        >
                          {i.estado?.replace(/_/g, ' ')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('inspections', i.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {inspections.length === 0 && !showInspectionForm && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay inspecciones
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEGUROS */}
          <TabsContent value="insurance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pólizas de Seguro</CardTitle>
                <Button size="sm" onClick={() => setShowInsuranceForm(!showInsuranceForm)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Póliza
                </Button>
              </CardHeader>
              <CardContent>
                {showInsuranceForm && (
                  <form
                    className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      handleCreate(
                        'insurance',
                        {
                          tipoSeguro: fd.get('tipoSeguro'),
                          numeroPoliza: fd.get('numeroPoliza'),
                          aseguradora: fd.get('aseguradora'),
                          fechaInicio: fd.get('fechaInicio'),
                          fechaVencimiento: fd.get('fechaVencimiento'),
                          primaAnual: parseFloat(fd.get('primaAnual') as string) || 0,
                          nombreAsegurado: fd.get('nombreAsegurado') || '',
                          coberturaTotal: parseFloat(fd.get('coberturaTotal') as string) || 0,
                        },
                        () => setShowInsuranceForm(false)
                      );
                    }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        name="tipoSeguro"
                        placeholder="Tipo (ej: multirriesgo, RC, vida)"
                        required
                      />
                      <Input name="aseguradora" placeholder="Aseguradora" required />
                      <Input name="numeroPoliza" placeholder="N° Póliza" required />
                      <Input name="nombreAsegurado" placeholder="Nombre asegurado" />
                      <Input name="fechaInicio" type="date" required />
                      <Input name="fechaVencimiento" type="date" required />
                      <Input
                        name="primaAnual"
                        type="number"
                        step="0.01"
                        placeholder="Prima anual (€)"
                        required
                      />
                      <Input
                        name="coberturaTotal"
                        type="number"
                        step="0.01"
                        placeholder="Cobertura total (€)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Crear
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInsuranceForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
                <div className="space-y-2">
                  {insurances.map((ins) => (
                    <div
                      key={ins.id}
                      className="flex items-center justify-between border-b py-3 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {ins.tipoSeguro} — {ins.aseguradora}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Póliza: {ins.numeroPoliza} | Vence:{' '}
                          {format(new Date(ins.fechaVencimiento), 'dd/MM/yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          €{ins.primaAnual?.toLocaleString('es-ES')}/año
                        </span>
                        <Badge
                          className={
                            ins.estado === 'activa'
                              ? 'bg-green-500'
                              : ins.estado === 'vencida'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                          }
                        >
                          {ins.estado?.replace(/_/g, ' ')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('insurance', ins.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {insurances.length === 0 && !showInsuranceForm && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay pólizas de seguro
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CUMPLIMIENTO */}
          <TabsContent value="compliance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Alertas de Cumplimiento</CardTitle>
                <Button size="sm" onClick={() => setShowComplianceForm(!showComplianceForm)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Alerta
                </Button>
              </CardHeader>
              <CardContent>
                {showComplianceForm && (
                  <form
                    className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      handleCreate(
                        'compliance',
                        {
                          tipo: fd.get('tipo') || 'normativa',
                          titulo: fd.get('titulo'),
                          descripcion: fd.get('descripcion') || '',
                          fechaLimite: fd.get('fechaLimite'),
                          prioridad: fd.get('prioridad') || 'media',
                        },
                        () => setShowComplianceForm(false)
                      );
                    }}
                  >
                    <Input name="titulo" placeholder="Título de la alerta" required />
                    <Input name="tipo" placeholder="Tipo (ej: normativa, licencia, certificado)" />
                    <Input name="descripcion" placeholder="Descripción" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input name="fechaLimite" type="date" required />
                      <Input name="prioridad" placeholder="Prioridad (alta, media, baja)" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Crear
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowComplianceForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
                <div className="space-y-2">
                  {complianceAlerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between border-b py-3 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {a.completada ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{a.titulo}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Límite: {format(new Date(a.fechaLimite), 'dd/MM/yyyy')} | Prioridad:{' '}
                          {a.prioridad}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.completada ? 'default' : 'destructive'}>
                          {a.completada ? 'Completada' : 'Pendiente'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('compliance', a.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {complianceAlerts.length === 0 && !showComplianceForm && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay alertas de cumplimiento
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
