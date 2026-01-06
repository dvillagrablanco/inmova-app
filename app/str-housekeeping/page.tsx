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
  Sparkles,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  MapPin,
  Plus,
  Filter,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

// Mock data para tareas de limpieza
const mockTasks = [
  {
    id: '1',
    property: 'Apartamento Centro Madrid',
    address: 'Calle Gran Vía 45, 2ºA',
    type: 'checkout',
    status: 'pending',
    scheduledDate: new Date(),
    assignedTo: 'María García',
    estimatedDuration: 2,
  },
  {
    id: '2',
    property: 'Piso Salamanca',
    address: 'Calle Serrano 120, 4ºB',
    type: 'checkin',
    status: 'in_progress',
    scheduledDate: new Date(),
    assignedTo: 'Juan López',
    estimatedDuration: 1.5,
  },
  {
    id: '3',
    property: 'Estudio Malasaña',
    address: 'Calle Fuencarral 78, 1º',
    type: 'deep_clean',
    status: 'completed',
    scheduledDate: new Date(Date.now() - 86400000),
    assignedTo: 'Ana Martínez',
    estimatedDuration: 3,
  },
];

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Sparkles },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const typeConfig = {
  checkout: { label: 'Check-out', color: 'bg-orange-100 text-orange-800' },
  checkin: { label: 'Check-in', color: 'bg-purple-100 text-purple-800' },
  deep_clean: { label: 'Limpieza Profunda', color: 'bg-indigo-100 text-indigo-800' },
  maintenance: { label: 'Mantenimiento', color: 'bg-gray-100 text-gray-800' },
};

export default function STRHousekeepingPage() {
  const [activeTab, setActiveTab] = useState('today');

  const stats = {
    pendingToday: 3,
    inProgress: 1,
    completedToday: 5,
    totalWeek: 24,
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
              <BreadcrumbLink href="/str">STR</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Housekeeping</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Limpieza</h1>
            <p className="text-muted-foreground">
              Gestiona las tareas de limpieza y housekeeping de tus propiedades STR
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendientes Hoy</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingToday}</div>
              <p className="text-xs text-muted-foreground">tareas por completar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">en este momento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">tareas finalizadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWeek}</div>
              <p className="text-xs text-muted-foreground">tareas programadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas de Limpieza</CardTitle>
            <CardDescription>
              Listado de todas las tareas de housekeeping programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="today">Hoy</TabsTrigger>
                <TabsTrigger value="week">Esta Semana</TabsTrigger>
                <TabsTrigger value="all">Todas</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <div className="space-y-4">
                  {mockTasks.map((task) => {
                    const statusInfo = statusConfig[task.status as keyof typeof statusConfig];
                    const typeInfo = typeConfig[task.type as keyof typeof typeConfig];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{task.property}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {task.address}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            {task.assignedTo}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {task.estimatedDuration}h estimadas
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
