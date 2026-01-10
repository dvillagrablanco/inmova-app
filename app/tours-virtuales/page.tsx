'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Camera,
  Video,
  Maximize,
  Users,
  TrendingUp,
  Download,
  Share2,
  Play,
  Sparkles,
  Home,
  Plus,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';

interface VirtualTour {
  id: string;
  propertyId: string;
  propertyName: string;
  type: '360' | 'video' | 'ar' | 'vr';
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  views: number;
  avgDuration: number; // segundos
  conversionRate: number; // %
  thumbnail: string;
  url: string;
  features: string[];
}

interface Analytics {
  totalViews: number;
  avgEngagement: number; // %
  totalConversions: number;
  avgConversionRate: number; // %
  viewsBySource: Array<{ source: string; views: number }>;
  viewsOverTime: Array<{ date: string; views: number }>;
  topProperties: Array<{ name: string; views: number; conversions: number }>;
}

export default function ToursVirtualesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<VirtualTour[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos reales desde la API
      const response = await fetch('/api/virtual-tours');
      
      if (!response.ok) {
        throw new Error('Error al cargar tours');
      }
      
      const data = await response.json();
      
      // Si hay tours reales, usarlos
      if (data.tours && data.tours.length > 0) {
        setTours(data.tours);
        setAnalytics(data.analytics);
      } else {
        // Si no hay tours, mostrar estado vacío
        setTours([]);
        setAnalytics({
          totalViews: 0,
          avgEngagement: 0,
          totalConversions: 0,
          avgConversionRate: 0,
          viewsBySource: [],
          viewsOverTime: [],
          topProperties: [],
        });
      }
    } catch (error) {
      console.error('Error loading tours:', error);
      toast.error('Error al cargar tours virtuales');
      // Estado vacío en caso de error
      setTours([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const getTourTypeBadge = (type: string) => {
    const config = {
      '360': { label: 'Tour 360°', color: 'bg-blue-500' },
      'video': { label: 'Video Tour', color: 'bg-purple-500' },
      'ar': { label: 'AR Realidad Aumentada', color: 'bg-green-500' },
      'vr': { label: 'VR Immersive', color: 'bg-red-500' },
    };
    const { label, color } = config[type as keyof typeof config] || config['360'];
    return <Badge className={color}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { label: 'Borrador', color: 'bg-gray-500' },
      published: { label: 'Publicado', color: 'bg-green-500' },
      archived: { label: 'Archivado', color: 'bg-orange-500' },
    };
    const { label, color } = config[status as keyof typeof config] || config.draft;
    return <Badge className={color}>{label}</Badge>;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTours = selectedType === 'all' 
    ? tours 
    : tours.filter(t => t.type === selectedType);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando tours virtuales...</p>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Tours Virtuales AR/VR
                </h1>
                <p className="text-muted-foreground mt-2">
                  Tours 360°, realidad aumentada y virtual para tus propiedades
                </p>
              </div>
              <Button onClick={() => router.push('/tours-virtuales/nuevo')}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Tour
              </Button>
            </div>

            {/* Analytics */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Visualizaciones Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">+24% vs mes anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Engagement Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics.avgEngagement}%</div>
                    <p className="text-xs text-muted-foreground mt-2">Tiempo en tour</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Conversiones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{analytics.totalConversions}</div>
                    <p className="text-xs text-muted-foreground mt-2">Solicitudes de visita</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{analytics.avgConversionRate}%</div>
                    <p className="text-xs text-muted-foreground mt-2">Promedio general</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Tabs defaultValue="tours" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tours">Mis Tours</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="staging">Home Staging IA</TabsTrigger>
              </TabsList>

              <TabsContent value="tours" className="space-y-4">
                {/* Filter */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <Button
                        variant={selectedType === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedType('all')}
                      >
                        Todos
                      </Button>
                      <Button
                        variant={selectedType === '360' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedType('360')}
                      >
                        <Camera className="h-3 w-3 mr-1" />
                        Tour 360°
                      </Button>
                      <Button
                        variant={selectedType === 'vr' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedType('vr')}
                      >
                        <Maximize className="h-3 w-3 mr-1" />
                        VR Immersive
                      </Button>
                      <Button
                        variant={selectedType === 'ar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedType('ar')}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AR
                      </Button>
                      <Button
                        variant={selectedType === 'video' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedType('video')}
                      >
                        <Video className="h-3 w-3 mr-1" />
                        Video
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Tours Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTours.map((tour) => (
                    <Card key={tour.id} className="hover:shadow-lg transition-shadow group">
                      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera className="h-16 w-16 text-purple-300" />
                        </div>
                        <div className="absolute top-2 left-2">
                          {getTourTypeBadge(tour.type)}
                        </div>
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(tour.status)}
                        </div>
                        {tour.status === 'published' && (
                          <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1 bg-white/90 hover:bg-white"
                              onClick={() => window.open(tour.url, '_blank')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Ver Tour
                            </Button>
                          </div>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="text-lg">{tour.propertyName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Home className="h-3 w-3" />
                          {tour.features.join(' • ')}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {tour.status === 'published' && (
                          <>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">Vistas</p>
                                <p className="text-lg font-bold">{tour.views.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Duración</p>
                                <p className="text-lg font-bold">{formatDuration(tour.avgDuration)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Conversión</p>
                                <p className="text-lg font-bold text-green-600">{tour.conversionRate}%</p>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => navigator.clipboard.writeText(tour.url)}
                              >
                                <Share2 className="h-3 w-3 mr-1" />
                                Compartir
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => router.push(`/tours-virtuales/${tour.id}/analytics`)}
                              >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Analytics
                              </Button>
                            </div>
                          </>
                        )}

                        {tour.status === 'draft' && (
                          <Button
                            className="w-full"
                            onClick={() => router.push(`/tours-virtuales/${tour.id}/edit`)}
                          >
                            Continuar Editando
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                {analytics && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Evolución de Visualizaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.viewsOverTime}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="views"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                name="Visualizaciones"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Visualizaciones por Fuente</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.viewsBySource}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="source" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="views" fill="#EC4899" name="Vistas" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Top Propiedades por Rendimiento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analytics.topProperties.map((property, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold">{property.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {property.views.toLocaleString()} vistas • {property.conversions} conversiones
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">
                                  {((property.conversions / property.views) * 100).toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground">Conversión</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="staging" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Home Staging Virtual con IA
                    </CardTitle>
                    <CardDescription>
                      Transforma tus propiedades vacías con muebles virtuales realistas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Sparkles className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
                      <p className="text-muted-foreground mb-6">
                        Home staging virtual automático con inteligencia artificial
                      </p>
                      <Button disabled>
                        Acceso Anticipado
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}
