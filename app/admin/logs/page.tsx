'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import toast from 'react-hot-toast';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  companyId?: string;
}

const LOG_LEVELS = [
  { value: 'all', label: 'Todos los niveles' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'debug', label: 'Debug' },
];

const LOG_SOURCES = [
  { value: 'all', label: 'Todas las fuentes' },
  { value: 'api', label: 'API' },
  { value: 'auth', label: 'Autenticación' },
  { value: 'payment', label: 'Pagos' },
  { value: 'email', label: 'Email' },
  { value: 'cron', label: 'Cron Jobs' },
];

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLogs();
  }, [levelFilter, sourceFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // En una implementación real, esto llamaría a una API
      // Por ahora, generamos logs de ejemplo
      const sampleLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          source: 'api',
          message: 'Usuario inició sesión correctamente',
          userId: 'user_123',
          details: { ip: '192.168.1.1', browser: 'Chrome' },
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          level: 'warn',
          source: 'payment',
          message: 'Intento de pago con tarjeta rechazada',
          companyId: 'company_456',
          details: { cardLast4: '4242', errorCode: 'card_declined' },
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          level: 'error',
          source: 'email',
          message: 'Error al enviar notificación por email',
          details: { recipient: 'user@example.com', error: 'SMTP connection failed' },
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          level: 'info',
          source: 'cron',
          message: 'Job de limpieza de sesiones completado',
          details: { sessionsDeleted: 145, duration: '2.3s' },
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          level: 'debug',
          source: 'api',
          message: 'Query de búsqueda ejecutada',
          details: { query: 'propiedades', results: 42, time: '0.15s' },
        },
      ];

      // Aplicar filtros
      let filteredLogs = sampleLogs;
      if (levelFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === levelFilter);
      }
      if (sourceFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.source === sourceFilter);
      }

      setLogs(filteredLogs);
    } catch (error) {
      toast.error('Error al cargar logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">INFO</Badge>;
      case 'warn':
        return <Badge className="bg-yellow-100 text-yellow-800">WARN</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">ERROR</Badge>;
      case 'debug':
        return <Badge variant="outline">DEBUG</Badge>;
      default:
        return <Badge variant="outline">{level.toUpperCase()}</Badge>;
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleExport = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Logs exportados');
  };

  const filteredBySearch = logs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logs del Sistema</h1>
            <p className="text-muted-foreground">
              Registro de eventos y actividad de la plataforma
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={loadLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
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
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {logs.filter(l => l.level === 'info').length}
                </span>
                <span className="text-muted-foreground">Info</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {logs.filter(l => l.level === 'warn').length}
                </span>
                <span className="text-muted-foreground">Warnings</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">
                  {logs.filter(l => l.level === 'error').length}
                </span>
                <span className="text-muted-foreground">Errores</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{logs.length}</span>
                <span className="text-muted-foreground">Total</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recientes</CardTitle>
            <CardDescription>
              Mostrando {filteredBySearch.length} de {logs.length} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando logs...
              </div>
            ) : filteredBySearch.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay logs</h3>
                <p className="text-muted-foreground">
                  No se encontraron logs que coincidan con los filtros
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBySearch.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {getLevelIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{log.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.source}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getLevelBadge(log.level)}
                        {expandedLogs.has(log.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    {expandedLogs.has(log.id) && log.details && (
                      <div className="px-4 pb-4 border-t bg-muted/30">
                        <pre className="text-sm overflow-x-auto p-3 mt-3 bg-black text-white rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                        {log.userId && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Usuario: {log.userId}
                          </p>
                        )}
                        {log.companyId && (
                          <p className="text-sm text-muted-foreground">
                            Empresa: {log.companyId}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
