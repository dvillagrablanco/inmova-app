'use client';

/**
 * Informes Personalizados - Inmova App
 * 
 * Centro de generación de informes y reportes:
 * - Constructor de informes
 * - Plantillas predefinidas
 * - Exportación a PDF y Excel
 * - Programación de informes automáticos
 * - Visualizaciones interactivas
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Download,
  FileSpreadsheet,
  FilePdf,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  Eye,
  MoreHorizontal,
  Building2,
  Euro,
  Users,
  Wrench,
  TrendingUp,
  PieChart,
  BarChart3,
  LineChart,
  Mail,
  RefreshCw,
  Search,
  Filter,
  Settings,
  Sparkles,
  Star,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Share2,
  History,
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface ReportTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: 'financiero' | 'operacional' | 'inquilinos' | 'propiedades' | 'custom';
  icono: string;
  popular: boolean;
  campos: string[];
}

interface SavedReport {
  id: string;
  nombre: string;
  template: string;
  createdAt: string;
  updatedAt: string;
  ultimaGeneracion: string | null;
  formato: 'pdf' | 'excel' | 'ambos';
  programado: boolean;
  frecuencia?: 'diario' | 'semanal' | 'mensual';
  estado: 'activo' | 'pausado' | 'borrador';
}

interface ReportHistory {
  id: string;
  reporteId: string;
  nombreReporte: string;
  generadoEl: string;
  formato: 'pdf' | 'excel';
  tamaño: string;
  descargado: boolean;
}

// Mock Data
const mockTemplates: ReportTemplate[] = [
  {
    id: 't1',
    nombre: 'Resumen Mensual de Ingresos',
    descripcion: 'Reporte completo de ingresos por alquiler, incluyendo desglose por propiedad.',
    categoria: 'financiero',
    icono: 'euro',
    popular: true,
    campos: ['periodo', 'propiedades', 'desglose', 'graficos'],
  },
  {
    id: 't2',
    nombre: 'Estado de Ocupación',
    descripcion: 'Análisis de ocupación actual de todas las propiedades con tendencias.',
    categoria: 'operacional',
    icono: 'building',
    popular: true,
    campos: ['propiedades', 'ocupacion', 'tendencias', 'vacantes'],
  },
  {
    id: 't3',
    nombre: 'Listado de Inquilinos',
    descripcion: 'Directorio completo de inquilinos con datos de contacto y contratos.',
    categoria: 'inquilinos',
    icono: 'users',
    popular: false,
    campos: ['inquilinos', 'contratos', 'contacto', 'pagos'],
  },
  {
    id: 't4',
    nombre: 'Cartera de Propiedades',
    descripcion: 'Inventario detallado de propiedades con valoración y rentabilidad.',
    categoria: 'propiedades',
    icono: 'building',
    popular: true,
    campos: ['propiedades', 'valoracion', 'rentabilidad', 'caracteristicas'],
  },
  {
    id: 't5',
    nombre: 'Incidencias de Mantenimiento',
    descripcion: 'Histórico y estado de todas las incidencias de mantenimiento.',
    categoria: 'operacional',
    icono: 'wrench',
    popular: false,
    campos: ['incidencias', 'proveedores', 'tiempos', 'costes'],
  },
  {
    id: 't6',
    nombre: 'Flujo de Caja',
    descripcion: 'Cash flow detallado con proyecciones y análisis de tendencias.',
    categoria: 'financiero',
    icono: 'trending',
    popular: true,
    campos: ['ingresos', 'gastos', 'neto', 'proyecciones'],
  },
  {
    id: 't7',
    nombre: 'Contratos Próximos a Vencer',
    descripcion: 'Listado de contratos con vencimiento en los próximos 90 días.',
    categoria: 'inquilinos',
    icono: 'calendar',
    popular: false,
    campos: ['contratos', 'vencimientos', 'renovaciones'],
  },
  {
    id: 't8',
    nombre: 'Análisis de Rentabilidad',
    descripcion: 'ROI y métricas de rentabilidad por propiedad.',
    categoria: 'financiero',
    icono: 'chart',
    popular: true,
    campos: ['propiedades', 'roi', 'cap_rate', 'comparativa'],
  },
];

const mockSavedReports: SavedReport[] = [
  {
    id: 'r1',
    nombre: 'Informe Mensual Enero 2026',
    template: 'Resumen Mensual de Ingresos',
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-01-15T10:30:00Z',
    ultimaGeneracion: '2026-01-20T08:00:00Z',
    formato: 'pdf',
    programado: true,
    frecuencia: 'mensual',
    estado: 'activo',
  },
  {
    id: 'r2',
    nombre: 'Ocupación Semanal',
    template: 'Estado de Ocupación',
    createdAt: '2026-01-10T14:20:00Z',
    updatedAt: '2026-01-18T09:15:00Z',
    ultimaGeneracion: '2026-01-20T07:00:00Z',
    formato: 'excel',
    programado: true,
    frecuencia: 'semanal',
    estado: 'activo',
  },
  {
    id: 'r3',
    nombre: 'Análisis Q1 2026',
    template: 'Análisis de Rentabilidad',
    createdAt: '2026-01-05T11:00:00Z',
    updatedAt: '2026-01-05T11:00:00Z',
    ultimaGeneracion: null,
    formato: 'ambos',
    programado: false,
    estado: 'borrador',
  },
];

const mockHistory: ReportHistory[] = [
  { id: 'h1', reporteId: 'r1', nombreReporte: 'Informe Mensual Enero 2026', generadoEl: '2026-01-20T08:00:00Z', formato: 'pdf', tamaño: '2.4 MB', descargado: true },
  { id: 'h2', reporteId: 'r2', nombreReporte: 'Ocupación Semanal', generadoEl: '2026-01-20T07:00:00Z', formato: 'excel', tamaño: '856 KB', descargado: false },
  { id: 'h3', reporteId: 'r1', nombreReporte: 'Informe Mensual Diciembre 2025', generadoEl: '2025-12-20T08:00:00Z', formato: 'pdf', tamaño: '2.1 MB', descargado: true },
  { id: 'h4', reporteId: 'r2', nombreReporte: 'Ocupación Semanal', generadoEl: '2026-01-13T07:00:00Z', formato: 'excel', tamaño: '812 KB', descargado: true },
];

const CATEGORIA_ICONS: Record<string, any> = {
  financiero: Euro,
  operacional: Settings,
  inquilinos: Users,
  propiedades: Building2,
  custom: Sparkles,
};

const CATEGORIA_COLORS: Record<string, string> = {
  financiero: 'bg-green-100 text-green-700',
  operacional: 'bg-blue-100 text-blue-700',
  inquilinos: 'bg-purple-100 text-purple-700',
  propiedades: 'bg-orange-100 text-orange-700',
  custom: 'bg-pink-100 text-pink-700',
};

export default function InformesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plantillas');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  
  // Data states
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Form state for new report
  const [newReport, setNewReport] = useState({
    nombre: '',
    templateId: '',
    formato: 'pdf',
    programado: false,
    frecuencia: 'mensual',
    fechaInicio: format(new Date(), 'yyyy-MM-dd'),
    fechaFin: format(new Date(), 'yyyy-MM-dd'),
    propiedades: [] as string[],
    incluirGraficos: true,
    enviarEmail: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTemplates(mockTemplates);
      setSavedReports(mockSavedReports);
      setHistory(mockHistory);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setNewReport(prev => ({
      ...prev,
      templateId: template.id,
      nombre: `${template.nombre} - ${format(new Date(), 'MMM yyyy', { locale: es })}`,
    }));
    setCreateDialogOpen(true);
  };

  const handleGenerateReport = async (formato: 'pdf' | 'excel') => {
    if (!selectedTemplate) return;
    
    try {
      setGeneratingReport(true);
      toast.info(`Generando ${formato.toUpperCase()}...`);
      
      // Simular generación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock: agregar a historial
      const newHistoryItem: ReportHistory = {
        id: `h${Date.now()}`,
        reporteId: `r${Date.now()}`,
        nombreReporte: newReport.nombre || selectedTemplate.nombre,
        generadoEl: new Date().toISOString(),
        formato,
        tamaño: formato === 'pdf' ? '1.8 MB' : '524 KB',
        descargado: false,
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      
      toast.success(`Informe ${formato.toUpperCase()} generado correctamente`);
      setCreateDialogOpen(false);
      setSelectedTemplate(null);
      setActiveTab('historial');
      
    } catch (error) {
      toast.error('Error al generar el informe');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSaveReport = async () => {
    if (!selectedTemplate || !newReport.nombre) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      // Mock: agregar a lista de guardados
      const newSavedReport: SavedReport = {
        id: `r${Date.now()}`,
        nombre: newReport.nombre,
        template: selectedTemplate.nombre,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ultimaGeneracion: null,
        formato: newReport.formato as 'pdf' | 'excel' | 'ambos',
        programado: newReport.programado,
        frecuencia: newReport.frecuencia as 'diario' | 'semanal' | 'mensual',
        estado: newReport.programado ? 'activo' : 'borrador',
      };
      
      setSavedReports(prev => [newSavedReport, ...prev]);
      toast.success('Informe guardado correctamente');
      setCreateDialogOpen(false);
      setSelectedTemplate(null);
      setActiveTab('mis-informes');
      
    } catch (error) {
      toast.error('Error al guardar el informe');
    }
  };

  const handleDownloadFromHistory = (item: ReportHistory) => {
    toast.info(`Descargando ${item.nombreReporte}.${item.formato}...`);
    // Simular descarga
    setTimeout(() => {
      toast.success('Archivo descargado');
      setHistory(prev => prev.map(h => h.id === item.id ? { ...h, descargado: true } : h));
    }, 1000);
  };

  const handleDeleteReport = (reportId: string) => {
    setSavedReports(prev => prev.filter(r => r.id !== reportId));
    toast.success('Informe eliminado');
  };

  const handleToggleProgramado = (reportId: string) => {
    setSavedReports(prev => prev.map(r => {
      if (r.id === reportId) {
        const newEstado = r.estado === 'activo' ? 'pausado' : 'activo';
        toast.success(newEstado === 'activo' ? 'Programación activada' : 'Programación pausada');
        return { ...r, estado: newEstado };
      }
      return r;
    }));
  };

  // Filtrar templates
  const filteredTemplates = templates.filter(t => {
    if (filterCategoria !== 'all' && t.categoria !== filterCategoria) return false;
    if (searchTerm) {
      return t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
             t.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const popularTemplates = templates.filter(t => t.popular);

  // Loading
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Centro de Informes
          </h1>
          <p className="text-muted-foreground mt-1">
            Genera y programa informes personalizados
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Informe
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedReports.length}</p>
                <p className="text-xs text-muted-foreground">Informes Guardados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedReports.filter(r => r.programado && r.estado === 'activo').length}</p>
                <p className="text-xs text-muted-foreground">Programados Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{history.length}</p>
                <p className="text-xs text-muted-foreground">Generados Este Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <FolderOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-xs text-muted-foreground">Plantillas Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plantillas">
            <FolderOpen className="h-4 w-4 mr-2" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="mis-informes">
            <FileText className="h-4 w-4 mr-2" />
            Mis Informes
          </TabsTrigger>
          <TabsTrigger value="historial">
            <History className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab: Plantillas */}
        <TabsContent value="plantillas">
          {/* Populares */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Plantillas Populares
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {popularTemplates.map((template) => {
                const Icon = CATEGORIA_ICONS[template.categoria] || FileText;
                return (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("p-2 rounded-lg", CATEGORIA_COLORS[template.categoria])}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                          <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                          Popular
                        </Badge>
                      </div>
                      <h4 className="font-semibold mb-1">{template.nombre}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.descripcion}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Todas las plantillas */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold">Todas las Plantillas</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar plantillas..."
                    className="pl-9 w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="financiero">Financiero</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="inquilinos">Inquilinos</SelectItem>
                    <SelectItem value="propiedades">Propiedades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => {
                const Icon = CATEGORIA_ICONS[template.categoria] || FileText;
                return (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("p-2 rounded-lg", CATEGORIA_COLORS[template.categoria])}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {template.categoria}
                        </Badge>
                      </div>
                      <h4 className="font-semibold mb-1">{template.nombre}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {template.descripcion}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.campos.slice(0, 3).map((campo, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {campo}
                          </Badge>
                        ))}
                        {template.campos.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.campos.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No se encontraron plantillas</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Mis Informes */}
        <TabsContent value="mis-informes">
          <Card>
            <CardHeader>
              <CardTitle>Mis Informes Guardados</CardTitle>
              <CardDescription>
                Gestiona tus informes personalizados y programados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">No tienes informes guardados</p>
                  <Button onClick={() => setActiveTab('plantillas')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Informe
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Plantilla</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead>Programación</TableHead>
                      <TableHead>Última Generación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.nombre}</TableCell>
                        <TableCell>{report.template}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(report.formato === 'pdf' || report.formato === 'ambos') && (
                              <Badge variant="outline" className="text-red-600">PDF</Badge>
                            )}
                            {(report.formato === 'excel' || report.formato === 'ambos') && (
                              <Badge variant="outline" className="text-green-600">Excel</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.programado ? (
                            <Badge className="bg-blue-100 text-blue-700">
                              <Clock className="h-3 w-3 mr-1" />
                              {report.frecuencia}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.ultimaGeneracion ? (
                            format(parseISO(report.ultimaGeneracion), "d MMM yyyy HH:mm", { locale: es })
                          ) : (
                            <span className="text-muted-foreground">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            report.estado === 'activo' ? 'bg-green-100 text-green-700' :
                            report.estado === 'pausado' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          )}>
                            {report.estado === 'activo' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                             report.estado === 'pausado' ? <Pause className="h-3 w-3 mr-1" /> :
                             <Edit className="h-3 w-3 mr-1" />}
                            {report.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Play className="h-4 w-4 mr-2" />
                                Generar Ahora
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {report.programado && (
                                <DropdownMenuItem onClick={() => handleToggleProgramado(report.id)}>
                                  {report.estado === 'activo' ? (
                                    <>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pausar
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-2" />
                                      Activar
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Generación</CardTitle>
              <CardDescription>
                Informes generados recientemente disponibles para descarga
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No hay informes generados todavía</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Informe</TableHead>
                      <TableHead>Generado</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nombreReporte}</TableCell>
                        <TableCell>
                          {format(parseISO(item.generadoEl), "d MMM yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            item.formato === 'pdf' ? 'text-red-600' : 'text-green-600'
                          )}>
                            {item.formato === 'pdf' ? (
                              <FilePdf className="h-3 w-3 mr-1" />
                            ) : (
                              <FileSpreadsheet className="h-3 w-3 mr-1" />
                            )}
                            {item.formato.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.tamaño}</TableCell>
                        <TableCell>
                          {item.descargado ? (
                            <Badge variant="secondary">Descargado</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700">Nuevo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDownloadFromHistory(item)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Crear/Generar Informe */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedTemplate ? selectedTemplate.nombre : 'Nuevo Informe'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.descripcion || 'Selecciona una plantilla para comenzar'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label>Nombre del Informe</Label>
              <Input
                placeholder="Ej: Informe Mensual Enero 2026"
                value={newReport.nombre}
                onChange={(e) => setNewReport({ ...newReport, nombre: e.target.value })}
              />
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={newReport.fechaInicio}
                  onChange={(e) => setNewReport({ ...newReport, fechaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={newReport.fechaFin}
                  onChange={(e) => setNewReport({ ...newReport, fechaFin: e.target.value })}
                />
              </div>
            </div>

            {/* Opciones */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="graficos"
                  checked={newReport.incluirGraficos}
                  onCheckedChange={(checked) => setNewReport({ ...newReport, incluirGraficos: checked as boolean })}
                />
                <Label htmlFor="graficos" className="text-sm font-normal">
                  Incluir gráficos y visualizaciones
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="programado"
                  checked={newReport.programado}
                  onCheckedChange={(checked) => setNewReport({ ...newReport, programado: checked as boolean })}
                />
                <Label htmlFor="programado" className="text-sm font-normal">
                  Programar generación automática
                </Label>
              </div>

              {newReport.programado && (
                <div className="ml-6 space-y-2">
                  <Label>Frecuencia</Label>
                  <Select
                    value={newReport.frecuencia}
                    onValueChange={(value) => setNewReport({ ...newReport, frecuencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diario</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={newReport.enviarEmail}
                  onCheckedChange={(checked) => setNewReport({ ...newReport, enviarEmail: checked as boolean })}
                />
                <Label htmlFor="email" className="text-sm font-normal">
                  Enviar por email al generar
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setSelectedTemplate(null); }}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleSaveReport}>
              Guardar Configuración
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => handleGenerateReport('excel')}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
              <Button 
                onClick={() => handleGenerateReport('pdf')}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FilePdf className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
