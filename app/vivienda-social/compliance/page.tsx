'use client';

/**
 * Vivienda Social - Cumplimiento Normativo
 * 
 * Control de cumplimiento de normativa de vivienda protegida
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Scale,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  Euro,
  Clock,
  Shield,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface ControlCumplimiento {
  id: string;
  tipo: string;
  descripcion: string;
  estado: 'cumple' | 'no_cumple' | 'revision' | 'pendiente';
  ultimaRevision: string;
  proximaRevision: string;
  detalles: string;
  afectados: number;
}

// Datos cargados desde API /api/vivienda-social/compliance

interface AlertaNormativa {
  id: string;
  tipo: 'critica' | 'aviso' | 'info';
  mensaje: string;
  fecha: string;
}

export default function ViviendaSocialCompliancePage() {
  const [controles, setControles] = useState<ControlCumplimiento[]>([]);
  const [alertas, setAlertas] = useState<AlertaNormativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<string>('all');

  // Cargar controles desde API
  const fetchControles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vivienda-social/compliance');
      if (response.ok) {
        const data = await response.json();
        setControles(data.data?.controles || data.data || []);
        setAlertas(data.data?.alertas || []);
      }
    } catch (error) {
      console.error('Error fetching compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControles();
  }, []);

  const filteredControles = controles.filter((c) => {
    return filterEstado === 'all' || c.estado === filterEstado;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'cumple':
        return <Badge className="bg-green-100 text-green-700">Cumple</Badge>;
      case 'no_cumple':
        return <Badge className="bg-red-100 text-red-700">No Cumple</Badge>;
      case 'revision':
        return <Badge className="bg-yellow-100 text-yellow-700">En Revisión</Badge>;
      case 'pendiente':
        return <Badge className="bg-blue-100 text-blue-700">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleIniciarRevision = (id: string) => {
    setControles(
      controles.map((c) =>
        c.id === id ? { ...c, estado: 'revision' as const } : c
      )
    );
    toast.success('Revisión iniciada');
  };

  const handleMarcarCumple = (id: string) => {
    setControles(
      controles.map((c) =>
        c.id === id
          ? {
              ...c,
              estado: 'cumple' as const,
              ultimaRevision: new Date().toISOString().split('T')[0],
            }
          : c
      )
    );
    toast.success('Control marcado como cumple');
  };

  const handleExportarInforme = () => {
    toast.success('Generando informe de cumplimiento...');
  };

  // Stats
  const stats = {
    cumple: controles.filter((c) => c.estado === 'cumple').length,
    noCumple: controles.filter((c) => c.estado === 'no_cumple').length,
    revision: controles.filter((c) => c.estado === 'revision').length,
    pendiente: controles.filter((c) => c.estado === 'pendiente').length,
    porcentajeCumplimiento: Math.round(
      (controles.filter((c) => c.estado === 'cumple').length / controles.length) * 100
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6" />
            Cumplimiento Normativo
          </h1>
          <p className="text-muted-foreground">
            Control de cumplimiento de normativa de vivienda protegida
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportarInforme}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Informe
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Controles
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cumplimiento</p>
              <p className="text-3xl font-bold text-green-600">{stats.porcentajeCumplimiento}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('cumple')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cumplen</p>
                <p className="text-2xl font-bold text-green-600">{stats.cumple}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('no_cumple')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No Cumplen</p>
                <p className="text-2xl font-bold text-red-600">{stats.noCumple}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('revision')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Revisión</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.revision}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('pendiente')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendiente}</p>
              </div>
              <Clock className="h-6 w-6 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controles */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Controles de Cumplimiento</CardTitle>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cumple">Cumple</SelectItem>
                    <SelectItem value="no_cumple">No Cumple</SelectItem>
                    <SelectItem value="revision">En Revisión</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredControles.map((control) => (
                <div key={control.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{control.tipo}</h4>
                        {getEstadoBadge(control.estado)}
                        {control.afectados > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {control.afectados} afectados
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {control.descripcion}
                      </p>
                      <p className="text-sm mt-2">{control.detalles}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Última: {control.ultimaRevision}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Próxima: {control.proximaRevision}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Ver Detalle
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{control.tipo}</DialogTitle>
                            <DialogDescription>{control.descripcion}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="flex gap-2">
                              {getEstadoBadge(control.estado)}
                              {control.afectados > 0 && (
                                <Badge variant="outline">
                                  {control.afectados} casos afectados
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Última Revisión</p>
                                <p className="font-medium">{control.ultimaRevision}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Próxima Revisión</p>
                                <p className="font-medium">{control.proximaRevision}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-sm">Detalles</p>
                              <p className="text-sm bg-muted p-3 rounded mt-1">
                                {control.detalles}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {control.estado !== 'cumple' && (
                                <Button
                                  className="flex-1"
                                  onClick={() => handleMarcarCumple(control.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como Cumple
                                </Button>
                              )}
                              {control.estado === 'pendiente' && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleIniciarRevision(control.id)}
                                >
                                  Iniciar Revisión
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {control.estado === 'pendiente' && (
                        <Button
                          size="sm"
                          onClick={() => handleIniciarRevision(control.id)}
                        >
                          Revisar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Alertas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Normativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertas.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay alertas activas</p>
              ) : (
                alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`p-3 rounded-lg border ${
                      alerta.tipo === 'critica'
                        ? 'bg-red-50 border-red-200'
                        : alerta.tipo === 'aviso'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <p className="text-sm">{alerta.mensaje}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alerta.fecha}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Resumen de Cumplimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto">
                  <Progress
                    value={stats.porcentajeCumplimiento}
                    className="h-24 w-24 [&>div]:h-full [&>div]:rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {stats.porcentajeCumplimiento}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Nivel de Cumplimiento General
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Viviendas inspeccionadas</span>
                  <span className="font-medium">398</span>
                </div>
                <div className="flex justify-between">
                  <span>Expedientes verificados</span>
                  <span className="font-medium">420</span>
                </div>
                <div className="flex justify-between">
                  <span>Controles realizados (mes)</span>
                  <span className="font-medium">6</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Incumplimientos detectados</span>
                  <span className="font-medium">8</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generar Informe Mensual
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Revisar Incumplimientos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Euro className="h-4 w-4 mr-2" />
                Control de Ingresos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
