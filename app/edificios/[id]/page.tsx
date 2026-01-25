'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Building2,
  ArrowLeft,
  MapPin,
  Calendar,
  Home,
  Users,
  Euro,
  Edit,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Car,
  TreesIcon,
  Waves,
  Package,
  FileText,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  superficie: number;
  habitaciones: number;
  banos: number;
  estado: string;
  rentaMensual: number;
  tenant?: {
    id: string;
    nombre: string;
    apellidos: string;
  };
}

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  ciudad?: string;
  codigoPostal?: string;
  tipo: string;
  anoConstructor: number;
  numeroUnidades: number;
  estadoConservacion?: string;
  certificadoEnergetico?: string;
  ascensor: boolean;
  garaje: boolean;
  trastero: boolean;
  piscina: boolean;
  jardin: boolean;
  gastosComunidad?: number;
  ibiAnual?: number;
  imagenes: string[];
  units: Unit[];
  createdAt: string;
  updatedAt: string;
}

export default function BuildingDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const buildingId = params?.id as string;

  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && buildingId) {
      fetchBuilding();
    }
  }, [status, buildingId]);

  const fetchBuilding = async () => {
    try {
      const response = await fetch(`/api/buildings/${buildingId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Edificio no encontrado');
          router.push('/edificios');
          return;
        }
        throw new Error('Error al cargar el edificio');
      }

      const data = await response.json();
      setBuilding(data);
    } catch (error: any) {
      console.error('Error fetching building:', error);
      toast.error(error.message || 'Error al cargar el edificio');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!building) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el edificio');
      }

      toast.success('Edificio eliminado correctamente');
      router.push('/edificios');
    } catch (error: any) {
      console.error('Error deleting building:', error);
      toast.error(error.message || 'Error al eliminar el edificio');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'ocupado':
      case 'alquilado':
        return 'bg-green-100 text-green-800';
      case 'disponible':
        return 'bg-blue-100 text-blue-800';
      case 'mantenimiento':
        return 'bg-yellow-100 text-yellow-800';
      case 'reservado':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoEdificioLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      RESIDENCIAL: 'Residencial',
      COMERCIAL: 'Comercial',
      MIXTO: 'Mixto',
      INDUSTRIAL: 'Industrial',
      OFICINAS: 'Oficinas',
    };
    return tipos[tipo] || tipo;
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando edificio...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!building) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Edificio no encontrado</h2>
            <p className="text-muted-foreground mb-4">
              El edificio que buscas no existe o no tienes acceso.
            </p>
            <Button onClick={() => router.push('/edificios')}>
              Volver a Edificios
            </Button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Calcular estadísticas
  const totalUnidades = building.units?.length || 0;
  const unidadesOcupadas = building.units?.filter(u => 
    u.estado?.toLowerCase() === 'ocupado' || u.estado?.toLowerCase() === 'alquilado'
  ).length || 0;
  const unidadesDisponibles = totalUnidades - unidadesOcupadas;
  const ingresosMensuales = building.units?.reduce((sum, u) => {
    if (u.estado?.toLowerCase() === 'ocupado' || u.estado?.toLowerCase() === 'alquilado') {
      return sum + (u.rentaMensual || 0);
    }
    return sum;
  }, 0) || 0;
  const superficieTotal = building.units?.reduce((sum, u) => sum + (u.superficie || 0), 0) || 0;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/edificios')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/edificios">Edificios</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{building.nombre}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                {building.nombre}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {building.direccion}
                {building.ciudad && `, ${building.ciudad}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/valoracion-ia?buildingId=${building.id}`)}
              >
                <Brain className="h-4 w-4 mr-2" />
                Valorar con IA
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/edificios/${building.id}/editar`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar edificio?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todas las unidades
                      asociadas y sus datos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Unidades</p>
                  <p className="text-2xl font-bold">{totalUnidades}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ocupadas</p>
                  <p className="text-2xl font-bold">{unidadesOcupadas} / {totalUnidades}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Euro className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos/mes</p>
                  <p className="text-2xl font-bold">{formatCurrency(ingresosMensuales)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Superficie Total</p>
                  <p className="text-2xl font-bold">{superficieTotal} m²</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="units">Unidades ({totalUnidades})</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Datos generales */}
              <Card>
                <CardHeader>
                  <CardTitle>Datos Generales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{getTipoEdificioLabel(building.tipo)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Año construcción</p>
                      <p className="font-medium">{building.anoConstructor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="font-medium">{building.estadoConservacion || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Certificado energético</p>
                      <Badge variant="outline">{building.certificadoEnergetico || 'N/A'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Características */}
              <Card>
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      {building.ascensor ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={building.ascensor ? '' : 'text-muted-foreground'}>Ascensor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {building.garaje ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={building.garaje ? '' : 'text-muted-foreground'}>Garaje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {building.trastero ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={building.trastero ? '' : 'text-muted-foreground'}>Trastero</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {building.piscina ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={building.piscina ? '' : 'text-muted-foreground'}>Piscina</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {building.jardin ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={building.jardin ? '' : 'text-muted-foreground'}>Jardín</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gastos */}
              <Card>
                <CardHeader>
                  <CardTitle>Gastos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gastos comunidad (mensual)</span>
                    <span className="font-medium">
                      {building.gastosComunidad ? formatCurrency(building.gastosComunidad) : 'No especificado'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">IBI (anual)</span>
                    <span className="font-medium">
                      {building.ibiAnual ? formatCurrency(building.ibiAnual) : 'No especificado'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Fechas */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del registro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fecha de creación</span>
                    <span className="font-medium">
                      {new Date(building.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Última actualización</span>
                    <span className="font-medium">
                      {new Date(building.updatedAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Unidades del edificio</CardTitle>
                  <CardDescription>
                    {totalUnidades} unidades · {unidadesOcupadas} ocupadas · {unidadesDisponibles} disponibles
                  </CardDescription>
                </div>
                <Button onClick={() => router.push(`/unidades/nuevo?buildingId=${building.id}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Unidad
                </Button>
              </CardHeader>
              <CardContent>
                {building.units && building.units.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Superficie</TableHead>
                        <TableHead>Hab.</TableHead>
                        <TableHead>Baños</TableHead>
                        <TableHead>Renta</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Inquilino</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {building.units.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.numero}</TableCell>
                          <TableCell>{unit.tipo}</TableCell>
                          <TableCell>{unit.superficie} m²</TableCell>
                          <TableCell>{unit.habitaciones}</TableCell>
                          <TableCell>{unit.banos}</TableCell>
                          <TableCell>{formatCurrency(unit.rentaMensual)}</TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(unit.estado)}>
                              {unit.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {unit.tenant ? (
                              `${unit.tenant.nombre} ${unit.tenant.apellidos}`
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/unidades/${unit.id}`)}
                            >
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay unidades</h3>
                    <p className="text-muted-foreground mb-4">
                      Este edificio no tiene unidades registradas.
                    </p>
                    <Button onClick={() => router.push(`/unidades/nuevo?buildingId=${building.id}`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primera unidad
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documentos</CardTitle>
                  <CardDescription>
                    Documentos asociados al edificio
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Subir documento
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin documentos</h3>
                  <p className="text-muted-foreground">
                    No hay documentos asociados a este edificio.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
