'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Plus,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';


interface FlippingProject {
  id: string;
  name: string;
  address: string;
  purchasePrice: number;
  currentValue: number;
  investmentTotal: number;
  status: string;
  startDate: string;
  estimatedCompletionDate: string;
  progress: number;
}

export default function FlippingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<FlippingProject[]>([]);
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
      const res = await fetch('/api/flipping/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        toast.error('Error al cargar proyectos de flipping');
      }
    } catch (error) {
      logger.error('Error loading flipping projects:', error);
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      planning: 'bg-blue-500',
      renovation: 'bg-yellow-500',
      selling: 'bg-purple-500',
      completed: 'bg-gray-500',
    };
    return colors[status.toLowerCase()] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Activo',
      planning: 'Planificación',
      renovation: 'Renovación',
      selling: 'En Venta',
      completed: 'Completado',
    };
    return labels[status.toLowerCase()] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const calculateROI = (project: FlippingProject) => {
    const profit = project.currentValue - project.purchasePrice - project.investmentTotal;
    const totalInvested = project.purchasePrice + project.investmentTotal;
    return ((profit / totalInvested) * 100).toFixed(2);
  };

  const filteredProjects = projects.filter((project) => {
    if (activeTab === 'all') return true;
    return project.status.toLowerCase() === activeTab;
  });

  const totalInvestment = projects.reduce((sum, p) => sum + p.purchasePrice + p.investmentTotal, 0);
  const totalValue = projects.reduce((sum, p) => sum + p.currentValue, 0);
  const totalProfit = totalValue - totalInvestment;
  const averageROI =
    projects.length > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(2) : '0.00';

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando proyectos de flipping...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Flipping Inmobiliario</h1>
                <p className="text-muted-foreground">
                  Gestiona tus proyectos de compra, renovación y venta
                </p>
              </div>
              <Button onClick={() => router.push('/flipping/projects?new=true')}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {projects.filter((p) => p.status.toLowerCase() === 'active').length} en progreso
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inversión Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
                  <p className="text-xs text-muted-foreground">Capital comprometido</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Actual</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                  <p className="text-xs text-muted-foreground">Valoración estimada</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI Promedio</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageROI}%</div>
                  <p className="text-xs text-muted-foreground">
                    {totalProfit >= 0 ? '+' : ''}
                    {formatCurrency(totalProfit)} ganancia
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Projects Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="planning">Planificación</TabsTrigger>
                <TabsTrigger value="active">Activos</TabsTrigger>
                <TabsTrigger value="renovation">Renovación</TabsTrigger>
                <TabsTrigger value="selling">En Venta</TabsTrigger>
                <TabsTrigger value="completed">Completados</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-4">
                {filteredProjects.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Home className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {activeTab === 'all'
                          ? 'Comienza tu primer proyecto de flipping'
                          : `No hay proyectos en estado "${getStatusLabel(activeTab)}"`}
                      </p>
                      <Button onClick={() => router.push('/flipping/projects?new=true')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Proyecto
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{project.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Home className="h-3 w-3" />
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
                              <span className="text-muted-foreground">Precio Compra:</span>
                              <span className="font-medium">
                                {formatCurrency(project.purchasePrice)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Inversión:</span>
                              <span className="font-medium">
                                {formatCurrency(project.investmentTotal)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Valor Actual:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(project.currentValue)}
                              </span>
                            </div>
                            <div className="border-t pt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">ROI Esperado:</span>
                                <span
                                  className={`font-bold ${
                                    parseFloat(calculateROI(project)) >= 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {calculateROI(project)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Progreso: {project.progress}%
                              </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.push(`/flipping/projects/${project.id}`)}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Ver Detalles
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/flipping/projects/${project.id}/edit`)}
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
