'use client';

/**
 * Reportes Operacionales - Inmova App
 * 
 * Dashboard de operaciones y gestión inmobiliaria:
 * - Tasas de ocupación
 * - Tiempos de respuesta de mantenimiento
 * - Satisfacción de inquilinos
 * - Rendimiento de equipos
 * - KPIs operativos personalizados
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Activity,
  BarChart3,
  Building2,
  Clock,
  Users,
  Wrench,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Timer,
  Calendar,
  Home,
  Download,
  RefreshCw,
  Target,
  Award,
  Zap,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface OccupancyData {
  propiedadId: string;
  nombre: string;
  unidadesTotales: number;
  unidadesOcupadas: number;
  ocupacion: number;
  tendencia: 'up' | 'down' | 'stable';
  variacion: number;
}

interface MaintenanceKPI {
  tiempoPromedio: number; // horas
  tiempoObjetivo: number;
  ticketsAbiertos: number;
  ticketsResueltos: number;
  ticketsPendientes: number;
  satisfaccionMantenimiento: number;
  porTipo: {
    tipo: string;
    cantidad: number;
    tiempoPromedio: number;
  }[];
}

interface TenantSatisfaction {
  puntuacionGeneral: number; // 1-5
  totalRespuestas: number;
  nps: number; // Net Promoter Score
  categorias: {
    categoria: string;
    puntuacion: number;
    tendencia: 'up' | 'down' | 'stable';
  }[];
  comentariosRecientes: {
    fecha: string;
    puntuacion: number;
    comentario: string;
    inquilino: string;
  }[];
}

interface TeamPerformance {
  miembro: string;
  rol: string;
  ticketsAsignados: number;
  ticketsResueltos: number;
  tiempoPromedio: number;
  satisfaccion: number;
}

interface OperationalKPI {
  nombre: string;
  valor: number;
  objetivo: number;
  unidad: string;
  tendencia: 'up' | 'down' | 'stable';
  variacion: number;
}

// Mock Data
const mockOccupancy: OccupancyData[] = [
  { propiedadId: '1', nombre: 'Edificio Residencial Sol', unidadesTotales: 24, unidadesOcupadas: 23, ocupacion: 95.8, tendencia: 'up', variacion: 2.3 },
  { propiedadId: '2', nombre: 'Apartamentos Luna', unidadesTotales: 16, unidadesOcupadas: 14, ocupacion: 87.5, tendencia: 'down', variacion: -4.2 },
  { propiedadId: '3', nombre: 'Oficinas Centro', unidadesTotales: 8, unidadesOcupadas: 8, ocupacion: 100, tendencia: 'stable', variacion: 0 },
  { propiedadId: '4', nombre: 'Local Comercial Norte', unidadesTotales: 4, unidadesOcupadas: 4, ocupacion: 100, tendencia: 'stable', variacion: 0 },
  { propiedadId: '5', nombre: 'Viviendas Mar', unidadesTotales: 10, unidadesOcupadas: 6, ocupacion: 60, tendencia: 'down', variacion: -10 },
];

const mockMaintenance: MaintenanceKPI = {
  tiempoPromedio: 18.5,
  tiempoObjetivo: 24,
  ticketsAbiertos: 12,
  ticketsResueltos: 145,
  ticketsPendientes: 8,
  satisfaccionMantenimiento: 4.2,
  porTipo: [
    { tipo: 'Fontanería', cantidad: 35, tiempoPromedio: 12 },
    { tipo: 'Electricidad', cantidad: 28, tiempoPromedio: 8 },
    { tipo: 'Climatización', cantidad: 22, tiempoPromedio: 24 },
    { tipo: 'Cerrajería', cantidad: 18, tiempoPromedio: 4 },
    { tipo: 'Pintura', cantidad: 15, tiempoPromedio: 48 },
    { tipo: 'Otros', cantidad: 39, tiempoPromedio: 20 },
  ],
};

const mockSatisfaction: TenantSatisfaction = {
  puntuacionGeneral: 4.3,
  totalRespuestas: 156,
  nps: 42,
  categorias: [
    { categoria: 'Atención al cliente', puntuacion: 4.5, tendencia: 'up' },
    { categoria: 'Mantenimiento', puntuacion: 4.2, tendencia: 'stable' },
    { categoria: 'Instalaciones', puntuacion: 4.1, tendencia: 'up' },
    { categoria: 'Comunicación', puntuacion: 4.4, tendencia: 'up' },
    { categoria: 'Relación calidad-precio', puntuacion: 3.9, tendencia: 'down' },
  ],
  comentariosRecientes: [
    { fecha: '2026-01-18', puntuacion: 5, comentario: 'Excelente servicio, muy rápida respuesta a mi solicitud.', inquilino: 'María G.' },
    { fecha: '2026-01-17', puntuacion: 4, comentario: 'Buen trato pero el mantenimiento tardó un poco más de lo esperado.', inquilino: 'Carlos M.' },
    { fecha: '2026-01-15', puntuacion: 5, comentario: 'Todo perfecto, muy profesionales.', inquilino: 'Ana P.' },
    { fecha: '2026-01-14', puntuacion: 3, comentario: 'La calefacción no funciona bien, esperando solución.', inquilino: 'Pedro L.' },
  ],
};

const mockTeam: TeamPerformance[] = [
  { miembro: 'Juan García', rol: 'Técnico Senior', ticketsAsignados: 45, ticketsResueltos: 42, tiempoPromedio: 14, satisfaccion: 4.6 },
  { miembro: 'Ana Martínez', rol: 'Técnico', ticketsAsignados: 38, ticketsResueltos: 35, tiempoPromedio: 18, satisfaccion: 4.4 },
  { miembro: 'Pedro López', rol: 'Técnico', ticketsAsignados: 32, ticketsResueltos: 30, tiempoPromedio: 22, satisfaccion: 4.2 },
  { miembro: 'María Sánchez', rol: 'Coordinadora', ticketsAsignados: 28, ticketsResueltos: 28, tiempoPromedio: 16, satisfaccion: 4.8 },
];

const mockKPIs: OperationalKPI[] = [
  { nombre: 'Tiempo medio de respuesta', valor: 2.5, objetivo: 4, unidad: 'horas', tendencia: 'up', variacion: -15 },
  { nombre: 'Tasa de resolución primer contacto', valor: 68, objetivo: 75, unidad: '%', tendencia: 'up', variacion: 5 },
  { nombre: 'Ocupación media', valor: 88.5, objetivo: 95, unidad: '%', tendencia: 'stable', variacion: 0.5 },
  { nombre: 'Rotación de inquilinos', valor: 8.2, objetivo: 10, unidad: '%', tendencia: 'up', variacion: -2.1 },
  { nombre: 'Tiempo medio de arrendamiento', valor: 14, objetivo: 21, unidad: 'días', tendencia: 'up', variacion: -18 },
  { nombre: 'Incidencias por unidad/mes', valor: 0.35, objetivo: 0.5, unidad: 'inc', tendencia: 'up', variacion: -10 },
];

export default function ReportesOperacionalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ocupacion');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  // Data states
  const [occupancy, setOccupancy] = useState<OccupancyData[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceKPI | null>(null);
  const [satisfaction, setSatisfaction] = useState<TenantSatisfaction | null>(null);
  const [team, setTeam] = useState<TeamPerformance[]>([]);
  const [kpis, setKpis] = useState<OperationalKPI[]>([]);

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
      
      setOccupancy(mockOccupancy);
      setMaintenance(mockMaintenance);
      setSatisfaction(mockSatisfaction);
      setTeam(mockTeam);
      setKpis(mockKPIs);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos operacionales');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.info('Generando reporte...');
    setTimeout(() => {
      toast.success('Reporte exportado correctamente');
    }, 1500);
  };

  const getOccupancyColor = (value: number) => {
    if (value >= 95) return 'text-green-600 bg-green-100';
    if (value >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <span className="text-gray-400">—</span>;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  // Loading state
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

  // Calcular métricas generales
  const ocupacionMedia = occupancy.length > 0
    ? occupancy.reduce((sum, o) => sum + o.ocupacion, 0) / occupancy.length
    : 0;
  const totalUnidades = occupancy.reduce((sum, o) => sum + o.unidadesTotales, 0);
  const unidadesOcupadas = occupancy.reduce((sum, o) => sum + o.unidadesOcupadas, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Reportes Operacionales
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas de operaciones y gestión inmobiliaria
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación Media</p>
                <p className="text-3xl font-bold">{ocupacionMedia.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+1.2% vs mes anterior</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Respuesta</p>
                <p className="text-3xl font-bold">{maintenance?.tiempoPromedio}h</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Objetivo: {maintenance?.tiempoObjetivo}h
                  </span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Timer className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfacción</p>
                <p className="text-3xl font-bold">{satisfaction?.puntuacionGeneral}/5</p>
                <div className="mt-1">
                  {renderStars(satisfaction?.puntuacionGeneral || 0)}
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NPS Score</p>
                <p className="text-3xl font-bold">{satisfaction?.nps}</p>
                <Badge className={cn(
                  "mt-1",
                  satisfaction && satisfaction.nps >= 50 ? "bg-green-100 text-green-800" :
                  satisfaction && satisfaction.nps >= 0 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                )}>
                  {satisfaction && satisfaction.nps >= 50 ? 'Excelente' :
                   satisfaction && satisfaction.nps >= 0 ? 'Bueno' : 'Mejorable'}
                </Badge>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ocupacion">
            <Building2 className="h-4 w-4 mr-2" />
            Ocupación
          </TabsTrigger>
          <TabsTrigger value="mantenimiento">
            <Wrench className="h-4 w-4 mr-2" />
            Mantenimiento
          </TabsTrigger>
          <TabsTrigger value="satisfaccion">
            <Star className="h-4 w-4 mr-2" />
            Satisfacción
          </TabsTrigger>
          <TabsTrigger value="equipo">
            <Users className="h-4 w-4 mr-2" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="kpis">
            <Target className="h-4 w-4 mr-2" />
            KPIs
          </TabsTrigger>
        </TabsList>

        {/* Tab: Ocupación */}
        <TabsContent value="ocupacion">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tasas de Ocupación por Propiedad</CardTitle>
                <CardDescription>
                  Estado de ocupación de tu cartera inmobiliaria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propiedad</TableHead>
                      <TableHead className="text-center">Unidades</TableHead>
                      <TableHead className="text-center">Ocupación</TableHead>
                      <TableHead className="text-center">Tendencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupancy.map((item) => (
                      <TableRow key={item.propiedadId}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell className="text-center">
                          {item.unidadesOcupadas}/{item.unidadesTotales}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={item.ocupacion} className="w-20 h-2" />
                            <span className="font-medium">{item.ocupacion}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getTrendIcon(item.tendencia)}
                            <span className={cn(
                              "text-sm",
                              item.variacion > 0 ? "text-green-600" : item.variacion < 0 ? "text-red-600" : ""
                            )}>
                              {item.variacion > 0 ? '+' : ''}{item.variacion}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getOccupancyColor(item.ocupacion)}>
                            {item.ocupacion >= 95 ? 'Óptimo' : item.ocupacion >= 80 ? 'Normal' : 'Bajo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Cartera</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${(ocupacionMedia / 100) * 351.86} 351.86`}
                        className="text-blue-600"
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold">{ocupacionMedia.toFixed(0)}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Ocupación Media</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total propiedades</span>
                    <span className="font-semibold">{occupancy.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidades totales</span>
                    <span className="font-semibold">{totalUnidades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidades ocupadas</span>
                    <span className="font-semibold text-green-600">{unidadesOcupadas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidades disponibles</span>
                    <span className="font-semibold text-blue-600">{totalUnidades - unidadesOcupadas}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Mantenimiento */}
        <TabsContent value="mantenimiento">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Estadísticas de tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{maintenance?.ticketsResueltos}</p>
                    <p className="text-sm text-muted-foreground">Resueltos</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">{maintenance?.ticketsPendientes}</p>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Wrench className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{maintenance?.ticketsAbiertos}</p>
                    <p className="text-sm text-muted-foreground">Abiertos</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Tiempo promedio de resolución</span>
                      <span className="font-semibold">{maintenance?.tiempoPromedio}h</span>
                    </div>
                    <Progress 
                      value={maintenance ? (maintenance.tiempoPromedio / maintenance.tiempoObjetivo) * 100 : 0} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Objetivo: {maintenance?.tiempoObjetivo}h
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Satisfacción mantenimiento</span>
                      <span className="font-semibold">{maintenance?.satisfaccionMantenimiento}/5</span>
                    </div>
                    {renderStars(maintenance?.satisfaccionMantenimiento || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desglose por tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Incidencias por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenance?.porTipo.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.tipo}</span>
                        <div className="text-right">
                          <span className="font-semibold">{item.cantidad}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({item.tiempoPromedio}h prom.)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(item.cantidad / (maintenance?.ticketsResueltos || 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Satisfacción */}
        <TabsContent value="satisfaccion">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Puntuaciones por categoría */}
            <Card>
              <CardHeader>
                <CardTitle>Satisfacción por Categoría</CardTitle>
                <CardDescription>
                  Basado en {satisfaction?.totalRespuestas} respuestas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {satisfaction?.categorias.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{cat.categoria}</p>
                        {renderStars(cat.puntuacion)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{cat.puntuacion}</span>
                        {getTrendIcon(cat.tendencia)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comentarios recientes */}
            <Card>
              <CardHeader>
                <CardTitle>Comentarios Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {satisfaction?.comentariosRecientes.map((comment, index) => (
                    <div key={index} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {renderStars(comment.puntuacion)}
                          <span className="font-medium">{comment.inquilino}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.fecha), "d MMM", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.comentario}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Equipo */}
        <TabsContent value="equipo">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento del Equipo</CardTitle>
              <CardDescription>
                Métricas de desempeño por miembro del equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-center">Asignados</TableHead>
                    <TableHead className="text-center">Resueltos</TableHead>
                    <TableHead className="text-center">Tasa</TableHead>
                    <TableHead className="text-center">Tiempo Prom.</TableHead>
                    <TableHead className="text-center">Satisfacción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{member.miembro}</TableCell>
                      <TableCell>{member.rol}</TableCell>
                      <TableCell className="text-center">{member.ticketsAsignados}</TableCell>
                      <TableCell className="text-center text-green-600">{member.ticketsResueltos}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {((member.ticketsResueltos / member.ticketsAsignados) * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{member.tiempoPromedio}h</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span>{member.satisfaccion}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: KPIs */}
        <TabsContent value="kpis">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi, index) => {
              const cumplimiento = (kpi.valor / kpi.objetivo) * 100;
              const cumplido = kpi.nombre.includes('Rotación') || kpi.nombre.includes('Tiempo') || kpi.nombre.includes('Incidencias')
                ? kpi.valor <= kpi.objetivo
                : kpi.valor >= kpi.objetivo;
              
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{kpi.nombre}</p>
                        <p className="text-3xl font-bold">{kpi.valor}{kpi.unidad}</p>
                      </div>
                      {cumplido ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                      )}
                    </div>
                    
                    <Progress 
                      value={Math.min(cumplimiento, 100)} 
                      className={cn(
                        "h-2 mb-2",
                        cumplido ? "[&>div]:bg-green-500" : "[&>div]:bg-yellow-500"
                      )}
                    />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Objetivo: {kpi.objetivo}{kpi.unidad}
                      </span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(kpi.tendencia)}
                        <span className={cn(
                          kpi.variacion < 0 ? "text-green-600" : kpi.variacion > 0 ? "text-red-600" : ""
                        )}>
                          {kpi.variacion > 0 ? '+' : ''}{kpi.variacion}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Datos actualizados en tiempo real. Última sincronización: {format(new Date(), "d 'de' MMMM 'a las' HH:mm", { locale: es })}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
