'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Home,
  Building2,
  MapPin,
  Euro,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  Check,
  X as XIcon,
  Image as ImageIcon,
  Users,
  Warehouse,
  Car,
  Droplet,
  Thermometer,
  TreePine,
  MoreVertical,
  Eye,
  Plus,
  FileText,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  estado: string;
  superficie: number;
  rentaMensual: number;
  tenant?: {
    id: string;
    nombreCompleto: string;
    email: string;
  } | null;
  contracts?: Array<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
  }>;
}

interface BuildingDetails {
  id: string;
  nombre: string;
  direccion: string;
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
  latitud?: number;
  longitud?: number;
  imagenes?: string[];
  etiquetas?: string[];
  createdAt: string;
  updatedAt: string;
  units: Unit[];
}

export default function EdificioDetallesPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [building, setBuilding] = useState<BuildingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildingId = params?.id as string;

  // Redirect si no autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar edificio
  useEffect(() => {
    const fetchBuilding = async () => {
      if (status !== 'authenticated' || !buildingId) return;

      try {
        setError(null);
        const response = await fetch(`/api/buildings/${buildingId}`);
        if (response.ok) {
          const data = await response.json();
          // Normalizar datos para evitar errores de tipo
          const normalizedData: BuildingDetails = {
            ...data,
            units: data.units || [],
            imagenes: data.imagenes || [],
            etiquetas: data.etiquetas || [],
            ascensor: data.ascensor ?? false,
            garaje: data.garaje ?? false,
            trastero: data.trastero ?? false,
            piscina: data.piscina ?? false,
            jardin: data.jardin ?? false,
          };
          setBuilding(normalizedData);
        } else if (response.status === 404) {
          setError('Edificio no encontrado');
          toast.error('Edificio no encontrado');
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Error al cargar el edificio');
          toast.error(errorData.error || 'Error al cargar el edificio');
        }
      } catch (err) {
        console.error('Error fetching building:', err);
        setError('Error de conexión al servidor');
        toast.error('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilding();
  }, [status, buildingId]);

  const handleDeleteConfirm = async () => {
    if (!building) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/buildings/${building.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el edificio');
      }

      toast.success(`Edificio "${building.nombre}" eliminado correctamente`);
      router.push('/edificios');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar';
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      residencial: { variant: 'default', label: 'Residencial' },
      comercial: { variant: 'secondary', label: 'Comercial' },
      mixto: { variant: 'outline', label: 'Mixto' },
      industrial: { variant: 'destructive', label: 'Industrial' },
    };
    return badges[tipo?.toLowerCase()] || { variant: 'default', label: tipo };
  };

  const getEstadoUnidadBadge = (estado: string) => {
    const badges: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      ocupada: { variant: 'default', label: 'Ocupada' },
      disponible: { variant: 'secondary', label: 'Disponible' },
      en_mantenimiento: { variant: 'outline', label: 'Mantenimiento' },
      reservada: { variant: 'destructive', label: 'Reservada' },
    };
    return badges[estado?.toLowerCase()] || { variant: 'secondary', label: estado || 'Disponible' };
  };

  // Calcular métricas
  const calculateMetrics = () => {
    if (!building?.units) return { ocupadas: 0, disponibles: 0, ingresos: 0, ocupacionPct: 0 };
    
    const ocupadas = building.units.filter(u => u.estado?.toLowerCase() === 'ocupada').length;
    const disponibles = building.units.filter(u => u.estado?.toLowerCase() === 'disponible').length;
    const ingresos = building.units
      .filter(u => u.estado?.toLowerCase() === 'ocupada')
      .reduce((acc, u) => acc + (u.rentaMensual || 0), 0);
    const ocupacionPct = building.units.length > 0 ? (ocupadas / building.units.length) * 100 : 0;
    
    return { ocupadas, disponibles, ingresos, ocupacionPct };
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  // Mostrar error si hay alguno
  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/edificios')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Edificios
            </Button>
          </div>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => router.push('/edificios')}>
                  Volver al listado de edificios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!building) return null;

  const tipoBadge = getTipoBadge(building.tipo);
  const metrics = calculateMetrics();

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/edificios')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
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
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold tracking-tight">{building.nombre}</h1>
              <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{building.direccion}</span>
            </div>
            {building.anoConstructor && (
              <p className="text-sm text-muted-foreground">
                Construido en {building.anoConstructor}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/edificios/${building.id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{building.units?.length || building.numeroUnidades}</div>
              <p className="text-xs text-muted-foreground">En este edificio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.ocupadas}</div>
              <p className="text-xs text-muted-foreground">{metrics.ocupacionPct.toFixed(1)}% ocupación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.disponibles}</div>
              <p className="text-xs text-muted-foreground">Listas para alquilar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{metrics.ingresos.toLocaleString('es-ES')}
              </div>
              <p className="text-xs text-muted-foreground">De unidades ocupadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galería de Imágenes */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted">
                  {building.imagenes && building.imagenes.length > 0 ? (
                    <Image
                      src={building.imagenes[0]}
                      alt={`Edificio ${building.nombre}`}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Building2 className="h-16 w-16 mb-2" />
                      <p className="text-sm">Sin imágenes disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Unidades */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Unidades del Edificio</CardTitle>
                  <CardDescription>
                    {building.units?.length || 0} unidades registradas
                  </CardDescription>
                </div>
                <Button onClick={() => router.push(`/propiedades/crear?buildingId=${building.id}`)}>
                  <Plus className="mr-2 h-4 w-4" />
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
                        <TableHead>Estado</TableHead>
                        <TableHead>Superficie</TableHead>
                        <TableHead>Renta</TableHead>
                        <TableHead>Inquilino</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {building.units.map((unit) => {
                        const estadoBadge = getEstadoUnidadBadge(unit.estado);
                        return (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.numero}</TableCell>
                            <TableCell className="capitalize">{unit.tipo}</TableCell>
                            <TableCell>
                              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                            </TableCell>
                            <TableCell>{unit.superficie}m²</TableCell>
                            <TableCell>€{unit.rentaMensual?.toLocaleString('es-ES') || 0}</TableCell>
                            <TableCell>
                              {unit.tenant ? (
                                <Link 
                                  href={`/inquilinos/${unit.tenant.id}`}
                                  className="text-primary hover:underline"
                                >
                                  {unit.tenant.nombreCompleto}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/propiedades/${unit.id}`)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/propiedades/${unit.id}/editar`)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No hay unidades registradas</p>
                    <p className="text-sm">Crea la primera unidad de este edificio</p>
                    <Button 
                      className="mt-4"
                      onClick={() => router.push(`/propiedades/crear?buildingId=${building.id}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Unidad
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Características del Edificio */}
            <Card>
              <CardHeader>
                <CardTitle>Equipamiento y Servicios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: 'Ascensor', value: building.ascensor, icon: Building2 },
                    { label: 'Garaje', value: building.garaje, icon: Car },
                    { label: 'Trastero', value: building.trastero, icon: Warehouse },
                    { label: 'Piscina', value: building.piscina, icon: Droplet },
                    { label: 'Jardín', value: building.jardin, icon: TreePine },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Icon className={`h-5 w-5 ${item.value ? 'text-green-600' : 'text-muted-foreground'}`} />
                        {item.value ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <XIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={item.value ? '' : 'text-muted-foreground'}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Lateral */}
          <div className="space-y-6">
            {/* Información Económica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Información Económica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {building.gastosComunidad && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Gastos de Comunidad</p>
                    <p className="text-2xl font-bold">
                      €{building.gastosComunidad.toLocaleString('es-ES')}/mes
                    </p>
                  </div>
                )}
                {building.ibiAnual && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">IBI Anual</p>
                    <p className="text-2xl font-bold">
                      €{building.ibiAnual.toLocaleString('es-ES')}
                    </p>
                  </div>
                )}
                {!building.gastosComunidad && !building.ibiAnual && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay información económica registrada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Información Técnica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Información Técnica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {building.estadoConservacion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Estado de Conservación</p>
                    <p className="font-semibold capitalize">{building.estadoConservacion}</p>
                  </div>
                )}
                {building.certificadoEnergetico && (
                  <div>
                    <p className="text-sm text-muted-foreground">Certificado Energético</p>
                    <Badge variant="outline" className="text-lg font-bold">
                      {building.certificadoEnergetico}
                    </Badge>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Año de Construcción</p>
                  <p className="font-semibold">{building.anoConstructor}</p>
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/propiedades/crear?buildingId=${building.id}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Unidad
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/mantenimiento/nuevo?buildingId=${building.id}`)}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Nueva Incidencia
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/documentos?buildingId=${building.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Documentos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const rentaAnual = metrics.ingresos * 12;
                    const gastos = (building.gastosComunidad || 0) * 12 + (building.ibiAnual || 0);
                    const netAnual = rentaAnual - gastos;
                    toast.success(`Rentabilidad Neta Estimada`, {
                      description: `Ingresos: €${rentaAnual.toLocaleString('es-ES')}/año - Gastos: €${gastos.toLocaleString('es-ES')}/año = €${netAnual.toLocaleString('es-ES')}/año neto`
                    });
                  }}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Análisis de Rentabilidad
                </Button>
              </CardContent>
            </Card>

            {/* Etiquetas */}
            {building.etiquetas && building.etiquetas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Etiquetas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {building.etiquetas.map((etiqueta, index) => (
                      <Badge key={index} variant="secondary">
                        {etiqueta}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadatos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <p>Creado: {new Date(building.createdAt).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <p>
                    Última actualización: {new Date(building.updatedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs">ID: {building.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar edificio?"
        itemName={building?.nombre}
        description={
          building
            ? `Se eliminará el edificio "${building.nombre}" y todos sus datos asociados (${building.units?.length || 0} unidades). Esta acción no se puede deshacer.`
            : undefined
        }
      />
    </AuthenticatedLayout>
  );
}
