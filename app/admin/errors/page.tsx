'use client';

/**
 * Admin: Error Dashboard
 * 
 * Panel para visualizar y gestionar errores capturados por el sistema.
 * Accesible solo para super_admin y administrador.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  Bug, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter,
  RefreshCw,
  Sparkles,
  XCircle,
  TrendingUp,
  Server,
  Monitor,
  Database,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// Tipos
interface TrackedError {
  id: string;
  timestamp: string;
  name: string;
  message: string;
  stack?: string;
  source: string;
  severity: string;
  status: string;
  url?: string;
  route?: string;
  component?: string;
  userId?: string;
  userEmail?: string;
  method?: string;
  environment: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  aiSuggestion?: string;
  resolution?: string;
}

interface ErrorStats {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  last24h: number;
  last7d: number;
}

// Helpers
const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  investigating: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  ignored: 'bg-gray-100 text-gray-800',
};

const sourceIcons: Record<string, any> = {
  frontend: Monitor,
  backend: Server,
  api: Zap,
  database: Database,
  external: TrendingUp,
  unknown: Bug,
};

export default function ErrorDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  // State
  const [errors, setErrors] = useState<TrackedError[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  
  // Modal de detalle
  const [selectedError, setSelectedError] = useState<TrackedError | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [resolution, setResolution] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Verificar permisos
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }
  }, [session, sessionStatus, router]);

  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      
      const [errorsRes, statsRes] = await Promise.all([
        fetch(`/api/errors?${params.toString()}`),
        fetch('/api/errors?stats=true'),
      ]);
      
      const errorsData = await errorsRes.json();
      const statsData = await statsRes.json();
      
      if (errorsData.success) setErrors(errorsData.data);
      if (statsData.success) setStats(statsData.data);
    } catch (error) {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [severityFilter, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Actualizar estado
  const handleUpdateStatus = async (errorId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/errors/${errorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          resolution: resolution || undefined 
        }),
      });
      
      if (res.ok) {
        toast.success('Estado actualizado');
        fetchData();
        setShowDetailModal(false);
        setResolution('');
      } else {
        toast.error('Error actualizando estado');
      }
    } catch {
      toast.error('Error actualizando estado');
    }
  };

  // Generar sugerencia de IA
  const handleGenerateAISuggestion = async (errorId: string) => {
    setGeneratingAI(true);
    try {
      const res = await fetch(`/api/errors/${errorId}/suggest`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (data.success && selectedError) {
        setSelectedError({
          ...selectedError,
          aiSuggestion: data.suggestion,
        });
        toast.success('Sugerencia generada');
        fetchData();
      } else {
        toast.error('Error generando sugerencia');
      }
    } catch {
      toast.error('Error generando sugerencia');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Ver detalle
  const handleViewDetail = (error: TrackedError) => {
    setSelectedError(error);
    setResolution(error.resolution || '');
    setShowDetailModal(true);
  };

  // Loading state
  if (loading || sessionStatus === 'loading') {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="w-6 h-6" />
            Panel de Errores
          </h1>
          <p className="text-muted-foreground">
            Monitoriza y gestiona los errores de la aplicación
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Errores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Últimas 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.last24h}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.bySeverity?.critical || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.byStatus?.new || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Medio</SelectItem>
                <SelectItem value="low">Bajo</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Nuevo</SelectItem>
                <SelectItem value="investigating">Investigando</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="ignored">Ignorado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="database">Base de datos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Errores */}
      <Card>
        <CardHeader>
          <CardTitle>Errores Recientes</CardTitle>
          <CardDescription>
            {errors.length} errores encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severidad</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Ocurrencias</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última vez</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error) => {
                const SourceIcon = sourceIcons[error.source] || Bug;
                const isExpanded = expandedRow === error.id;
                
                return (
                  <>
                    <TableRow 
                      key={error.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedRow(isExpanded ? null : error.id)}
                    >
                      <TableCell>
                        <Badge className={severityColors[error.severity]}>
                          {error.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="truncate font-mono text-sm">
                            {error.message.slice(0, 60)}
                            {error.message.length > 60 && '...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SourceIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{error.source}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {error.route || error.url?.split('?')[0] || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{error.occurrences}x</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[error.status]}>
                          {error.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(error.lastSeen).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(error);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            <div>
                              <strong className="text-sm">Mensaje completo:</strong>
                              <pre className="mt-1 p-2 bg-background rounded text-sm whitespace-pre-wrap">
                                {error.message}
                              </pre>
                            </div>
                            {error.stack && (
                              <div>
                                <strong className="text-sm">Stack trace:</strong>
                                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-40">
                                  {error.stack}
                                </pre>
                              </div>
                            )}
                            {error.userEmail && (
                              <div className="text-sm">
                                <strong>Usuario:</strong> {error.userEmail}
                              </div>
                            )}
                            {error.aiSuggestion && (
                              <div>
                                <strong className="text-sm flex items-center gap-1">
                                  <Sparkles className="w-4 h-4 text-purple-500" />
                                  Sugerencia IA:
                                </strong>
                                <div className="mt-1 p-3 bg-purple-50 dark:bg-purple-900/20 rounded text-sm whitespace-pre-wrap">
                                  {error.aiSuggestion}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              
              {errors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    No hay errores con los filtros seleccionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalle */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Detalle del Error
            </DialogTitle>
            <DialogDescription>
              ID: {selectedError?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-4">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Severidad</label>
                  <Badge className={severityColors[selectedError.severity]}>
                    {selectedError.severity}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Badge className={statusColors[selectedError.status]}>
                    {selectedError.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Origen</label>
                  <p className="text-sm">{selectedError.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Ocurrencias</label>
                  <p className="text-sm">{selectedError.occurrences}</p>
                </div>
              </div>
              
              {/* Mensaje */}
              <div>
                <label className="text-sm font-medium">Mensaje</label>
                <pre className="mt-1 p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                  {selectedError.message}
                </pre>
              </div>
              
              {/* Stack */}
              {selectedError.stack && (
                <div>
                  <label className="text-sm font-medium">Stack Trace</label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto max-h-40">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
              
              {/* Usuario */}
              {selectedError.userEmail && (
                <div>
                  <label className="text-sm font-medium">Usuario afectado</label>
                  <p className="text-sm">{selectedError.userEmail}</p>
                </div>
              )}
              
              {/* Sugerencia IA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Sugerencia de IA
                  </label>
                  {!selectedError.aiSuggestion && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleGenerateAISuggestion(selectedError.id)}
                      disabled={generatingAI}
                    >
                      {generatingAI ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generar sugerencia
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {selectedError.aiSuggestion ? (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded text-sm whitespace-pre-wrap">
                    {selectedError.aiSuggestion}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No hay sugerencia generada aún
                  </p>
                )}
              </div>
              
              {/* Resolución */}
              <div>
                <label className="text-sm font-medium">Resolución / Notas</label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe cómo se resolvió o qué acciones se tomaron..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleUpdateStatus(selectedError!.id, 'ignored')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Ignorar
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleUpdateStatus(selectedError!.id, 'investigating')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Investigando
            </Button>
            <Button 
              onClick={() => handleUpdateStatus(selectedError!.id, 'resolved')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar Resuelto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
