'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface ConstructionProject {
  id: string;
  name: string;
  address: string;
  type: string;
  budget: number;
  spent: number;
  status: string;
  startDate: string;
  estimatedEndDate: string;
  progress: number;
  units: number;
  contractor: string;
}

export default function ConstructionPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
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
      const res = await fetch('/api/construction/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        toast.error('Error al cargar proyectos de construcción');
      }
    } catch (error) {
      logger.error('Error loading construction projects:', error);
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'planning': 'bg-blue-500',
      'in_progress': 'bg-yellow-500',
      'on_hold': 'bg-orange-500',
      'completed': 'bg-green-500',
      'delayed': 'bg-red-500',
    };
    return colors[status.toLowerCase()] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'planning': 'Planificación',
      'in_progress': 'En Progreso',
      'on_hold': 'Pausado',
      'completed': 'Completado',
      'delayed': 'Retrasado',
    };
    return labels[status.toLowerCase()] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      'planning': Clock,
      'in_progress': Building2,
      'on_hold': AlertCircle,
      'completed': CheckCircle,
      'delayed': AlertCircle,
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

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalUnits = projects.reduce((sum, p) => sum + p.units, 0);
  const averageProgress = projects.length > 0 
    ? (projects.reduce((sum, p) => sum + p.progress, 0) / projects.length).toFixed(1)
    : '0.0';

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando proyectos de construcción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Construcción y Desarrollo</h1>
          <p className="text-muted-foreground">Gestiona tus proyectos de construcción inmobiliaria</p>
        </div>
        <Button onClick={() => router.push('/construction/projects?new=true')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.filter(p => p.status === 'in_progress').length} en progreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalSpent)} ejecutado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">Unidades en desarrollo</p>
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
          <TabsTrigger value="planning">Planificación</TabsTrigger>
          <TabsTrigger value="in_progress">En Progreso</TabsTrigger>
          <TabsTrigger value="on_hold">Pausados</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="delayed">Retrasados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? 'Comienza tu primer proyecto de construcción'
                    : `No hay proyectos en estado "${getStatusLabel(activeTab)}"`
                  }
                </p>
                <Button onClick={() => router.push('/construction/projects?new=true')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Proyecto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const budgetUsed = (project.spent / project.budget * 100).toFixed(1);
                
                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {project.address}
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
                          <span className="text-muted-foreground">Gastado:</span>
                          <span className={`font-medium ${
                            parseFloat(budgetUsed) > 100 ? 'text-red-600' : ''
                          }`}>
                            {formatCurrency(project.spent)} ({budgetUsed}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Unidades:</span>
                          <span className="font-medium">{project.units}</span>
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
                            <span>Fin: {format(new Date(project.estimatedEndDate), 'dd MMM yyyy', { locale: es })}</span>
                          </div>
                        </div>
                        {project.contractor && (
                          <div className="text-xs text-muted-foreground">
                            Contratista: {project.contractor}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => router.push(`/construction/projects/${project.id}`)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Ver Detalles
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/construction/projects/${project.id}/edit`)}
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
