'use client';

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
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
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Plus,
  Filter,
  Calendar,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

// Mock data para órdenes de trabajo
const mockOrders = [
  {
    id: 'OT-001',
    title: 'Reparación fuga de agua',
    description: 'Fuga en tubería bajo fregadero de la cocina',
    property: 'Apartamento Centro Madrid',
    address: 'Calle Gran Vía 45, 2ºA',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'Pedro Fontanería S.L.',
    createdAt: new Date(Date.now() - 2 * 86400000),
    dueDate: new Date(Date.now() + 1 * 86400000),
    estimatedCost: 180,
    category: 'plumbing',
  },
  {
    id: 'OT-002',
    title: 'Revisión sistema eléctrico',
    description: 'Revisión anual del cuadro eléctrico y enchufes',
    property: 'Piso Salamanca',
    address: 'Calle Serrano 120, 4ºB',
    priority: 'medium',
    status: 'pending',
    assignedTo: 'Electricidad Martínez',
    createdAt: new Date(Date.now() - 1 * 86400000),
    dueDate: new Date(Date.now() + 5 * 86400000),
    estimatedCost: 120,
    category: 'electrical',
  },
  {
    id: 'OT-003',
    title: 'Pintura habitación principal',
    description: 'Repintar paredes y techo de la habitación principal',
    property: 'Estudio Malasaña',
    address: 'Calle Fuencarral 78, 1º',
    priority: 'low',
    status: 'completed',
    assignedTo: 'Pinturas López',
    createdAt: new Date(Date.now() - 10 * 86400000),
    dueDate: new Date(Date.now() - 3 * 86400000),
    estimatedCost: 350,
    actualCost: 320,
    category: 'painting',
  },
  {
    id: 'OT-004',
    title: 'Mantenimiento aire acondicionado',
    description: 'Limpieza y revisión del sistema de climatización',
    property: 'Loft Retiro',
    address: 'Calle Alcalá 200, Ático',
    priority: 'medium',
    status: 'scheduled',
    assignedTo: 'Clima Pro S.L.',
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 7 * 86400000),
    estimatedCost: 95,
    category: 'hvac',
  },
];

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  in_progress: { label: 'En Progreso', color: 'bg-indigo-100 text-indigo-800', icon: Wrench },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

const categoryConfig = {
  plumbing: { label: 'Fontanería', icon: '🔧' },
  electrical: { label: 'Electricidad', icon: '⚡' },
  painting: { label: 'Pintura', icon: '🎨' },
  hvac: { label: 'Climatización', icon: '❄️' },
  general: { label: 'General', icon: '🔨' },
};

export default function OrdenesTrabajoPage() {
  const [activeTab, setActiveTab] = useState('all');

  const stats = {
    total: 24,
    pending: 5,
    inProgress: 8,
    completed: 11,
    completionRate: 46,
    totalCost: 4250,
    averageTime: 3.2,
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Órdenes de Trabajo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
            <p className="text-muted-foreground">
              Gestiona las órdenes de mantenimiento y reparación
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{stats.pending} pendientes</Badge>
                <Badge variant="outline">{stats.inProgress} en progreso</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Coste Total</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCost.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageTime} días</div>
              <p className="text-xs text-muted-foreground">resolución</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Órdenes</CardTitle>
            <CardDescription>
              Todas las órdenes de trabajo activas y completadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                <TabsTrigger value="in_progress">En Progreso</TabsTrigger>
                <TabsTrigger value="completed">Completadas</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <div className="space-y-4">
                  {mockOrders
                    .filter((order) => activeTab === 'all' || order.status === activeTab)
                    .map((order) => {
                      const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
                      const priorityInfo = priorityConfig[order.priority as keyof typeof priorityConfig];
                      const categoryInfo = categoryConfig[order.category as keyof typeof categoryConfig];
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-100 rounded-lg text-2xl">
                              {categoryInfo?.icon || '🔧'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-muted-foreground">
                                  {order.id}
                                </span>
                                <h3 className="font-medium">{order.title}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {order.description}
                              </p>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                <MapPin className="h-3 w-3" />
                                {order.property} - {order.address}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                                <Badge className={priorityInfo.color}>
                                  {priorityInfo.label}
                                </Badge>
                                <Badge variant="outline">{categoryInfo?.label}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3" />
                              {order.assignedTo}
                            </div>
                            <div className="text-lg font-semibold mt-1">
                              {order.actualCost || order.estimatedCost}€
                              {!order.actualCost && (
                                <span className="text-xs text-muted-foreground ml-1">(est.)</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Vence:{' '}
                              {order.dueDate.toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </div>
                            <Button variant="outline" size="sm" className="mt-2">
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
    </AuthenticatedLayout>
  );
}
