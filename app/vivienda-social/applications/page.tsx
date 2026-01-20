'use client';

/**
 * Vivienda Social - Solicitudes
 * 
 * Gestión de solicitudes de vivienda protegida
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Euro,
  Calendar,
  Home,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Solicitud {
  id: string;
  solicitante: string;
  dni: string;
  email: string;
  telefono: string;
  tipoVivienda: 'vpo_general' | 'vpo_jovenes' | 'alquiler_social';
  miembrosFamilia: number;
  ingresosFamilia: number;
  fechaSolicitud: string;
  estado: 'pendiente' | 'en_revision' | 'documentacion' | 'aprobada' | 'rechazada' | 'lista_espera';
  puntuacion: number;
  documentosCompletos: boolean;
  notas: string;
}

const SOLICITUDES_MOCK: Solicitud[] = [
  {
    id: '1',
    solicitante: 'García Martínez, Juan',
    dni: '12345678A',
    email: 'juan.garcia@email.com',
    telefono: '+34 612 345 678',
    tipoVivienda: 'vpo_general',
    miembrosFamilia: 4,
    ingresosFamilia: 28000,
    fechaSolicitud: '2026-01-18',
    estado: 'pendiente',
    puntuacion: 0,
    documentosCompletos: true,
    notas: '',
  },
  {
    id: '2',
    solicitante: 'López Fernández, María',
    dni: '23456789B',
    email: 'maria.lopez@email.com',
    telefono: '+34 623 456 789',
    tipoVivienda: 'vpo_jovenes',
    miembrosFamilia: 2,
    ingresosFamilia: 22000,
    fechaSolicitud: '2026-01-17',
    estado: 'en_revision',
    puntuacion: 75,
    documentosCompletos: true,
    notas: 'Pareja joven sin hijos',
  },
  {
    id: '3',
    solicitante: 'Sánchez Torres, Pedro',
    dni: '34567890C',
    email: 'pedro.sanchez@email.com',
    telefono: '+34 634 567 890',
    tipoVivienda: 'alquiler_social',
    miembrosFamilia: 3,
    ingresosFamilia: 15000,
    fechaSolicitud: '2026-01-16',
    estado: 'aprobada',
    puntuacion: 92,
    documentosCompletos: true,
    notas: 'Familia monoparental',
  },
  {
    id: '4',
    solicitante: 'Ruiz González, Ana',
    dni: '45678901D',
    email: 'ana.ruiz@email.com',
    telefono: '+34 645 678 901',
    tipoVivienda: 'vpo_general',
    miembrosFamilia: 5,
    ingresosFamilia: 32000,
    fechaSolicitud: '2026-01-15',
    estado: 'documentacion',
    puntuacion: 0,
    documentosCompletos: false,
    notas: 'Falta certificado de empadronamiento',
  },
  {
    id: '5',
    solicitante: 'Martín Díaz, Carlos',
    dni: '56789012E',
    email: 'carlos.martin@email.com',
    telefono: '+34 656 789 012',
    tipoVivienda: 'vpo_general',
    miembrosFamilia: 3,
    ingresosFamilia: 45000,
    fechaSolicitud: '2026-01-14',
    estado: 'rechazada',
    puntuacion: 0,
    documentosCompletos: true,
    notas: 'Ingresos superan el límite establecido',
  },
  {
    id: '6',
    solicitante: 'Fernández López, Laura',
    dni: '67890123F',
    email: 'laura.fernandez@email.com',
    telefono: '+34 667 890 123',
    tipoVivienda: 'vpo_jovenes',
    miembrosFamilia: 1,
    ingresosFamilia: 18000,
    fechaSolicitud: '2026-01-12',
    estado: 'lista_espera',
    puntuacion: 68,
    documentosCompletos: true,
    notas: 'Posición #15 en lista de espera',
  },
];

export default function ViviendaSocialApplicationsPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');

  // Cargar solicitudes desde API
  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vivienda-social/applications');
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [notaRechazo, setNotaRechazo] = useState('');

  const filteredSolicitudes = solicitudes.filter((s) => {
    const matchSearch =
      s.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dni.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'all' || s.estado === filterEstado;
    const matchTipo = filterTipo === 'all' || s.tipoVivienda === filterTipo;
    return matchSearch && matchEstado && matchTipo;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'en_revision':
        return <Badge className="bg-blue-100 text-blue-700">En Revisión</Badge>;
      case 'documentacion':
        return <Badge className="bg-orange-100 text-orange-700">Docs. Pendiente</Badge>;
      case 'aprobada':
        return <Badge className="bg-green-100 text-green-700">Aprobada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-100 text-red-700">Rechazada</Badge>;
      case 'lista_espera':
        return <Badge className="bg-purple-100 text-purple-700">Lista Espera</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'vpo_general':
        return <Badge variant="outline">VPO General</Badge>;
      case 'vpo_jovenes':
        return <Badge className="bg-blue-100 text-blue-700">VPO Jóvenes</Badge>;
      case 'alquiler_social':
        return <Badge className="bg-green-100 text-green-700">Alquiler Social</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const handleAprobar = (id: string) => {
    setSolicitudes(
      solicitudes.map((s) =>
        s.id === id ? { ...s, estado: 'aprobada' as const, puntuacion: 85 } : s
      )
    );
    toast.success('Solicitud aprobada. Se notificará al solicitante.');
  };

  const handleRechazar = (id: string) => {
    setSolicitudes(
      solicitudes.map((s) =>
        s.id === id ? { ...s, estado: 'rechazada' as const, notas: notaRechazo || s.notas } : s
      )
    );
    setNotaRechazo('');
    toast.info('Solicitud rechazada.');
  };

  const handleEnviarARevision = (id: string) => {
    setSolicitudes(
      solicitudes.map((s) =>
        s.id === id ? { ...s, estado: 'en_revision' as const } : s
      )
    );
    toast.success('Solicitud enviada a revisión.');
  };

  const handleListaEspera = (id: string) => {
    setSolicitudes(
      solicitudes.map((s) =>
        s.id === id ? { ...s, estado: 'lista_espera' as const } : s
      )
    );
    toast.info('Solicitud añadida a lista de espera.');
  };

  const stats = {
    pendientes: solicitudes.filter((s) => s.estado === 'pendiente').length,
    enRevision: solicitudes.filter((s) => s.estado === 'en_revision').length,
    aprobadas: solicitudes.filter((s) => s.estado === 'aprobada').length,
    listaEspera: solicitudes.filter((s) => s.estado === 'lista_espera').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Solicitudes de Vivienda
          </h1>
          <p className="text-muted-foreground">
            Gestión de solicitudes de vivienda protegida
          </p>
        </div>
        <Button asChild>
          <Link href="/vivienda-social/eligibility">
            <CheckCircle className="h-4 w-4 mr-2" />
            Verificar Elegibilidad
          </Link>
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
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterEstado('en_revision')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Revisión</p>
                <p className="text-2xl font-bold text-blue-600">{stats.enRevision}</p>
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
              <Users className="h-8 w-8 text-purple-500 opacity-80" />
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
                placeholder="Buscar por nombre o DNI..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_revision">En Revisión</SelectItem>
                <SelectItem value="documentacion">Docs. Pendiente</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
                <SelectItem value="lista_espera">Lista Espera</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="vpo_general">VPO General</SelectItem>
                <SelectItem value="vpo_jovenes">VPO Jóvenes</SelectItem>
                <SelectItem value="alquiler_social">Alquiler Social</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Solicitudes List */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes ({filteredSolicitudes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSolicitudes.map((solicitud) => (
              <div
                key={solicitud.id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{solicitud.solicitante}</p>
                    {getTipoBadge(solicitud.tipoVivienda)}
                    {getEstadoBadge(solicitud.estado)}
                    {!solicitud.documentosCompletos && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Docs pendientes
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span>DNI: {solicitud.dni}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {solicitud.miembrosFamilia} miembros
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="h-3 w-3" />
                      €{solicitud.ingresosFamilia.toLocaleString()}/año
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {solicitud.fechaSolicitud}
                    </span>
                    {solicitud.puntuacion > 0 && (
                      <span className="font-medium text-blue-600">
                        Puntuación: {solicitud.puntuacion}
                      </span>
                    )}
                  </div>
                  {solicitud.notas && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      "{solicitud.notas}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSolicitud(solicitud)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{solicitud.solicitante}</DialogTitle>
                        <DialogDescription>
                          Solicitud enviada el {solicitud.fechaSolicitud}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="flex gap-2">
                          {getTipoBadge(solicitud.tipoVivienda)}
                          {getEstadoBadge(solicitud.estado)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">DNI</p>
                            <p className="font-medium">{solicitud.dni}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{solicitud.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Teléfono</p>
                            <p className="font-medium">{solicitud.telefono}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Miembros Familia</p>
                            <p className="font-medium">{solicitud.miembrosFamilia}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ingresos Anuales</p>
                            <p className="font-medium">€{solicitud.ingresosFamilia.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Documentos</p>
                            <p className="font-medium">
                              {solicitud.documentosCompletos ? (
                                <span className="text-green-600">Completos ✓</span>
                              ) : (
                                <span className="text-red-600">Pendientes ✗</span>
                              )}
                            </p>
                          </div>
                          {solicitud.puntuacion > 0 && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Puntuación</p>
                              <p className="font-medium text-lg text-blue-600">
                                {solicitud.puntuacion} puntos
                              </p>
                            </div>
                          )}
                        </div>
                        {solicitud.notas && (
                          <div>
                            <p className="text-muted-foreground text-sm">Notas</p>
                            <p className="text-sm bg-muted p-2 rounded">{solicitud.notas}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {solicitud.estado === 'pendiente' && (
                            <Button
                              variant="outline"
                              onClick={() => handleEnviarARevision(solicitud.id)}
                            >
                              Enviar a Revisión
                            </Button>
                          )}
                          {(solicitud.estado === 'pendiente' || solicitud.estado === 'en_revision') && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => handleListaEspera(solicitud.id)}
                              >
                                Lista de Espera
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleRechazar(solicitud.id)}
                              >
                                Rechazar
                              </Button>
                              <Button onClick={() => handleAprobar(solicitud.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {(solicitud.estado === 'pendiente' || solicitud.estado === 'en_revision') && (
                    <Button size="sm" onClick={() => handleAprobar(solicitud.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredSolicitudes.length === 0 && (
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
