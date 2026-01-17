'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  DollarSign,
  MapPin,
  GraduationCap,
  TrendingUp,
  Award,
  Target,
  Building2,
  Phone,
  Mail,
  Star,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Datos de ejemplo
const statsOverview = [
  { label: 'Total Agentes', value: '47', change: '+5 este mes', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Agentes Activos', value: '38', change: '81% del total', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Comisiones Mes', value: '€24.500', change: '+12% vs anterior', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Operaciones', value: '23', change: 'Este mes', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const topAgentes = [
  { id: 1, name: 'María García López', zona: 'Madrid Centro', operaciones: 8, comisiones: '€12.400', rating: 4.9, avatar: 'MG' },
  { id: 2, name: 'Carlos Rodríguez', zona: 'Barcelona Eixample', operaciones: 6, comisiones: '€9.200', rating: 4.8, avatar: 'CR' },
  { id: 3, name: 'Ana Martínez', zona: 'Valencia Centro', operaciones: 5, comisiones: '€7.800', rating: 4.7, avatar: 'AM' },
  { id: 4, name: 'Pedro Sánchez', zona: 'Sevilla', operaciones: 4, comisiones: '€5.600', rating: 4.6, avatar: 'PS' },
];

const zonasActivas = [
  { zona: 'Madrid', agentes: 15, operaciones: 12, comisionTotal: '€18.500' },
  { zona: 'Barcelona', agentes: 10, operaciones: 8, comisionTotal: '€12.200' },
  { zona: 'Valencia', agentes: 8, operaciones: 5, comisionTotal: '€7.800' },
  { zona: 'Sevilla', agentes: 6, operaciones: 4, comisionTotal: '€5.200' },
  { zona: 'Málaga', agentes: 5, operaciones: 3, comisionTotal: '€4.100' },
];

const actividadReciente = [
  { tipo: 'venta', agente: 'María García', propiedad: 'Piso en Salamanca', valor: '€450.000', fecha: 'Hace 2 horas' },
  { tipo: 'nuevo', agente: 'Luis Fernández', zona: 'Bilbao', fecha: 'Hace 5 horas' },
  { tipo: 'comision', agente: 'Carlos Rodríguez', monto: '€3.200', fecha: 'Ayer' },
  { tipo: 'formacion', agente: 'Ana Martínez', curso: 'Certificación Premium', fecha: 'Hace 2 días' },
];

const modulosRed = [
  {
    title: 'Dashboard de Rendimiento',
    description: 'Métricas en tiempo real de toda la red',
    icon: BarChart3,
    href: '/red-agentes/dashboard',
    color: 'from-blue-500 to-blue-600',
    stats: '12 KPIs activos'
  },
  {
    title: 'Gestión de Agentes',
    description: 'Directorio y administración de agentes',
    icon: Users,
    href: '/red-agentes/agentes',
    color: 'from-green-500 to-green-600',
    stats: '47 agentes'
  },
  {
    title: 'Sistema de Comisiones',
    description: 'Cálculo y pago de comisiones',
    icon: DollarSign,
    href: '/red-agentes/comisiones',
    color: 'from-amber-500 to-amber-600',
    stats: '€24.5K este mes'
  },
  {
    title: 'Zonas y Territorios',
    description: 'Asignación geográfica de agentes',
    icon: MapPin,
    href: '/red-agentes/zonas',
    color: 'from-purple-500 to-purple-600',
    stats: '12 zonas activas'
  },
  {
    title: 'Formación y Certificación',
    description: 'Cursos y capacitación para agentes',
    icon: GraduationCap,
    href: '/red-agentes/formacion',
    color: 'from-cyan-500 to-cyan-600',
    stats: '8 cursos disponibles'
  },
  {
    title: 'Registro de Agentes',
    description: 'Alta de nuevos agentes en la red',
    icon: UserPlus,
    href: '/red-agentes/registro',
    color: 'from-pink-500 to-pink-600',
    stats: '5 solicitudes pendientes'
  },
];

export default function RedAgentesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Red de Agentes</h1>
            <p className="text-muted-foreground">
              Gestiona tu red de agentes inmobiliarios y maximiza el rendimiento
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/red-agentes/registro')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Agente
            </Button>
            <Button onClick={() => router.push('/red-agentes/dashboard')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsOverview.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xs text-green-600">{stat.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Módulos de la Red */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Módulos de Gestión</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modulosRed.map((modulo, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                onClick={() => router.push(modulo.href)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${modulo.color} text-white`}>
                      <modulo.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{modulo.title}</h3>
                      <p className="text-sm text-muted-foreground">{modulo.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">{modulo.stats}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tabs de contenido */}
        <Tabs defaultValue="agentes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agentes">Top Agentes</TabsTrigger>
            <TabsTrigger value="zonas">Zonas Activas</TabsTrigger>
            <TabsTrigger value="actividad">Actividad Reciente</TabsTrigger>
          </TabsList>

          <TabsContent value="agentes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ranking de Agentes</CardTitle>
                    <CardDescription>Los agentes con mejor rendimiento este mes</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar agente..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAgentes.map((agente, index) => (
                    <div 
                      key={agente.id} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                      onClick={() => router.push(`/red-agentes/agentes/${agente.id}`)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {agente.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{agente.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {agente.zona}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{agente.operaciones}</p>
                        <p className="text-xs text-muted-foreground">Operaciones</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-green-600">{agente.comisiones}</p>
                        <p className="text-xs text-muted-foreground">Comisiones</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">{agente.rating}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => router.push('/red-agentes/agentes')}>
                    Ver todos los agentes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zonas">
            <Card>
              <CardHeader>
                <CardTitle>Zonas Geográficas</CardTitle>
                <CardDescription>Rendimiento por zona territorial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zonasActivas.map((zona, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">{zona.zona}</span>
                        </div>
                        <Badge variant="outline">{zona.agentes} agentes</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Operaciones</p>
                          <p className="font-semibold">{zona.operaciones}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Comisión Total</p>
                          <p className="font-semibold text-green-600">{zona.comisionTotal}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Productividad</p>
                          <Progress value={(zona.operaciones / zona.agentes) * 100} className="mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => router.push('/red-agentes/zonas')}>
                    Gestionar zonas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actividad">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimos movimientos en la red de agentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {actividadReciente.map((actividad, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className={`p-2 rounded-full ${
                        actividad.tipo === 'venta' ? 'bg-green-100 text-green-600' :
                        actividad.tipo === 'nuevo' ? 'bg-blue-100 text-blue-600' :
                        actividad.tipo === 'comision' ? 'bg-amber-100 text-amber-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {actividad.tipo === 'venta' && <Building2 className="h-4 w-4" />}
                        {actividad.tipo === 'nuevo' && <UserPlus className="h-4 w-4" />}
                        {actividad.tipo === 'comision' && <DollarSign className="h-4 w-4" />}
                        {actividad.tipo === 'formacion' && <GraduationCap className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {actividad.tipo === 'venta' && `${actividad.agente} cerró venta: ${actividad.propiedad}`}
                          {actividad.tipo === 'nuevo' && `Nuevo agente: ${actividad.agente} (${actividad.zona})`}
                          {actividad.tipo === 'comision' && `Comisión pagada a ${actividad.agente}: ${actividad.monto}`}
                          {actividad.tipo === 'formacion' && `${actividad.agente} completó: ${actividad.curso}`}
                        </p>
                        {actividad.valor && (
                          <p className="text-sm text-green-600 font-semibold">{actividad.valor}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {actividad.fecha}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">¿Quieres expandir tu red?</h3>
                <p className="text-blue-100">
                  Registra nuevos agentes y asigna zonas para maximizar la cobertura
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => router.push('/red-agentes/registro')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Registrar Agente
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20" onClick={() => router.push('/red-agentes/zonas')}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Gestionar Zonas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
