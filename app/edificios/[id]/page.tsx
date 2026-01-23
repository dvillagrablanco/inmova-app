'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Building2,
  Home,
  MapPin,
  Calendar,
  Users,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  TrendingUp,
  DoorOpen,
  Euro,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  superficie: number;
  habitaciones: number;
  banos: number;
  rentaMensual: number;
  estado: string;
  tenant?: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
  } | null;
  contracts?: Array<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
  }>;
}

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  anoConstructor: number;
  numeroUnidades: number;
  createdAt: string;
  updatedAt: string;
  units: Unit[];
}

export default function EdificioDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { canUpdate, canDelete, canCreate } = usePermissions();
  
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const buildingId = params?.id as string;

  useEffect(() => {
    if (buildingId && session) {
      fetchBuilding();
    }
  }, [buildingId, session]);

  const fetchBuilding = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/buildings/${buildingId}`);
      
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
    } catch (error) {
      logger.error('Error fetching building:', error);
      toast.error('Error al cargar el edificio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!building) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/buildings/${building.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar el edificio');
      }
      
      toast.success('Edificio eliminado exitosamente');
      router.push('/edificios');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMsg);
      logger.error('Error deleting building:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Calcular métricas
  const metrics = building ? {
    totalUnits: building.units.length,
    occupiedUnits: building.units.filter(u => u.estado === 'ocupada').length,
    availableUnits: building.units.filter(u => u.estado === 'disponible').length,
    monthlyIncome: building.units
      .filter(u => u.estado === 'ocupada')
      .reduce((sum, u) => sum + Number(u.rentaMensual || 0), 0),
    occupancyRate: building.units.length > 0 
      ? (building.units.filter(u => u.estado === 'ocupada').length / building.units.length) * 100 
      : 0,
  } : null;

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (!building) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Edificio no encontrado</h2>
            <p className="text-gray-500 mt-2">El edificio que buscas no existe o no tienes acceso.</p>
            <Link href="/edificios">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Edificios
              </Button>
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ocupada':
        return <Badge className="bg-green-100 text-green-800">Ocupada</Badge>;
      case 'disponible':
        return <Badge className="bg-blue-100 text-blue-800">Disponible</Badge>;
      case 'mantenimiento':
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>;
      case 'reservada':
        return <Badge className="bg-purple-100 text-purple-800">Reservada</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
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

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/edificios">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Building2 className="h-8 w-8 text-indigo-600" />
                {building.nombre}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{building.direccion}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {canCreate && (
              <Link href={`/unidades/nuevo?buildingId=${building.id}`}>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Unidad
                </Button>
              </Link>
            )}
            {canUpdate && (
              <Link href={`/edificios/${building.id}/editar`}>
                <Button variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button 
                variant="destructive" 
                className="gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-semibold capitalize">{building.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Año de Construcción</p>
                <p className="font-semibold">{building.anoConstructor || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidades Registradas</p>
                <p className="font-semibold">{building.numeroUnidades}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidades Creadas</p>
                <p className="font-semibold">{building.units.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUnits}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.occupiedUnits}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                <XCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.availableUnits}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{metrics.monthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ocupación: {metrics.occupancyRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Unidades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DoorOpen className="h-5 w-5" />
                  Unidades del Edificio
                </CardTitle>
                <CardDescription>
                  {building.units.length} unidades registradas
                </CardDescription>
              </div>
              {canCreate && (
                <Link href={`/unidades/nuevo?buildingId=${building.id}`}>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Añadir Unidad
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {building.units.length === 0 ? (
              <div className="text-center py-12">
                <DoorOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No hay unidades registradas en este edificio</p>
                {canCreate && (
                  <Link href={`/unidades/nuevo?buildingId=${building.id}`}>
                    <Button className="mt-4" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primera Unidad
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Superficie</TableHead>
                      <TableHead>Hab/Baños</TableHead>
                      <TableHead>Renta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Inquilino</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {building.units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.numero}</TableCell>
                        <TableCell className="capitalize">{unit.tipo}</TableCell>
                        <TableCell>{unit.superficie} m²</TableCell>
                        <TableCell>{unit.habitaciones}/{unit.banos}</TableCell>
                        <TableCell>€{Number(unit.rentaMensual || 0).toLocaleString('es-ES')}</TableCell>
                        <TableCell>{getEstadoBadge(unit.estado)}</TableCell>
                        <TableCell>
                          {unit.tenant ? (
                            <Link 
                              href={`/inquilinos/${unit.tenant.id}`}
                              className="text-indigo-600 hover:underline"
                            >
                              {unit.tenant.nombre} {unit.tenant.apellidos}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/unidades/${unit.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </DropdownMenuItem>
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => router.push(`/unidades/${unit.id}/editar`)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="¿Eliminar edificio?"
        itemName={building.nombre}
        description={`Se eliminará el edificio "${building.nombre}" y todas sus unidades asociadas. Esta acción no se puede deshacer.`}
      />
    </AuthenticatedLayout>
  );
}
