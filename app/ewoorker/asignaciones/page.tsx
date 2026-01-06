'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  Users,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  MapPin,
  HardHat,
  ArrowRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// Mock data para asignaciones
const mockAsignaciones = [
  {
    id: '1',
    trabajador: {
      id: 'w1',
      nombre: 'Carlos García',
      especialidad: 'Electricista',
      avatar: null,
      rating: 4.8,
    },
    obra: {
      id: 'o1',
      nombre: 'Reforma Oficinas Gran Vía',
      empresa: 'Constructora Madrid S.L.',
      direccion: 'Gran Vía 45, Madrid',
    },
    fechaInicio: new Date(Date.now() - 5 * 86400000),
    fechaFin: new Date(Date.now() + 10 * 86400000),
    estado: 'activa',
    tarifaDiaria: 180,
    diasTrabajados: 5,
    diasTotales: 15,
  },
  {
    id: '2',
    trabajador: {
      id: 'w2',
      nombre: 'María López',
      especialidad: 'Fontanera',
      avatar: null,
      rating: 4.9,
    },
    obra: {
      id: 'o2',
      nombre: 'Residencial Las Torres',
      empresa: 'Inmobiliaria Norte',
      direccion: 'Av. de la Castellana 200, Madrid',
    },
    fechaInicio: new Date(Date.now() - 2 * 86400000),
    fechaFin: new Date(Date.now() + 8 * 86400000),
    estado: 'activa',
    tarifaDiaria: 165,
    diasTrabajados: 2,
    diasTotales: 10,
  },
  {
    id: '3',
    trabajador: {
      id: 'w3',
      nombre: 'Pedro Martínez',
      especialidad: 'Albañil',
      avatar: null,
      rating: 4.5,
    },
    obra: {
      id: 'o1',
      nombre: 'Reforma Oficinas Gran Vía',
      empresa: 'Constructora Madrid S.L.',
      direccion: 'Gran Vía 45, Madrid',
    },
    fechaInicio: new Date(Date.now() - 15 * 86400000),
    fechaFin: new Date(Date.now() - 1 * 86400000),
    estado: 'completada',
    tarifaDiaria: 150,
    diasTrabajados: 14,
    diasTotales: 14,
  },
  {
    id: '4',
    trabajador: {
      id: 'w4',
      nombre: 'Ana Sánchez',
      especialidad: 'Pintora',
      avatar: null,
      rating: 4.7,
    },
    obra: {
      id: 'o3',
      nombre: 'Chalet Pozuelo',
      empresa: 'Reformas Premium',
      direccion: 'C/ del Bosque 12, Pozuelo',
    },
    fechaInicio: new Date(Date.now() + 3 * 86400000),
    fechaFin: new Date(Date.now() + 10 * 86400000),
    estado: 'pendiente',
    tarifaDiaria: 140,
    diasTrabajados: 0,
    diasTotales: 7,
  },
];

const estadoConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  activa: { label: 'Activa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completada: { label: 'Completada', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function EwoorkerAsignacionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/ewoorker/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  const stats = {
    totalAsignaciones: 24,
    activas: 8,
    completadas: 14,
    pendientes: 2,
    ingresosMes: 12500,
    tasaExito: 92,
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/ewoorker/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Asignaciones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Asignaciones de Trabajadores</h1>
            <p className="text-muted-foreground">
              Gestiona las asignaciones de trabajadores a obras
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Asignación
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Asignaciones</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAsignaciones}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-green-100 text-green-800">{stats.activas} activas</Badge>
                <Badge variant="outline">{stats.pendientes} pendientes</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasaExito}%</div>
              <Progress value={stats.tasaExito} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ingresosMes.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">comisiones generadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <Calendar className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completadas}</div>
              <p className="text-xs text-muted-foreground">este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Asignaciones List */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Asignaciones</CardTitle>
            <CardDescription>
              Todas las asignaciones de trabajadores a obras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="activa">Activas</TabsTrigger>
                <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                <TabsTrigger value="completada">Completadas</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <div className="space-y-4">
                  {mockAsignaciones
                    .filter((a) => activeTab === 'all' || a.estado === activeTab)
                    .map((asignacion) => {
                      const estadoInfo = estadoConfig[asignacion.estado as keyof typeof estadoConfig];
                      const EstadoIcon = estadoInfo.icon;
                      const progreso = Math.round(
                        (asignacion.diasTrabajados / asignacion.diasTotales) * 100
                      );

                      return (
                        <div
                          key={asignacion.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {/* Trabajador */}
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={asignacion.trabajador.avatar || undefined} />
                                <AvatarFallback className="bg-orange-100 text-orange-600">
                                  {asignacion.trabajador.nombre
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">{asignacion.trabajador.nombre}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  <HardHat className="h-3 w-3 mr-1" />
                                  {asignacion.trabajador.especialidad}
                                </Badge>
                              </div>
                            </div>

                            <ArrowRight className="h-5 w-5 text-muted-foreground" />

                            {/* Obra */}
                            <div>
                              <h3 className="font-medium">{asignacion.obra.nombre}</h3>
                              <p className="text-sm text-muted-foreground">
                                {asignacion.obra.empresa}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {asignacion.obra.direccion}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Progreso */}
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {asignacion.diasTrabajados}/{asignacion.diasTotales} días
                              </div>
                              <Progress value={progreso} className="w-24 mt-1" />
                            </div>

                            {/* Tarifa */}
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                {asignacion.tarifaDiaria}€
                                <span className="text-xs text-muted-foreground font-normal">
                                  /día
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total: {asignacion.tarifaDiaria * asignacion.diasTotales}€
                              </div>
                            </div>

                            {/* Estado */}
                            <Badge className={estadoInfo.color}>
                              <EstadoIcon className="h-3 w-3 mr-1" />
                              {estadoInfo.label}
                            </Badge>

                            <Button variant="outline" size="sm">
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
