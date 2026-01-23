'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Home,
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Users,
  Euro,
  Edit,
  Trash2,
  FileText,
  Wrench,
  User,
  Phone,
  Mail,
  CalendarDays,
  DoorOpen,
  Ruler,
  BedDouble,
  Bath,
  MoreVertical,
  Plus,
  Eye,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import Link from 'next/link';

interface Tenant {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
}

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  rentaMensual: number;
  tenant?: Tenant;
  payments?: Payment[];
}

interface Payment {
  id: string;
  monto: number;
  fechaPago: string;
  estado: string;
  concepto: string;
}

interface MaintenanceRequest {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fechaSolicitud: string;
}

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  ciudad?: string;
}

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  modoAlquiler?: string;
  estado: string;
  superficie: number;
  habitaciones?: number;
  banos?: number;
  planta?: number;
  rentaMensual: number;
  descripcion?: string;
  aireAcondicionado?: boolean;
  calefaccion?: boolean;
  terraza?: boolean;
  balcon?: boolean;
  amueblado?: boolean;
  createdAt: string;
  updatedAt: string;
  building: Building;
  tenant?: Tenant;
  contracts: Contract[];
  maintenanceRequests: MaintenanceRequest[];
}

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const unitId = params?.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (unitId && status === 'authenticated') {
      fetchUnit();
    }
  }, [unitId, status]);

  const fetchUnit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/units/${unitId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Unidad no encontrada');
          router.push('/unidades');
          return;
        }
        throw new Error('Error al cargar unidad');
      }

      const data = await response.json();
      setUnit(data);
    } catch (error) {
      console.error('Error fetching unit:', error);
      toast.error('Error al cargar los datos de la unidad');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Unidad eliminada correctamente');
        router.push('/unidades');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar la unidad');
      }
    } catch (error) {
      toast.error('Error al eliminar la unidad');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      disponible: { variant: 'default', label: 'Disponible' },
      ocupada: { variant: 'secondary', label: 'Ocupada' },
      en_mantenimiento: { variant: 'destructive', label: 'En Mantenimiento' },
    };
    return estados[estado?.toLowerCase()] || { variant: 'outline' as const, label: estado };
  };

  const getModoAlquilerBadge = (modo?: string) => {
    const modos: Record<string, { className: string; label: string }> = {
      tradicional: { className: 'bg-gray-100 text-gray-700', label: 'Larga Duración' },
      media_estancia: { className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Media Estancia' },
      coliving: { className: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Coliving' },
    };
    return modos[modo || 'tradicional'] || modos.tradicional;
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      vivienda: 'Vivienda',
      local: 'Local Comercial',
      garaje: 'Garaje',
      trastero: 'Trastero',
      oficina: 'Oficina',
    };
    return tipos[tipo?.toLowerCase()] || tipo;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
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

  if (!unit) {
    return null;
  }

  const estadoBadge = getEstadoBadge(unit.estado);
  const modoBadge = getModoAlquilerBadge(unit.modoAlquiler);
  const activeContract = unit.contracts.find((c) => c.estado === 'activo');
  const currentTenant = activeContract?.tenant || unit.tenant;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/unidades')}
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
                <BreadcrumbLink href="/unidades">Unidades</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Unidad {unit.numero}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DoorOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Unidad {unit.numero}</h1>
                <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                <Badge variant="outline" className={modoBadge.className}>
                  {modoBadge.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building2 className="h-4 w-4" />
                <Link href={`/edificios/${unit.building.id}`} className="hover:underline">
                  {unit.building.nombre}
                </Link>
                {unit.building.direccion && (
                  <>
                    <span>•</span>
                    <MapPin className="h-4 w-4" />
                    <span>{unit.building.direccion}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/unidades/${unitId}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipo</CardTitle>
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTipoLabel(unit.tipo)}</div>
              {unit.planta !== undefined && unit.planta !== null && (
                <p className="text-xs text-muted-foreground">Planta {unit.planta}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Superficie</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unit.superficie} m²</div>
              <p className="text-xs text-muted-foreground">
                {unit.habitaciones || 0} hab. • {unit.banos || 0} baños
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renta Mensual</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(unit.rentaMensual)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(unit.rentaMensual / (unit.superficie || 1))}/m²
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inquilino</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {currentTenant ? (
                <>
                  <div className="text-lg font-bold truncate">
                    <Link href={`/inquilinos/${currentTenant.id}`} className="hover:underline">
                      {currentTenant.nombreCompleto}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{currentTenant.email}</p>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-muted-foreground">Sin inquilino</div>
                  <p className="text-xs text-muted-foreground">Unidad disponible</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="contracts">
              Contratos ({unit.contracts.length})
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              Mantenimiento ({unit.maintenanceRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Características */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Características</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Habitaciones:</span>
                      <span className="font-medium">{unit.habitaciones || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Baños:</span>
                      <span className="font-medium">{unit.banos || 0}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Equipamiento</h4>
                    <div className="flex flex-wrap gap-2">
                      {unit.aireAcondicionado && (
                        <Badge variant="outline">Aire Acondicionado</Badge>
                      )}
                      {unit.calefaccion && <Badge variant="outline">Calefacción</Badge>}
                      {unit.terraza && <Badge variant="outline">Terraza</Badge>}
                      {unit.balcon && <Badge variant="outline">Balcón</Badge>}
                      {unit.amueblado && <Badge variant="outline">Amueblado</Badge>}
                      {!unit.aireAcondicionado &&
                        !unit.calefaccion &&
                        !unit.terraza &&
                        !unit.balcon &&
                        !unit.amueblado && (
                          <span className="text-sm text-muted-foreground">
                            Sin equipamiento especificado
                          </span>
                        )}
                    </div>
                  </div>

                  {unit.descripcion && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Descripción</h4>
                        <p className="text-sm text-muted-foreground">{unit.descripcion}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Inquilino Actual */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inquilino Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentTenant ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{currentTenant.nombreCompleto}</p>
                          <p className="text-sm text-muted-foreground">Inquilino activo</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        {currentTenant.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${currentTenant.email}`} className="hover:underline">
                              {currentTenant.email}
                            </a>
                          </div>
                        )}
                        {currentTenant.telefono && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${currentTenant.telefono}`} className="hover:underline">
                              {currentTenant.telefono}
                            </a>
                          </div>
                        )}
                      </div>

                      {activeContract && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Contrato Activo</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Inicio:</span>
                                <span>{formatDate(activeContract.fechaInicio)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fin:</span>
                                <span>{formatDate(activeContract.fechaFin)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Renta:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(activeContract.rentaMensual)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/inquilinos/${currentTenant.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver perfil del inquilino
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">Sin inquilino asignado</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Esta unidad está disponible para alquiler
                      </p>
                      <Button onClick={() => router.push(`/contratos/nuevo?unitId=${unitId}`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear contrato
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Historial de Contratos
                    </CardTitle>
                    <CardDescription>
                      Todos los contratos asociados a esta unidad
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push(`/contratos/nuevo?unitId=${unitId}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Contrato
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {unit.contracts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inquilino</TableHead>
                        <TableHead>Fecha Inicio</TableHead>
                        <TableHead>Fecha Fin</TableHead>
                        <TableHead>Renta</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unit.contracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            {contract.tenant ? (
                              <Link
                                href={`/inquilinos/${contract.tenant.id}`}
                                className="hover:underline font-medium"
                              >
                                {contract.tenant.nombreCompleto}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(contract.fechaInicio)}</TableCell>
                          <TableCell>{formatDate(contract.fechaFin)}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(contract.rentaMensual)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                contract.estado === 'activo'
                                  ? 'default'
                                  : contract.estado === 'finalizado'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {contract.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/contratos/${contract.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Sin contratos</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Esta unidad aún no tiene contratos registrados.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push(`/contratos/nuevo?unitId=${unitId}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear primer contrato
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Solicitudes de Mantenimiento
                    </CardTitle>
                    <CardDescription>
                      Historial de incidencias y mantenimientos
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push(`/mantenimiento/nuevo?unitId=${unitId}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Solicitud
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {unit.maintenanceRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unit.maintenanceRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.titulo}</TableCell>
                          <TableCell>{formatDate(request.fechaSolicitud)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.prioridad === 'alta'
                                  ? 'destructive'
                                  : request.prioridad === 'media'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {request.prioridad}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.estado === 'completado'
                                  ? 'default'
                                  : request.estado === 'en_progreso'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {request.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/mantenimiento/${request.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Sin solicitudes</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Esta unidad no tiene solicitudes de mantenimiento.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push(`/mantenimiento/nuevo?unitId=${unitId}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear solicitud
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>Creado: {formatDate(unit.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Actualizado: {formatDate(unit.updatedAt)}</span>
                </div>
              </div>
              <span>ID: {unit.id.slice(0, 8)}...</span>
            </div>
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
              <strong>{unit.numero}</strong> del edificio{' '}
              <strong>{unit.building.nombre}</strong> permanentemente.
              {unit.contracts.length > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Esta unidad tiene {unit.contracts.length} contrato(s) asociado(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
