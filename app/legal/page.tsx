'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Home,
  FileText,
  ClipboardCheck,
  Shield,
  AlertCircle,
  CheckCircle,
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
  unitId?: string;
  buildingId?: string;
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

const INSPECTION_STATUS_COLORS: Record<string, string> = {
  programada: 'bg-blue-500',
  completada: 'bg-green-500',
  pendiente_accion: 'bg-yellow-500',
};

const POLICY_STATUS_COLORS: Record<string, string> = {
  activa: 'bg-green-500',
  por_renovar: 'bg-yellow-500',
  vencida: 'bg-red-500',
  cancelada: 'bg-gray-500',
};

export default function LegalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchData();
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [templatesRes, inspectionsRes, insurancesRes, complianceRes] = await Promise.all([
        fetch('/api/legal/templates'),
        fetch('/api/legal/inspections'),
        fetch('/api/legal/insurance'),
        fetch('/api/legal/compliance'),
      ]);

      if (templatesRes.ok) setTemplates(await templatesRes.json());
      if (inspectionsRes.ok) setInspections(await inspectionsRes.json());
      if (insurancesRes.ok) setInsurances(await insurancesRes.json());
      if (complianceRes.ok) setComplianceAlerts(await complianceRes.json());
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  const pendingCompliance = complianceAlerts.filter((a) => !a.completada).length;
  const activeInsurances = insurances.filter((i) => i.estado === 'activa').length;
  const scheduledInspections = inspections.filter((i) => i.estado === 'programada').length;

  return (
    <AuthenticatedLayout>
          <div className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Gestión Legal</h1>
                <Breadcrumb className="mt-2">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">
                        <Home className="h-4 w-4" />
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>Legal</BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 mb-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Plantillas Legales</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.filter((t) => t.activo).length}</div>
                <p className="text-xs text-muted-foreground">Activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Inspecciones</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledInspections}</div>
                <p className="text-xs text-muted-foreground">Programadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Seguros</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeInsurances}</div>
                <p className="text-xs text-muted-foreground">Activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Alertas Pendientes</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{pendingCompliance}</div>
                <p className="text-xs text-muted-foreground">Por resolver</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="templates" className="space-y-4">
            <TabsList>
              <TabsTrigger value="templates">Plantillas</TabsTrigger>
              <TabsTrigger value="inspections">Inspecciones</TabsTrigger>
              <TabsTrigger value="insurance">Seguros</TabsTrigger>
              <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Plantillas Legales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between border-b py-2 last:border-0"
                      >
                        <div>
                          <div className="font-medium">{template.nombre}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {template.categoria.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <Badge variant={template.activo ? 'default' : 'secondary'}>
                          {template.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay plantillas legales. Crea tu primera plantilla.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inspections">
              <Card>
                <CardHeader>
                  <CardTitle>Inspecciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {inspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between border-b py-2 last:border-0 gap-2"
                      >
                        <div>
                          <div className="font-medium capitalize">{inspection.tipo}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(inspection.fechaProgramada), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        <Badge className={INSPECTION_STATUS_COLORS[inspection.estado]}>
                          {inspection.estado.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    ))}
                    {inspections.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay inspecciones programadas.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance">
              <Card>
                <CardHeader>
                  <CardTitle>Pólizas de Seguro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insurances.map((insurance) => (
                      <div
                        key={insurance.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between border-b py-2 last:border-0 gap-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {insurance.tipoSeguro} - {insurance.aseguradora}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Póliza: {insurance.numeroPoliza} | Vence:{' '}
                            {format(new Date(insurance.fechaVencimiento), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            €{insurance.primaAnual.toLocaleString('es-ES')}/año
                          </div>
                          <Badge className={POLICY_STATUS_COLORS[insurance.estado]}>
                            {insurance.estado.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {insurances.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay pólizas de seguro registradas.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance">
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Cumplimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {complianceAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between border-b py-2 last:border-0 gap-2"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {alert.completada ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">{alert.titulo}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Límite: {format(new Date(alert.fechaLimite), 'dd/MM/yyyy')} | Prioridad:{' '}
                            {alert.prioridad}
                          </div>
                        </div>
                        <Badge variant={alert.completada ? 'default' : 'destructive'}>
                          {alert.completada ? 'Completada' : 'Pendiente'}
                        </Badge>
                      </div>
                    ))}
                    {complianceAlerts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay alertas de cumplimiento.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </AuthenticatedLayout>
  );
}
