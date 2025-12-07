"use client";

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mail,
  Bell,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '@/lib/logger';

interface NotificationLog {
  id: string;
  tipo: string;
  canal: string;
  destinatario: string;
  asunto?: string;
  mensaje: string;
  estado: string;
  intentos: number;
  errorMsg?: string;
  leida: boolean;
  enviadoEn: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  rule?: {
    id: string;
    nombre: string;
  };
  template?: {
    id: string;
    nombre: string;
  };
}

interface ChannelStats {
  canal: string;
  total: number;
  enviado: number;
  fallido: number;
  leido: number;
}

const ESTADOS = [
  { value: 'all', label: 'Todos' },
  { value: 'enviado', label: 'Enviado', color: 'bg-green-500' },
  { value: 'fallido', label: 'Fallido', color: 'bg-red-500' },
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-500' },
  { value: 'leido', label: 'Leído', color: 'bg-blue-500' },
];

const CANALES = [
  { value: 'all', label: 'Todos', icon: Activity },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'push', label: 'Push', icon: Bell },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
];

export default function NotificationHistoryPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<ChannelStats[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    canal: 'all',
    estado: 'all',
    search: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchLogs();
      fetchStats();
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLogs();
    }
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (filters.canal !== 'all') params.set('canal', filters.canal);
      if (filters.estado !== 'all') params.set('estado', filters.estado);

      const response = await fetch(`/api/notification-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      logger.error('Error fetching logs:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notification-logs?action=stats', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      logger.error('Error fetching stats:', error);
    }
  };

  const getEstadoColor = (estado: string) => {
    return ESTADOS.find((e) => e.value === estado)?.color || 'bg-gray-500';
  };

  const getCanalIcon = (canal: string) => {
    const Icon = CANALES.find((c) => c.value === canal)?.icon || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const calculateSuccessRate = (stat: ChannelStats) => {
    return stat.total > 0 ? ((stat.enviado / stat.total) * 100).toFixed(1) : '0';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Skeleton className="h-10 w-96" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold">Historial de Notificaciones</h1>
        <p className="text-muted-foreground mt-2">
          Revisa todas las notificaciones enviadas y su estado
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.canal}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium capitalize">
                  {stat.canal}
                </CardTitle>
                {getCanalIcon(stat.canal)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stat.total}</div>
                  <div className="text-sm text-muted-foreground">notificaciones</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-green-600">
                    {calculateSuccessRate(stat)}%
                  </div>
                  <div className="text-xs text-muted-foreground">éxito</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <CheckCircle className="w-3 h-3 text-green-500 inline mr-1" />
                    {stat.enviado}
                  </div>
                  <div>
                    <XCircle className="w-3 h-3 text-red-500 inline mr-1" />
                    {stat.fallido}
                  </div>
                  <div>
                    <Bell className="w-3 h-3 text-blue-500 inline mr-1" />
                    {stat.leido}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por destinatario..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.canal}
              onValueChange={(value) => setFilters({ ...filters, canal: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                {CANALES.map((canal) => (
                  <SelectItem key={canal.value} value={canal.value}>
                    {canal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.estado}
              onValueChange={(value) => setFilters({ ...filters, estado: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
              <p className="text-muted-foreground">
                Aún no se han enviado notificaciones con estos filtros
              </p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Icono del Canal */}
                  <div className="p-2 bg-muted rounded-lg">
                    {getCanalIcon(log.canal)}
                  </div>

                  {/* Contenido Principal */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {log.asunto && (
                            <h4 className="font-semibold">{log.asunto}</h4>
                          )}
                          <Badge className={getEstadoColor(log.estado)}>
                            {ESTADOS.find((e) => e.value === log.estado)?.label}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {log.canal}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.mensaje.length > 150
                            ? log.mensaje.substring(0, 150) + '...'
                            : log.mensaje}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(log.enviadoEn).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {log.user && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Usuario:</span>
                          <span className="font-medium">{log.user.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Destinatario:</span>
                        <span className="font-medium">{log.destinatario}</span>
                      </div>
                      {log.rule && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Regla:</span>
                          <span className="font-medium">{log.rule.nombre}</span>
                        </div>
                      )}
                      {log.template && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Plantilla:</span>
                          <span className="font-medium">{log.template.nombre}</span>
                        </div>
                      )}
                    </div>

                    {log.errorMsg && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-xs text-red-700">
                          <XCircle className="w-3 h-3 inline mr-1" />
                          Error: {log.errorMsg}
                        </p>
                      </div>
                    )}

                    {log.intentos > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {log.intentos} intentos de envío
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} notificaciones
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
