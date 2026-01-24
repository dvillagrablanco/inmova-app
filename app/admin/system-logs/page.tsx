'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ScrollText,
  Search,
  RefreshCw,
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Download,
  Eye,
  Calendar,
  User,
  Server,
  Database,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  userId?: string;
  userName?: string;
  companyId?: string;
  companyName?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  debug: number;
  bySource: Record<string, number>;
  byHour: { hour: string; count: number }[];
}

const LOG_LEVELS = {
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 text-red-800' },
  warn: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100 text-yellow-800' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 text-blue-800' },
  debug: { icon: Bug, color: 'text-gray-500', bg: 'bg-gray-100 text-gray-800' },
};

const LOG_SOURCES = [
  { value: 'all', label: 'Todas las fuentes' },
  { value: 'api', label: 'API Requests' },
  { value: 'auth', label: 'Autenticación' },
  { value: 'database', label: 'Base de Datos' },
  { value: 'payment', label: 'Pagos' },
  { value: 'email', label: 'Emails' },
  { value: 'cron', label: 'Cron Jobs' },
  { value: 'webhook', label: 'Webhooks' },
  { value: 'integration', label: 'Integraciones' },
  { value: 'system', label: 'Sistema' },
];

// Estadísticas vacías por defecto (sin datos demo)
const EMPTY_STATS: LogStats = {
  total: 0,
  errors: 0,
  warnings: 0,
  info: 0,
  debug: 0,
  bySource: {},
  byHour: [],
};

export default function SystemLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
        toast.error('Solo Super Admin puede acceder a esta página');
        return;
      }
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar datos reales desde la API (sin datos demo)
      const queryParams = new URLSearchParams({
        level: levelFilter,
        source: sourceFilter,
        timeRange,
        page: page.toString(),
        limit: pageSize.toString(),
      });
      
      const response = await fetch(`/api/admin/system-logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar logs');
      }
      
      const data = await response.json();

      let filteredLogs = data.logs || [];

      // Aplicar filtro de búsqueda en cliente
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(
          (log: LogEntry) =>
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setLogs(filteredLogs);
      setStats(data.stats || EMPTY_STATS);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading logs:', error);
      // En caso de error, mostrar datos vacíos (no mock data)
      setLogs([]);
      setStats(EMPTY_STATS);
      toast.error('Error al cargar los logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'super_admin') {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, sourceFilter, timeRange, searchTerm, page]);

  const handleExportLogs = () => {
    // Crear CSV
    const csvContent = [
      ['Timestamp', 'Level', 'Source', 'Message', 'User', 'Company'].join(','),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.level,
          log.source,
          `"${log.message.replace(/"/g, '""')}"`,
          log.userName || '',
          log.companyName || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inmova-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Logs exportados correctamente');
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ScrollText className="h-8 w-8 text-indigo-600" />
              Logs del Sistema
            </h1>
            <p className="text-muted-foreground mt-1">
              Registro centralizado de eventos y errores de la plataforma
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refrescar
            </Button>
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Logs</p>
                    <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                  </div>
                  <ScrollText className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Errores</p>
                    <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Info</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.info.toLocaleString()}
                    </p>
                  </div>
                  <Info className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Debug</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {stats.debug.toLocaleString()}
                    </p>
                  </div>
                  <Bug className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar en logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Fuente" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Última hora</SelectItem>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Eventos</CardTitle>
            <CardDescription>{logs.length} logs encontrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Nivel</TableHead>
                  <TableHead className="w-[120px]">Fuente</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead className="w-[150px]">Usuario</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron logs con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const LevelIcon = LOG_LEVELS[log.level].icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge className={LOG_LEVELS[log.level].bg}>
                            <LevelIcon className="h-3 w-3 mr-1" />
                            {log.level.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.source}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{log.message}</TableCell>
                        <TableCell className="text-sm">{log.userName || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedLog && (
                  <Badge className={LOG_LEVELS[selectedLog.level].bg}>
                    {selectedLog.level.toUpperCase()}
                  </Badge>
                )}
                Detalle del Log
              </DialogTitle>
              <DialogDescription>
                {selectedLog &&
                  format(new Date(selectedLog.timestamp), "d 'de' MMMM, yyyy 'a las' HH:mm:ss", {
                    locale: es,
                  })}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fuente</label>
                    <p className="mt-1">{selectedLog.source}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID del Log</label>
                    <p className="mt-1 font-mono text-sm">{selectedLog.id}</p>
                  </div>
                  {selectedLog.userName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                      <p className="mt-1">{selectedLog.userName}</p>
                    </div>
                  )}
                  {selectedLog.companyName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                      <p className="mt-1">{selectedLog.companyName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mensaje</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedLog.message}</p>
                </div>

                {selectedLog.metadata && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                    <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.stackTrace && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Stack Trace</label>
                    <pre className="mt-1 p-3 bg-red-50 text-red-800 rounded-md text-xs overflow-x-auto">
                      {selectedLog.stackTrace}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
