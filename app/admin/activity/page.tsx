'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, Clock, User, Building2, RefreshCw, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';


interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  changes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  company: {
    id: string;
    nombre: string;
  };
}

interface TimelineData {
  activities: ActivityItem[];
  groupedByDate: Record<string, ActivityItem[]>;
  actionStats: Record<string, number>;
  total: number;
}

export default function ActivityTimelinePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'all') {
        params.set('action', actionFilter);
      }
      params.set('limit', '100');

      const response = await fetch(`/api/admin/activity-timeline?${params}`);
      if (!response.ok) throw new Error('Error al cargar timeline');
      const data = await response.json();
      setTimeline(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar el timeline de actividad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        fetchTimeline();
      }
    }
  }, [status, session, router, actionFilter]);

  const filteredActivities =
    timeline?.activities.filter((activity) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        activity.company.nombre.toLowerCase().includes(searchLower) ||
        activity.user.name?.toLowerCase().includes(searchLower) ||
        activity.user.email.toLowerCase().includes(searchLower) ||
        activity.entityType.toLowerCase().includes(searchLower) ||
        activity.entityName?.toLowerCase().includes(searchLower)
      );
    }) || [];

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando actividad...</p>
        </div>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No se pudo cargar la actividad del sistema
                    </p>
                    <Button variant="outline" className="mt-4" onClick={fetchTimeline}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reintentar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN: 'bg-gray-100 text-gray-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
    EXPORT: 'bg-purple-100 text-purple-800',
    IMPORT: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold gradient-text flex items-center">
                  <Activity className="h-8 w-8 mr-3" />
                  Timeline de Actividad
                </h1>
                <p className="text-gray-600 mt-1">Historial completo de acciones en el sistema</p>
              </div>
              <Button onClick={fetchTimeline} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>

            {/* Estadísticas de Acciones */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              {Object.entries(timeline.actionStats).map(([action, count]) => (
                <Card key={action} className="text-center">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-gray-600">{action}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filtros */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por empresa, usuario o entidad..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las acciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las acciones</SelectItem>
                      {Object.keys(timeline.actionStats).map((action) => (
                        <SelectItem key={action} value={action}>
                          {action} ({timeline.actionStats[action]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    {filteredActivities.length} de {timeline.total} registros
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <div className="space-y-6">
              {filteredActivities.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay actividad registrada</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Las acciones del sistema se registrarán aquí automáticamente
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(timeline.groupedByDate)
                  .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                  .map(([date, activities]) => {
                    const dateActivities = activities.filter((activity) =>
                      filteredActivities.some((fa) => fa.id === activity.id)
                    );

                    if (dateActivities.length === 0) return null;

                    return (
                      <div key={date}>
                        <div className="flex items-center mb-4">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <h3 className="text-lg font-semibold text-gray-700">
                            {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", {
                              locale: es,
                            })}
                          </h3>
                          <Badge variant="secondary" className="ml-3">
                            {dateActivities.length} eventos
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {dateActivities.map((activity) => (
                            <Card
                              key={activity.id}
                              className="border-l-4 border-l-indigo-600 hover:shadow-md transition-shadow"
                            >
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Badge
                                        className={
                                          actionColors[activity.action] ||
                                          'bg-gray-100 text-gray-800'
                                        }
                                      >
                                        {activity.action}
                                      </Badge>
                                      <Badge variant="outline">{activity.entityType}</Badge>
                                      {activity.entityName && (
                                        <span className="text-sm font-medium text-gray-700">
                                          {activity.entityName}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <div className="flex items-center">
                                        <User className="h-4 w-4 mr-1" />
                                        {activity.user.name || activity.user.email}
                                      </div>
                                      <div className="flex items-center">
                                        <Building2 className="h-4 w-4 mr-1" />
                                        {activity.company.nombre}
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {format(new Date(activity.createdAt), 'HH:mm:ss')}
                                      </div>
                                    </div>

                                    {activity.changes && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono overflow-x-auto">
                                        <pre className="whitespace-pre-wrap">
                                          {(() => {
                                            try {
                                              const parsed = typeof activity.changes === 'string' 
                                                ? JSON.parse(activity.changes) 
                                                : activity.changes;
                                              return JSON.stringify(parsed, null, 2);
                                            } catch (error) {
                                              return activity.changes;
                                            }
                                          })()}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
