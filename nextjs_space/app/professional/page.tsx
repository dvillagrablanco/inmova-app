'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  DollarSign,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProfessionalProject {
  id: string;
  name: string;
  client: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  revenue: number;
  hoursEstimated: number;
  hoursSpent: number;
  teamMembers: number;
  progress: number;
}

export default function ProfessionalPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProfessionalProject[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user) {
      loadProjects();
    }
  }, [session, status, router]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/professional/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        toast.error('Error al cargar proyectos profesionales');
      }
    } catch (error) {
      console.error('Error loading professional projects:', error);
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-500',
      'pending': 'bg-yellow-500',
      'on_hold': 'bg-orange-500',
      'completed': 'bg-blue-500',
      'cancelled': 'bg-red-500',
    };
    return colors[status.toLowerCase()] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'Activo',
      'pending': 'Pendiente',
      'on_hold': 'Pausado',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
    };
    return labels[status.toLowerCase()] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      'active': CheckCircle,
      'pending': Clock,
      'on_hold': AlertCircle,
      'completed': CheckCircle,
      'cancelled': AlertCircle,
    };
    const Icon = icons[status.toLowerCase()] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const filteredProjects = projects.filter((project) => {
    if (activeTab === 'all') return true;
    return project.status.toLowerCase() === activeTab;
  });

  const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalHours = projects.reduce((sum, p) => sum + p.hoursSpent, 0);
  const averageProgress = projects.length > 0 
    ? (projects.reduce((sum, p) => sum + p.progress, 0) / projects.length).toFixed(1)
    : '0.0';

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando proyectos profesionales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Servicios Profesionales</h1>
          <p className="text-muted-foreground">Gestiona consultoras, asesorías y servicios profesionales</p>
        </div>
        <Button onClick={() => router.push('/professional/projects?new=true')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.filter(p => p.status === 'active').length} en progreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              de {formatCurrency(totalBudget)} presupuestado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Trabajadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">Horas facturadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress}%</div>
            <p className="text-xs text-muted-foreground">Avance general</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="on_hold">Pausados</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? 'Comienza tu primer proyecto profesional'
                    : `No hay proyectos en estado "${getStatusLabel(activeTab)}"`
                  }
                </p>
                <Button onClick={() => router.push('/professional/projects?new=true')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Proyecto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const hoursUsed = project.hoursEstimated > 0 
                  ? (project.hoursSpent / project.hoursEstimated * 100).toFixed(1)
                  : '0.0';
                const revenuePercentage = project.budget > 0
                  ? (project.revenue / project.budget * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {project.client}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="font-medium">{project.type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Presupuesto:</span>
                          <span className="font-medium">{formatCurrency(project.budget)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ingresos:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(project.revenue)} ({revenuePercentage}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Horas:</span>
                          <span className={`font-medium ${
                            parseFloat(hoursUsed) > 100 ? 'text-red-600' : ''
                          }`}>
                            {project.hoursSpent} / {project.hoursEstimated} ({hoursUsed}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Equipo:</span>
                          <span className="font-medium">{project.teamMembers} personas</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">Progreso:</span>
                            <span className="font-bold">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>Inicio: {format(new Date(project.startDate), 'dd MMM yyyy', { locale: es })}</span>
                            <span>Fin: {format(new Date(project.endDate), 'dd MMM yyyy', { locale: es })}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => router.push(`/professional/projects/${project.id}`)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Ver Detalles
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/professional/projects/${project.id}/edit`)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
