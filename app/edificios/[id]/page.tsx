'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Building2,
  Home,
  ArrowLeft,
  MapPin,
  Calendar,
  Layers,
  Users,
  Euro,
  TrendingUp,
  Edit,
  Trash2,
  Plus,
  Eye,
  DoorOpen,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  superficie: number;
  habitaciones: number | null;
  banos: number | null;
  rentaMensual: number;
  estado: string;
  tenant?: {
    id: string;
    nombreCompleto: string;
    email: string;
  } | null;
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
  superficieTotal?: number;
  createdAt: string;
  units: Unit[];
}

export default function EdificioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  const buildingId = params?.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (buildingId && status === 'authenticated') {
      fetchBuilding();
    }
  }, [buildingId, status]);

  const fetchBuilding = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/buildings/${buildingId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Edificio no encontrado');
          router.push('/edificios');
          return;
        }
        throw new Error('Error al cargar edificio');
      }

      const data = await response.json();
      setBuilding(data);
    } catch (error) {
      console.error('Error fetching building:', error);
      toast.error('Error al cargar los datos del edificio');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;

    try {
      const response = await fetch(`/api/units/${deletingUnit.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Unidad eliminada correctamente');
        fetchBuilding();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar la unidad');
      }
    } catch (error) {
      toast.error('Error al eliminar la unidad');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingUnit(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      disponible: { variant: 'default', label: 'Disponible' },
      ocupada: { variant: 'secondary', label: 'Ocupada' },
      ocupado: { variant: 'secondary', label: 'Ocupado' },
      en_mantenimiento: { variant: 'destructive', label: 'Mantenimiento' },
      mantenimiento: { variant: 'destructive', label: 'Mantenimiento' },
    };
    return estados[estado?.toLowerCase()] || { variant: 'outline' as const, label: estado };
  };

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      residencial: { variant: 'default', label: 'Residencial' },
      comercial: { variant: 'secondary', label: 'Comercial' },
      mixto: { variant: 'outline', label: 'Mixto' },
      industrial: { variant: 'outline', label: 'Industrial' },
    };
    return tipos[tipo?.toLowerCase()] || { variant: 'outline' as const, label: tipo };
  };

  // Calculate metrics
  const calculateMetrics = () => {
    if (!building?.units || building.units.length === 0) {
      return {
        totalUnits: 0,
        occupiedUnits: 0,
        availableUnits: 0,
        occupancyRate: 0,
        totalRevenue: 0,
        potentialRevenue: 0,
      };
    }

    const totalUnits = building.units.length;
    const occupiedUnits = building.units.filter(
      u => u.estado?.toLowerCase() === 'ocupada' || u.estado?.toLowerCase() === 'ocupado'
    ).length;
    const availableUnits = building.units.filter(
      u => u.estado?.toLowerCase() === 'disponible'
    ).length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    const totalRevenue = building.units
      .filter(u => u.estado?.toLowerCase() === 'ocupada' || u.estado?.toLowerCase() === 'ocupado')
      .reduce((sum, u) => sum + (u.rentaMensual || 0), 0);
    const potentialRevenue = building.units.reduce((sum, u) => sum + (u.rentaMensual || 0), 0);

    return {
      totalUnits,
      occupiedUnits,
      availableUnits,
      occupancyRate,
      totalRevenue,
      potentialRevenue,
    };
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!building) {
    return null;
  }

  const metrics = calculateMetrics();
  const tipoBadge = getTipoBadge(building.tipo);

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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{building.nombre}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{building.direccion}</span>
                {building.ciudad && <span>• {building.ciudad}</span>}
                {building.codigoPostal && <span>• {building.codigoPostal}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
            <Button variant="outline" size="sm" onClick={() => router.push(`/edificios/${buildingId}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unidades Totales</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUnits}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.availableUnits} disponibles • {metrics.occupiedUnits} ocupadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.occupancyRate.toFixed(1)}%</div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${metrics.occupancyRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{metrics.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                de €{metrics.potentialRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} potenciales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Año Construcción</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{building.anoConstructor}</div>
              <p className="text-xs text-muted-foreground">
                {new Date().getFullYear() - building.anoConstructor} años de antigüedad
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Units Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DoorOpen className="h-5 w-5" />
                  Propiedades / Unidades
                </CardTitle>
                <CardDescription>
                  Lista de todas las unidades del edificio
                </CardDescription>
              </div>
              <Button onClick={() => router.push(`/propiedades/crear?buildingId=${buildingId}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Unidad
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {building.units && building.units.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Superficie</TableHead>
                    <TableHead>Habitaciones</TableHead>
                    <TableHead>Renta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {building.units.map((unit) => {
                    const estadoBadge = getEstadoBadge(unit.estado);
                    return (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.numero}</TableCell>
                        <TableCell className="capitalize">{unit.tipo}</TableCell>
                        <TableCell>{unit.superficie} m²</TableCell>
                        <TableCell>
                          {unit.habitaciones ?? 0} hab / {unit.banos ?? 0} baño
                        </TableCell>
                        <TableCell>
                          €{(unit.rentaMensual || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                        </TableCell>
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
                              <Button variant="ghost" size="icon">
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
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingUnit(unit);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
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
              <div className="text-center py-12">
                <DoorOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay unidades</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Este edificio aún no tiene unidades registradas.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/propiedades/crear?buildingId=${buildingId}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera unidad
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la unidad{' '}
              <strong>{deletingUnit?.numero}</strong> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
}
