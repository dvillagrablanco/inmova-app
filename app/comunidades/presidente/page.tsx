'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Crown,
  Plus,
  ArrowLeft,
  MoreVertical,
  Eye,
  FileText,
  Calendar,
  Euro,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Vote,
  Gavel,
  Building2,
  TrendingUp,
  Bell,
  ClipboardList,
  Handshake,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ResumenComunidad {
  nombreComunidad: string;
  direccion: string;
  propietarios: number;
  viviendas: number;
  locales: number;
  garajes: number;
  trasteros: number;
  presupuestoAnual: number;
  saldoCuenta: number;
  fondoReserva: number;
  cuotasPendientes: number;
  morosidad: number;
}

interface TareaPendiente {
  id: string;
  titulo: string;
  tipo: 'acta' | 'votacion' | 'documento' | 'reunion' | 'incidencia';
  prioridad: 'alta' | 'media' | 'baja';
  fecha?: string;
  descripcion: string;
}

interface NotificacionPresidente {
  id: string;
  tipo: 'info' | 'warning' | 'urgent';
  mensaje: string;
  fecha: string;
  leida: boolean;
}

const tipoTareaConfig: Record<string, { color: string; icon: any }> = {
  acta: { color: 'bg-blue-100 text-blue-800', icon: FileText },
  votacion: { color: 'bg-purple-100 text-purple-800', icon: Vote },
  documento: { color: 'bg-gray-100 text-gray-800', icon: ClipboardList },
  reunion: { color: 'bg-green-100 text-green-800', icon: Calendar },
  incidencia: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const prioridadColors: Record<string, string> = {
  alta: 'bg-red-100 text-red-800',
  media: 'bg-amber-100 text-amber-800',
  baja: 'bg-green-100 text-green-800',
};

export default function PresidentePage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenComunidad | null>(null);
  const [tareasPendientes, setTareasPendientes] = useState<TareaPendiente[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionPresidente[]>([]);
  const [activeTab, setActiveTab] = useState('resumen');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/comunidades/presidente/dashboard');
      // const data = await response.json();
      // setResumen(data.resumen);
      // setTareasPendientes(data.tareas);
      // setNotificaciones(data.notificaciones);
      
      // Estado vacío inicial
      setResumen(null);
      setTareasPendientes([]);
      setNotificaciones([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Crown className="h-8 w-8 text-amber-600" />
                Portal del Presidente
              </h1>
              <p className="text-muted-foreground mt-1">
                Panel de control para el presidente de la comunidad
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </Button>
            <Button>
              <Gavel className="h-4 w-4 mr-2" />
              Convocar Junta
            </Button>
          </div>
        </div>

        {/* Mensaje de bienvenida si no hay datos */}
        {!resumen ? (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="text-center py-12">
              <Crown className="h-16 w-16 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Bienvenido al Portal del Presidente</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Este portal te permite gestionar tu comunidad de propietarios de forma eficiente.
                Vincula tu comunidad para acceder a todas las funcionalidades.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => router.push('/comunidades')}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Ir a Comunidades
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Resumen de la Comunidad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {resumen.nombreComunidad}
                </CardTitle>
                <CardDescription>{resumen.direccion}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Propietarios</p>
                    <p className="text-2xl font-bold">{resumen.propietarios}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Viviendas</p>
                    <p className="text-2xl font-bold">{resumen.viviendas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Locales</p>
                    <p className="text-2xl font-bold">{resumen.locales}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Garajes</p>
                    <p className="text-2xl font-bold">{resumen.garajes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPIs Financieros */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Presupuesto Anual</p>
                      <p className="text-xl font-bold">{resumen.presupuestoAnual.toLocaleString('es-ES')}€</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo en Cuenta</p>
                      <p className="text-xl font-bold text-green-600">{resumen.saldoCuenta.toLocaleString('es-ES')}€</p>
                    </div>
                    <Euro className="h-8 w-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Fondo de Reserva</p>
                      <p className="text-xl font-bold">{resumen.fondoReserva.toLocaleString('es-ES')}€</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-purple-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Morosidad</p>
                      <p className="text-xl font-bold text-red-600">{resumen.morosidad.toFixed(1)}%</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-600 opacity-20" />
                  </div>
                  <Progress value={100 - resumen.morosidad} className="h-1 mt-2" />
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Tabs de contenido */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="tareas">Tareas Pendientes</TabsTrigger>
            <TabsTrigger value="votaciones">Votaciones</TabsTrigger>
            <TabsTrigger value="comunicados">Comunicados</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Accesos Rápidos */}
              <Card>
                <CardHeader>
                  <CardTitle>Accesos Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto py-4 flex flex-col" onClick={() => router.push('/comunidades/cuotas')}>
                    <Euro className="h-6 w-6 mb-2 text-blue-600" />
                    <span>Cuotas</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col" onClick={() => router.push('/comunidades/actas')}>
                    <FileText className="h-6 w-6 mb-2 text-indigo-600" />
                    <span>Actas</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col" onClick={() => router.push('/comunidades/votaciones')}>
                    <Vote className="h-6 w-6 mb-2 text-purple-600" />
                    <span>Votaciones</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col" onClick={() => router.push('/comunidades/fondos')}>
                    <Handshake className="h-6 w-6 mb-2 text-green-600" />
                    <span>Fondos</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Notificaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Notificaciones</span>
                    <Badge variant="outline">{notificaciones.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notificaciones.length === 0 ? (
                    <div className="text-center py-6">
                      <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No hay notificaciones nuevas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notificaciones.slice(0, 5).map((notif) => (
                        <div key={notif.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notif.tipo === 'urgent' ? 'bg-red-500' :
                            notif.tipo === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <p className="text-sm">{notif.mensaje}</p>
                            <p className="text-xs text-muted-foreground">{notif.fecha}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tareas" className="space-y-4">
            {tareasPendientes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">¡Todo al día!</h3>
                  <p className="text-muted-foreground">
                    No tienes tareas pendientes
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tareasPendientes.map((tarea) => {
                  const config = tipoTareaConfig[tarea.tipo];
                  const IconComponent = config.icon;
                  
                  return (
                    <Card key={tarea.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{tarea.titulo}</h3>
                              <Badge className={prioridadColors[tarea.prioridad]}>
                                {tarea.prioridad}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{tarea.descripcion}</p>
                            {tarea.fecha && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {tarea.fecha}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Resolver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="votaciones" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Votaciones Activas</h3>
                <p className="text-muted-foreground mb-4">
                  No hay votaciones activas en este momento
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Votación
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comunicados" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comunicados</h3>
                <p className="text-muted-foreground mb-4">
                  Envía comunicados a todos los propietarios
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Comunicado
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
