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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Calendar,
  Home,
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  Euro,
  Building2,
  Users,
  FileSpreadsheet,
  Clock,
  Plus,
  Eye,
  Send,
  Settings,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'occupancy' | 'maintenance' | 'custom';
  lastGenerated?: string;
  schedule?: string;
  format: 'pdf' | 'excel' | 'both';
}

const reportTemplates: Report[] = [
  {
    id: 'r1',
    name: 'Informe de Ingresos Mensual',
    description: 'Resumen de todos los ingresos por alquiler del mes',
    type: 'financial',
    lastGenerated: '2025-01-20',
    schedule: 'Mensual (día 1)',
    format: 'both',
  },
  {
    id: 'r2',
    name: 'Estado de Ocupación',
    description: 'Porcentaje de ocupación por propiedad y unidad',
    type: 'occupancy',
    lastGenerated: '2025-01-15',
    format: 'pdf',
  },
  {
    id: 'r3',
    name: 'Gastos por Propiedad',
    description: 'Desglose de gastos de mantenimiento y servicios',
    type: 'financial',
    lastGenerated: '2025-01-18',
    format: 'excel',
  },
  {
    id: 'r4',
    name: 'Incidencias y Mantenimiento',
    description: 'Resumen de tickets y tiempos de resolución',
    type: 'maintenance',
    lastGenerated: '2025-01-22',
    schedule: 'Semanal (lunes)',
    format: 'pdf',
  },
  {
    id: 'r5',
    name: 'Contratos por Vencer',
    description: 'Lista de contratos que vencen en los próximos 90 días',
    type: 'operational',
    lastGenerated: '2025-01-21',
    format: 'both',
  },
  {
    id: 'r6',
    name: 'Rentabilidad por Inmueble',
    description: 'ROI y métricas de rentabilidad por propiedad',
    type: 'financial',
    format: 'pdf',
  },
  {
    id: 'r7',
    name: 'Listado de Inquilinos',
    description: 'Directorio completo de inquilinos activos',
    type: 'operational',
    lastGenerated: '2025-01-19',
    format: 'excel',
  },
  {
    id: 'r8',
    name: 'Balance de Garantías',
    description: 'Estado de fianzas y avales depositados',
    type: 'financial',
    format: 'pdf',
  },
];

export default function InformesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(false);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return <Euro className="h-5 w-5 text-green-600" />;
      case 'operational': return <Settings className="h-5 w-5 text-blue-600" />;
      case 'occupancy': return <Building2 className="h-5 w-5 text-purple-600" />;
      case 'maintenance': return <TrendingUp className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { className: string; label: string }> = {
      financial: { className: 'bg-green-100 text-green-800', label: 'Financiero' },
      operational: { className: 'bg-blue-100 text-blue-800', label: 'Operacional' },
      occupancy: { className: 'bg-purple-100 text-purple-800', label: 'Ocupación' },
      maintenance: { className: 'bg-orange-100 text-orange-800', label: 'Mantenimiento' },
      custom: { className: 'bg-gray-100 text-gray-800', label: 'Personalizado' },
    };
    const { className, label } = config[type] || config.custom;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const handleGenerateReport = async (reportId: string, format: 'pdf' | 'excel') => {
    setGeneratingReport(reportId);
    try {
      // Simular generación
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Informe generado en formato ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error al generar el informe');
    } finally {
      setGeneratingReport(null);
    }
  };

  const filteredReports = activeTab === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(r => r.type === activeTab);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Informes</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 rounded-xl">
              <BarChart3 className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Informes y Reportes</h1>
              <p className="text-muted-foreground">Genera y descarga informes personalizados</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />Crear Informe Personalizado
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerateReport('quick-financial', 'pdf')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resumen Financiero</p>
                  <p className="font-semibold">Generar Rápido</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerateReport('quick-occupancy', 'pdf')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ocupación</p>
                  <p className="font-semibold">Generar Rápido</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerateReport('quick-tenants', 'excel')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Listado Inquilinos</p>
                  <p className="font-semibold">Exportar Excel</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerateReport('quick-contracts', 'pdf')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contratos</p>
                  <p className="font-semibold">Por Vencer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de filtro */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="financial">Financieros</TabsTrigger>
            <TabsTrigger value="operational">Operacionales</TabsTrigger>
            <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(report.type)}
                        <div>
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <CardDescription className="mt-1">{report.description}</CardDescription>
                        </div>
                      </div>
                      {getTypeBadge(report.type)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      {report.lastGenerated && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Último: {new Date(report.lastGenerated).toLocaleDateString('es-ES')}
                        </span>
                      )}
                      {report.schedule && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {report.schedule}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(report.format === 'pdf' || report.format === 'both') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          disabled={generatingReport === report.id}
                          onClick={() => handleGenerateReport(report.id, 'pdf')}
                        >
                          {generatingReport === report.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          PDF
                        </Button>
                      )}
                      {(report.format === 'excel' || report.format === 'both') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          disabled={generatingReport === report.id}
                          onClick={() => handleGenerateReport(report.id, 'excel')}
                        >
                          {generatingReport === report.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          ) : (
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                          )}
                          Excel
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Informes Programados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informes Programados
            </CardTitle>
            <CardDescription>Informes que se generan automáticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportTemplates.filter(r => r.schedule).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(report.type)}
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.schedule}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">Activo</Badge>
                    <Button variant="ghost" size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
