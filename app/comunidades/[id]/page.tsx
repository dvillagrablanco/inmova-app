'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  Euro,
  FileText,
  Vote,
  AlertTriangle,
  Calendar,
  ArrowLeft,
  Edit,
  TrendingUp,
  Wallet,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ComunidadDetalle {
  id: string;
  nombreComunidad: string;
  cif: string | null;
  direccion: string;
  codigoPostal: string | null;
  ciudad: string | null;
  provincia: string | null;
  activa: boolean;
  fechaInicio: string;
  honorariosFijos: number | null;
  honorariosPorcentaje: number | null;
  building: {
    id: string;
    name: string;
    address: string;
    units: any[];
  } | null;
  stats: {
    totalUnidades: number;
    cuotasPendientes: number;
    votacionesActivas: number;
    reunionesProgramadas: number;
    incidenciasAbiertas: number;
  };
  fondos: any[];
}

export default function DetalleComunidadPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [comunidad, setComunidad] = useState<ComunidadDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  const comunidadId = params.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && comunidadId) {
      fetchComunidad();
    }
  }, [status, router, comunidadId]);

  const fetchComunidad = async () => {
    try {
      const res = await fetch(`/api/comunidades/${comunidadId}`);
      if (res.ok) {
        const data = await res.json();
        setComunidad(data.comunidad);
      } else {
        toast.error('Comunidad no encontrada');
        router.push('/comunidades/lista');
      }
    } catch (error) {
      console.error('Error fetching comunidad:', error);
      toast.error('Error al cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!comunidad) {
    return null;
  }

  const totalFondos = comunidad.fondos?.reduce((sum, f) => sum + f.saldoActual, 0) || 0;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades/lista')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{comunidad.nombreComunidad}</h1>
              <Badge variant={comunidad.activa ? 'default' : 'secondary'}>
                {comunidad.activa ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{comunidad.direccion}</p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/comunidades/${comunidadId}/editar`)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unidades</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{comunidad.stats.totalUnidades}</div>
              <p className="text-xs text-muted-foreground">Viviendas y locales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cuotas Pendientes</CardTitle>
              <Euro className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{comunidad.stats.cuotasPendientes}</div>
              <Button
                variant="link"
                className="px-0 text-xs"
                onClick={() => router.push('/comunidades/cuotas')}
              >
                Ver detalle →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Votaciones</CardTitle>
              <Vote className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {comunidad.stats.votacionesActivas}
              </div>
              <p className="text-xs text-muted-foreground">Activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {comunidad.stats.incidenciasAbiertas}
              </div>
              <p className="text-xs text-muted-foreground">Abiertas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fondos</CardTitle>
              <Wallet className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalFondos.toLocaleString('es-ES')}€
              </div>
              <p className="text-xs text-muted-foreground">{comunidad.fondos?.length || 0} fondos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="propietarios">Propietarios</TabsTrigger>
            <TabsTrigger value="unidades">Unidades</TabsTrigger>
            <TabsTrigger value="fondos">Fondos</TabsTrigger>
            <TabsTrigger value="info">Información</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Acciones Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/comunidades/cuotas')}
                  >
                    <Euro className="w-4 h-4 mr-2" />
                    Generar Cuotas
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/comunidades/votaciones')}
                  >
                    <Vote className="w-4 h-4 mr-2" />
                    Nueva Votación
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/comunidades/actas')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Nueva Acta
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/comunidades/incidencias?comunidadId=${comunidadId}`)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Incidencias
                  </Button>
                </CardContent>
              </Card>

              {/* Próximas Reuniones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Próximas Reuniones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {comunidad.stats.reunionesProgramadas > 0 ? (
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-blue-600">
                        {comunidad.stats.reunionesProgramadas}
                      </div>
                      <p className="text-muted-foreground">reuniones programadas</p>
                      <Button
                        variant="link"
                        onClick={() => router.push(`/comunidades/reuniones?comunidadId=${comunidadId}`)}
                      >
                        Ver calendario →
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No hay reuniones programadas
                      <Button
                        variant="link"
                        className="block mx-auto"
                        onClick={() => router.push(`/comunidades/reuniones?comunidadId=${comunidadId}`)}
                      >
                        Programar reunión
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fondos */}
            {comunidad.fondos && comunidad.fondos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Fondos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comunidad.fondos.map((fondo) => (
                    <div key={fondo.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{fondo.nombre}</span>
                        <span className="text-sm">
                          {fondo.saldoActual.toLocaleString('es-ES')}€
                          {fondo.saldoObjetivo && (
                            <span className="text-muted-foreground">
                              {' '}
                              / {fondo.saldoObjetivo.toLocaleString('es-ES')}€
                            </span>
                          )}
                        </span>
                      </div>
                      {fondo.saldoObjetivo && (
                        <Progress
                          value={Math.min((fondo.saldoActual / fondo.saldoObjetivo) * 100, 100)}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="propietarios">
            <Card>
              <CardHeader>
                <CardTitle>Propietarios</CardTitle>
                <CardDescription>Lista de propietarios de la comunidad</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push(`/comunidades/propietarios?comunidadId=${comunidadId}`)}>
                  <Users className="w-4 h-4 mr-2" />
                  Ver Propietarios
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unidades">
            <Card>
              <CardHeader>
                <CardTitle>Unidades ({comunidad.stats.totalUnidades})</CardTitle>
                <CardDescription>Viviendas y locales del edificio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {comunidad.building?.units?.map((unit) => (
                    <Card key={unit.id} className="p-3">
                      <div className="font-medium">{unit.unitNumber}</div>
                      <div className="text-xs text-muted-foreground">{unit.type}</div>
                      <Badge variant={unit.status === 'ocupada' ? 'default' : 'secondary'} className="mt-1">
                        {unit.status}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fondos">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Fondos</CardTitle>
                <CardDescription>Fondos de reserva y derramas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push(`/comunidades/fondos?comunidadId=${comunidadId}`)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Gestionar Fondos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Comunidad</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">CIF</Label>
                  <p className="font-medium">{comunidad.cif || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="font-medium">{comunidad.direccion}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ciudad</Label>
                  <p className="font-medium">{comunidad.ciudad || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Código Postal</Label>
                  <p className="font-medium">{comunidad.codigoPostal || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Alta</Label>
                  <p className="font-medium">
                    {new Date(comunidad.fechaInicio).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Edificio Asociado</Label>
                  <p className="font-medium">{comunidad.building?.name || '-'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm ${className || ''}`}>{children}</p>;
}
