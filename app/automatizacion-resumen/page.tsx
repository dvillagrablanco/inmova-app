'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bot,
  Zap,
  Sparkles,
  CheckCircle,
  BookOpen,
  FileText,
  MessageSquare,
  Workflow,
  BarChart3,
  HelpCircle,
  Lightbulb,
  Ticket,
  PlayCircle,
  ArrowRight,
  ArrowLeft,
  Settings,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Eye,
  History,
  Bell,
  Mail,
  Calendar,
  Users,
  Home,
  CreditCard,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Automatizacion {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'workflow' | 'notificacion' | 'integracion' | 'ia' | 'programada';
  estado: 'activo' | 'pausado' | 'error';
  trigger: string;
  acciones: string[];
  ejecuciones24h: number;
  ultimaEjecucion?: string;
  tasaExito: number;
}

interface Ejecucion {
  id: string;
  automatizacionId: string;
  automatizacionNombre: string;
  fecha: string;
  estado: 'completado' | 'error' | 'en_progreso';
  duracion: number; // en ms
  detalles?: string;
}

interface KPI {
  automatizacionesActivas: number;
  ejecucionesHoy: number;
  tasaExitoGlobal: number;
  tiempoAhorrado: number; // en horas
  ticketsResueltos: number;
  respuestasChatbot: number;
}

export default function AutomatizacionResumenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');

  const [automatizaciones, setAutomatizaciones] = useState<Automatizacion[]>([]);
  const [ejecuciones, setEjecuciones] = useState<Ejecucion[]>([]);
  const [kpis, setKpis] = useState<KPI>({
    automatizacionesActivas: 0,
    ejecucionesHoy: 0,
    tasaExitoGlobal: 0,
    tiempoAhorrado: 0,
    ticketsResueltos: 0,
    respuestasChatbot: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const [autoRes, ejecRes, kpiRes] = await Promise.all([
      //   fetch('/api/automations'),
      //   fetch('/api/automations/executions?limit=50'),
      //   fetch('/api/automations/kpis'),
      // ]);

      // Estado vacío inicial
      setAutomatizaciones([]);
      setEjecuciones([]);
      setKpis({
        automatizacionesActivas: 0,
        ejecucionesHoy: 0,
        tasaExitoGlobal: 0,
        tiempoAhorrado: 0,
        ticketsResueltos: 0,
        respuestasChatbot: 0,
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar automatizaciones');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomatizacion = async (id: string, nuevoEstado: boolean) => {
    try {
      // TODO: Integrar con API real
      toast.success(`Automatización ${nuevoEstado ? 'activada' : 'pausada'}`);
      loadData();
    } catch (error) {
      toast.error('Error al actualizar automatización');
    }
  };

  const ejecutarAutomatizacion = async (id: string) => {
    try {
      // TODO: Integrar con API real
      toast.success('Automatización ejecutada manualmente');
      loadData();
    } catch (error) {
      toast.error('Error al ejecutar automatización');
    }
  };

  const automationFeatures = [
    {
      id: 'chatbot',
      icon: Bot,
      title: 'Chatbot IA 24/7',
      description: 'Asistente inteligente con procesamiento de lenguaje natural',
      features: [
        'Respuestas automáticas basadas en base de conocimiento',
        'Análisis de sentimiento en tiempo real',
        'Sugerencias de acciones contextuales',
        'Detección de urgencia y escalamiento',
      ],
      location: 'Botón flotante en la esquina inferior derecha',
      color: 'blue',
      estado: 'activo',
    },
    {
      id: 'tickets',
      icon: Ticket,
      title: 'Sistema de Tickets Automatizado',
      description: 'Gestión inteligente de solicitudes de soporte',
      features: [
        'Categorización automática con IA',
        'Asignación de prioridad inteligente',
        'Resolución sin intervención humana (70% de casos)',
        'Escalamiento automático cuando necesario',
      ],
      location: 'Botón "Crear Ticket" en todas las páginas',
      color: 'purple',
      estado: 'activo',
    },
    {
      id: 'notificaciones',
      icon: Bell,
      title: 'Notificaciones Inteligentes',
      description: 'Sistema de alertas y recordatorios automatizados',
      features: [
        'Recordatorios de pagos vencidos',
        'Alertas de contratos por vencer',
        'Notificaciones de mantenimiento',
        'Avisos personalizados por rol',
      ],
      location: 'Configuración > Notificaciones',
      color: 'amber',
      estado: 'activo',
    },
    {
      id: 'workflows',
      icon: Workflow,
      title: 'Workflows Automatizados',
      description: 'Flujos de trabajo sin intervención manual',
      features: [
        'Onboarding automático de inquilinos',
        'Generación de contratos',
        'Facturación recurrente',
        'Reportes programados',
      ],
      location: 'Panel de Automatizaciones',
      color: 'green',
      estado: 'activo',
    },
    {
      id: 'integraciones',
      icon: Zap,
      title: 'Integraciones Activas',
      description: 'Conexiones con sistemas externos',
      features: [
        'Sincronización con portales inmobiliarios',
        'Pasarelas de pago (Stripe, Redsys)',
        'Email y SMS automatizados',
        'Calendarios externos',
      ],
      location: 'Configuración > Integraciones',
      color: 'cyan',
      estado: 'activo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-50 to-blue-100 border-blue-200',
      purple: 'from-purple-50 to-purple-100 border-purple-200',
      green: 'from-green-50 to-green-100 border-green-200',
      amber: 'from-amber-50 to-amber-100 border-amber-200',
      cyan: 'from-cyan-50 to-cyan-100 border-cyan-200',
    };
    return colors[color] || colors.blue;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      workflow: 'bg-green-100 text-green-800',
      notificacion: 'bg-blue-100 text-blue-800',
      integracion: 'bg-purple-100 text-purple-800',
      ia: 'bg-amber-100 text-amber-800',
      programada: 'bg-cyan-100 text-cyan-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando automatizaciones...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Zap className="h-8 w-8 text-amber-500" />
                Centro de Automatizaciones
              </h1>
              <p className="text-muted-foreground mt-1">
                Sistema de soporte y operaciones totalmente automatizado
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => router.push('/automatizacion')}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Activas</span>
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.automatizacionesActivas}</p>
              <p className="text-xs text-muted-foreground">automatizaciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ejecuciones Hoy</span>
                <PlayCircle className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.ejecucionesHoy}</p>
              <p className="text-xs text-muted-foreground">procesos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tasa de Éxito</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.tasaExitoGlobal}%</p>
              <p className="text-xs text-muted-foreground">promedio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tiempo Ahorrado</span>
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.tiempoAhorrado}h</p>
              <p className="text-xs text-muted-foreground">este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tickets Auto</span>
                <Ticket className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.ticketsResueltos}</p>
              <p className="text-xs text-muted-foreground">resueltos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Chatbot</span>
                <Bot className="h-4 w-4 text-cyan-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.respuestasChatbot}</p>
              <p className="text-xs text-muted-foreground">respuestas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="resumen">
              <BarChart3 className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="automatizaciones">
              <Workflow className="h-4 w-4 mr-2" />
              Automatizaciones
            </TabsTrigger>
            <TabsTrigger value="historial">
              <History className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="sistemas">
              <Settings className="h-4 w-4 mr-2" />
              Sistemas
            </TabsTrigger>
          </TabsList>

          {/* Resumen */}
          <TabsContent value="resumen" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                  <p className="text-sm text-green-700">Automatizado</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                  <p className="text-sm text-blue-700">Disponibilidad</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">70%</div>
                  <p className="text-sm text-purple-700">Auto-resolución</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-amber-600 mb-2">&lt;1s</div>
                  <p className="text-sm text-amber-700">Tiempo Respuesta</p>
                </CardContent>
              </Card>
            </div>

            {/* Sistemas Activos */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sistemas Automatizados Activos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automationFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={feature.id}
                      className={`border-2 bg-gradient-to-r ${getColorClasses(feature.color)}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{feature.title}</CardTitle>
                              <CardDescription>{feature.description}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {feature.features.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Beneficios */}
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Beneficios de la Automatización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Respuesta Instantánea</h4>
                      <p className="text-sm text-muted-foreground">
                        0 segundos de espera para los usuarios
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Disponibilidad Total</h4>
                      <p className="text-sm text-muted-foreground">
                        24/7/365 sin interrupciones
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Reducción de Costos</h4>
                      <p className="text-sm text-muted-foreground">
                        70% de tickets auto-resueltos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automatizaciones */}
          <TabsContent value="automatizaciones" className="space-y-4">
            {automatizaciones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay automatizaciones configuradas</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Crea automatizaciones personalizadas para optimizar tus procesos de gestión inmobiliaria.
                  </p>
                  <Button onClick={() => router.push('/automatizacion')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Automatizaciones
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Automatizaciones Configuradas</CardTitle>
                  <CardDescription>Gestiona tus flujos de trabajo automatizados</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead className="text-right">Ejecuciones 24h</TableHead>
                        <TableHead className="text-right">Tasa Éxito</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automatizaciones.map((auto) => (
                        <TableRow key={auto.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{auto.nombre}</p>
                              <p className="text-xs text-muted-foreground">{auto.descripcion}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTipoColor(auto.tipo)}>{auto.tipo}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{auto.trigger}</TableCell>
                          <TableCell className="text-right">{auto.ejecuciones24h}</TableCell>
                          <TableCell className="text-right">
                            <span className={auto.tasaExito >= 90 ? 'text-green-600' : auto.tasaExito >= 70 ? 'text-amber-600' : 'text-red-600'}>
                              {auto.tasaExito}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={auto.estado === 'activo'}
                              onCheckedChange={(checked) => toggleAutomatizacion(auto.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => ejecutarAutomatizacion(auto.id)}>
                              <Play className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Historial */}
          <TabsContent value="historial" className="space-y-4">
            {ejecuciones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin ejecuciones registradas</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    El historial de ejecuciones aparecerá aquí cuando las automatizaciones se ejecuten.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Ejecuciones</CardTitle>
                  <CardDescription>Últimas 50 ejecuciones de automatizaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Automatización</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ejecuciones.map((ejec) => (
                        <TableRow key={ejec.id}>
                          <TableCell className="font-medium">{ejec.automatizacionNombre}</TableCell>
                          <TableCell>{new Date(ejec.fecha).toLocaleString('es-ES')}</TableCell>
                          <TableCell>{ejec.duracion}ms</TableCell>
                          <TableCell>
                            <Badge variant={
                              ejec.estado === 'completado' ? 'default' :
                              ejec.estado === 'error' ? 'destructive' : 'secondary'
                            }>
                              {ejec.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {ejec.detalles || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sistemas */}
          <TabsContent value="sistemas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Bot, title: 'Chatbot IA', desc: 'Asistente virtual 24/7', status: 'activo', link: '/chat' },
                { icon: Ticket, title: 'Sistema de Tickets', desc: 'Gestión automática de soporte', status: 'activo', link: '/soporte' },
                { icon: Bell, title: 'Notificaciones', desc: 'Alertas y recordatorios', status: 'activo', link: '/configuracion/notificaciones' },
                { icon: Mail, title: 'Email Automatizado', desc: 'Comunicaciones programadas', status: 'activo', link: '/configuracion/email' },
                { icon: CreditCard, title: 'Cobros Automáticos', desc: 'Facturación recurrente', status: 'activo', link: '/pagos' },
                { icon: Calendar, title: 'Recordatorios', desc: 'Eventos y vencimientos', status: 'activo', link: '/calendario' },
                { icon: Users, title: 'Onboarding', desc: 'Alta automática de inquilinos', status: 'activo', link: '/inquilinos' },
                { icon: Home, title: 'Publicación', desc: 'Sync con portales', status: 'activo', link: '/sincronizacion' },
                { icon: Wrench, title: 'Mantenimiento', desc: 'Asignación automática', status: 'activo', link: '/mantenimiento' },
              ].map((sistema, index) => {
                const Icon = sistema.icon;
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          Activo
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{sistema.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{sistema.desc}</p>
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link href={sistema.link}>
                          <Settings className="h-3 w-3 mr-2" />
                          Configurar
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
