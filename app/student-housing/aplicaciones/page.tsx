'use client';

/**
 * Student Housing - Aplicaciones/Solicitudes
 * 
 * Gestión de solicitudes de ingreso a la residencia (conectado a API real)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Calendar,
  GraduationCap,
  Mail,
  Phone,
  Building,
  User,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Aplicacion {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  universidad: string;
  carrera: string;
  curso: string;
  tipoHabitacion: 'individual' | 'doble' | 'triple';
  fechaSolicitud: string;
  fechaIngreso: string;
  estado: 'pendiente' | 'revision' | 'aprobada' | 'rechazada' | 'lista_espera';
  documentos: boolean;
  notas: string;
}

export default function StudentHousingAplicacionesPage() {
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar aplicaciones desde API
  const fetchAplicaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student-housing/applications');
      if (response.ok) {
        const data = await response.json();
        setAplicaciones(data.data || []);
      } else {
        toast.error('Error al cargar solicitudes');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAplicaciones();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [selectedAplicacion, setSelectedAplicacion] = useState<Aplicacion | null>(null);
  const [notaRechazo, setNotaRechazo] = useState('');

  const filteredAplicaciones = aplicaciones.filter((a) => {
    const matchSearch =
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'all' || a.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'revision':
        return <Badge className="bg-blue-100 text-blue-700">En Revisión</Badge>;
      case 'aprobada':
        return <Badge className="bg-green-100 text-green-700">Aprobada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-100 text-red-700">Rechazada</Badge>;
      case 'lista_espera':
        return <Badge className="bg-purple-100 text-purple-700">Lista de Espera</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const updateApplicationStatus = async (id: string, estado: string, notas?: string) => {
    try {
      const response = await fetch(`/api/student-housing/applications?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, ...(notas && { notas }) }),
      });
      if (response.ok) {
        return true;
      }
      toast.error('Error al actualizar solicitud');
      return false;
    } catch (error) {
      toast.error('Error de conexión');
      return false;
    }
  };

  const handleAprobar = async (id: string) => {
    if (await updateApplicationStatus(id, 'aprobada')) {
      setAplicaciones(
        aplicaciones.map((a) =>
          a.id === id ? { ...a, estado: 'aprobada' as const } : a
        )
      );
      toast.success('Solicitud aprobada. Se enviará notificación al estudiante.');
    }
  };

  const handleRechazar = async (id: string) => {
    if (await updateApplicationStatus(id, 'rechazada', notaRechazo)) {
      setAplicaciones(
        aplicaciones.map((a) =>
          a.id === id ? { ...a, estado: 'rechazada' as const, notas: notaRechazo || a.notas } : a
        )
      );
      setNotaRechazo('');
      toast.info('Solicitud rechazada. Se notificará al estudiante.');
    }
  };

  const handleListaEspera = async (id: string) => {
    if (await updateApplicationStatus(id, 'lista_espera')) {
      setAplicaciones(
        aplicaciones.map((a) =>
          a.id === id ? { ...a, estado: 'lista_espera' as const } : a
        )
      );
      toast.info('Solicitud añadida a lista de espera.');
    }
  };

  const handleEnviarRevision = async (id: string) => {
    if (await updateApplicationStatus(id, 'revision')) {
      setAplicaciones(
        aplicaciones.map((a) =>
          a.id === id ? { ...a, estado: 'revision' as const } : a
        )
      );
      toast.success('Solicitud enviada a revisión.');
    }
  };

  const stats = {
    pendientes: aplicaciones.filter((a) => a.estado === 'pendiente').length,
    revision: aplicaciones.filter((a) => a.estado === 'revision').length,
    aprobadas: aplicaciones.filter((a) => a.estado === 'aprobada').length,
    listaEspera: aplicaciones.filter((a) => a.estado === 'lista_espera').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Solicitudes de Ingreso
          </h1>
          <p className="text-muted-foreground">
            Gestión de aplicaciones para la residencia
          </p>
        </div>
        <Button variant="outline" onClick={fetchAplicaciones} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('pendiente')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('revision')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Revisión</p>
                <p className="text-2xl font-bold text-blue-600">{stats.revision}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('aprobada')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.aprobadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('lista_espera')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lista Espera</p>
                <p className="text-2xl font-bold text-purple-600">{stats.listaEspera}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="revision">En Revisión</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
                <SelectItem value="lista_espera">Lista de Espera</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Aplicaciones List */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes ({filteredAplicaciones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAplicaciones.map((aplicacion) => (
              <div
                key={aplicacion.id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">
                      {aplicacion.nombre} {aplicacion.apellidos}
                    </p>
                    {getEstadoBadge(aplicacion.estado)}
                    {!aplicacion.documentos && (
                      <Badge variant="destructive" className="text-xs">
                        Docs pendientes
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {aplicacion.universidad} - {aplicacion.carrera} ({aplicacion.curso})
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Hab. {aplicacion.tipoHabitacion}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Ingreso: {aplicacion.fechaIngreso}
                    </span>
                  </div>
                  {aplicacion.notas && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      "{aplicacion.notas}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAplicacion(aplicacion)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          {aplicacion.nombre} {aplicacion.apellidos}
                        </DialogTitle>
                        <DialogDescription>
                          Solicitud enviada el {aplicacion.fechaSolicitud}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> Email
                            </p>
                            <p className="font-medium">{aplicacion.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" /> Teléfono
                            </p>
                            <p className="font-medium">{aplicacion.telefono}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Universidad</p>
                            <p className="font-medium">{aplicacion.universidad}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Carrera</p>
                            <p className="font-medium">
                              {aplicacion.carrera} ({aplicacion.curso})
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tipo Habitación</p>
                            <p className="font-medium capitalize">{aplicacion.tipoHabitacion}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Ingreso</p>
                            <p className="font-medium">{aplicacion.fechaIngreso}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Documentos</p>
                            <p className="font-medium">
                              {aplicacion.documentos ? (
                                <span className="text-green-600">Completos ✓</span>
                              ) : (
                                <span className="text-red-600">Pendientes ✗</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Estado</p>
                            {getEstadoBadge(aplicacion.estado)}
                          </div>
                        </div>
                        {aplicacion.notas && (
                          <div>
                            <p className="text-muted-foreground text-sm">Notas</p>
                            <p className="text-sm bg-muted p-2 rounded">{aplicacion.notas}</p>
                          </div>
                        )}
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        {aplicacion.estado === 'pendiente' && (
                          <Button
                            variant="outline"
                            onClick={() => handleEnviarRevision(aplicacion.id)}
                          >
                            Enviar a Revisión
                          </Button>
                        )}
                        {(aplicacion.estado === 'pendiente' ||
                          aplicacion.estado === 'revision') && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleListaEspera(aplicacion.id)}
                            >
                              Lista de Espera
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive">Rechazar</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Rechazar esta solicitud?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Se notificará al estudiante del rechazo.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Textarea
                                  placeholder="Motivo del rechazo (opcional)"
                                  value={notaRechazo}
                                  onChange={(e) => setNotaRechazo(e.target.value)}
                                />
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRechazar(aplicacion.id)}
                                  >
                                    Confirmar Rechazo
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button onClick={() => handleAprobar(aplicacion.id)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                          </>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {(aplicacion.estado === 'pendiente' ||
                    aplicacion.estado === 'revision') && (
                    <Button size="sm" onClick={() => handleAprobar(aplicacion.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredAplicaciones.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron solicitudes
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
