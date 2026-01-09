'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Store,
  Warehouse,
  Laptop,
  FileText,
  Users,
  TrendingUp,
  Euro,
  Calendar,
  MapPin,
  ChevronRight,
  Plus,
  Search,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Datos de ejemplo para el dashboard
const mockStats = {
  totalEspacios: 47,
  espaciosOcupados: 38,
  espaciosDisponibles: 9,
  tasaOcupacion: 80.9,
  ingresosRecurrentes: 127850,
  ingresosPendientes: 12450,
  contratosPorVencer: 5,
  visitasProgramadas: 8,
};

const mockSpaceTypes = [
  { id: 'oficinas', name: 'Oficinas', icon: Building2, count: 22, occupied: 19, color: 'bg-blue-500' },
  { id: 'locales', name: 'Locales', icon: Store, count: 15, occupied: 12, color: 'bg-green-500' },
  { id: 'naves', name: 'Naves Industriales', icon: Warehouse, count: 6, occupied: 4, color: 'bg-amber-500' },
  { id: 'coworking', name: 'Coworking', icon: Laptop, count: 4, occupied: 3, color: 'bg-purple-500' },
];

const mockRecentActivity = [
  { id: 1, type: 'contrato', text: 'Nuevo contrato firmado - Oficina 3A', date: 'Hace 2 horas', status: 'success' },
  { id: 2, type: 'pago', text: 'Pago recibido - Local 12B', date: 'Hace 5 horas', status: 'success' },
  { id: 3, type: 'visita', text: 'Visita programada - Nave Industrial 2', date: 'Mañana 10:00', status: 'pending' },
  { id: 4, type: 'alerta', text: 'Contrato por vencer - Oficina 7B', date: 'En 30 días', status: 'warning' },
  { id: 5, type: 'lead', text: 'Nueva consulta - Tech Solutions SL', date: 'Hace 1 día', status: 'info' },
];

const mockUpcomingExpirations = [
  { id: 1, space: 'Oficina 7B', tenant: 'Marketing Pro SL', date: '15/02/2026', daysLeft: 37 },
  { id: 2, space: 'Local 5A', tenant: 'Café Central', date: '28/02/2026', daysLeft: 50 },
  { id: 3, space: 'Oficina 12C', tenant: 'Consultores Asociados', date: '15/03/2026', daysLeft: 65 },
];

export default function ComercialDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const ocupacionColor = mockStats.tasaOcupacion >= 80 
    ? 'text-green-600' 
    : mockStats.tasaOcupacion >= 60 
    ? 'text-amber-600' 
    : 'text-red-600';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Alquiler Comercial
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión integral de oficinas, locales, naves industriales y espacios coworking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/comercial/leads">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </Link>
          </Button>
          <Button asChild>
            <Link href="/comercial/espacios/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Espacio
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacios Totales</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalEspacios}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.espaciosOcupados} ocupados · {mockStats.espaciosDisponibles} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ocupacionColor}`}>
              {mockStats.tasaOcupacion}%
            </div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +2.3% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Recurrentes</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStats.ingresosRecurrentes.toLocaleString('es-ES')}€
            </div>
            <p className="text-xs text-muted-foreground">
              {mockStats.ingresosPendientes.toLocaleString('es-ES')}€ pendientes de cobro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Acciones</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.contratosPorVencer + mockStats.visitasProgramadas}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.contratosPorVencer} renovaciones · {mockStats.visitasProgramadas} visitas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de espacio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockSpaceTypes.map((type) => {
          const Icon = type.icon;
          const ocupacion = Math.round((type.occupied / type.count) * 100);
          return (
            <Link key={type.id} href={`/comercial/${type.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${type.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{type.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{type.count} espacios</span>
                        <Badge variant={ocupacion >= 80 ? 'default' : ocupacion >= 60 ? 'secondary' : 'destructive'}>
                          {ocupacion}% ocupado
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad reciente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos en tu cartera comercial</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                    activity.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.type === 'contrato' && <FileText className="h-4 w-4" />}
                    {activity.type === 'pago' && <Euro className="h-4 w-4" />}
                    {activity.type === 'visita' && <Calendar className="h-4 w-4" />}
                    {activity.type === 'alerta' && <AlertCircle className="h-4 w-4" />}
                    {activity.type === 'lead' && <Users className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contratos por vencer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Próximos Vencimientos
            </CardTitle>
            <CardDescription>Contratos que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUpcomingExpirations.map((item) => (
                <div key={item.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{item.space}</h4>
                    <Badge variant={item.daysLeft <= 30 ? 'destructive' : item.daysLeft <= 60 ? 'secondary' : 'outline'}>
                      {item.daysLeft} días
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{item.tenant}</p>
                  <p className="text-xs text-gray-400">Vence: {item.date}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/comercial/contratos?filter=por_vencer">
                Ver todos los vencimientos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
          <CardDescription>Gestiona tu cartera comercial de forma eficiente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/comercial/espacios">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <Building2 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <span className="text-sm font-medium">Todos los Espacios</span>
              </div>
            </Link>
            <Link href="/comercial/contratos">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <span className="text-sm font-medium">Contratos</span>
              </div>
            </Link>
            <Link href="/comercial/pagos">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <Euro className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                <span className="text-sm font-medium">Pagos</span>
              </div>
            </Link>
            <Link href="/comercial/leads">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <span className="text-sm font-medium">Leads</span>
              </div>
            </Link>
            <Link href="/comercial/visitas">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <Calendar className="h-8 w-8 mx-auto text-indigo-600 mb-2" />
                <span className="text-sm font-medium">Visitas</span>
              </div>
            </Link>
            <Link href="/comercial/analytics">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <BarChart3 className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <span className="text-sm font-medium">Analíticas</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
