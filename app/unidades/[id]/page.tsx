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
  Home,
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  Users,
  Euro,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Bed,
  Bath,
  Maximize,
  Layers,
  FileText,
  Brain,
  Phone,
  Mail,
  User,
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

interface Tenant {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  dni: string;
}

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  ciudad?: string;
}

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  estado: string;
}

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  estado: string;
  superficie: number;
  superficieUtil?: number;
  habitaciones: number;
  banos: number;
  planta?: number;
  orientacion?: string;
  rentaMensual: number;
  aireAcondicionado: boolean;
  calefaccion: boolean;
  terraza: boolean;
  balcon: boolean;
  amueblado: boolean;
  imagenes: string[];
  buildingId: string;
  building?: Building;
  tenant?: Tenant;
  contracts?: Contract[];
  createdAt: string;
  updatedAt: string;
}

export default function UnitDetailPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const unitId = params?.id as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && unitId) {
      fetchUnit();
    }
  }, [status, unitId]);

  const fetchUnit = async () => {
    try {
      const response = await fetch(`/api/units/${unitId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Unidad no encontrada');
          router.push('/unidades');
          return;
        }
        throw new Error('Error al cargar la unidad');
      }

      const data = await response.json();
      setUnit(data);
    } catch (error: any) {
      console.error('Error fetching unit:', error);
      toast.error(error.message || 'Error al cargar la unidad');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!unit) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la unidad');
      }

      toast.success('Unidad eliminada correctamente');
      router.push('/unidades');
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      toast.error(error.message || 'Error al eliminar la unidad');
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

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando unidad...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!unit) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unidad no encontrada</h2>
            <p className="text-muted-foreground mb-4">
              La unidad que buscas no existe o no tienes acceso.
            </p>
            <Button onClick={() => router.push('/unidades')}>
              Volver a Unidades
            </Button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
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
                <BreadcrumbLink href="/unidades">Unidades</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Unidad {unit.numero}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Home className="h-8 w-8 text-primary" />
                  Unidad {unit.numero}
                </h1>
                <Badge className={getEstadoColor(unit.estado)}>{unit.estado}</Badge>
              </div>
              {unit.building && (
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {unit.building.nombre} - {unit.building.direccion}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/valoracion-ia?unitId=${unit.id}`)}
              >
                <Brain className="h-4 w-4 mr-2" />
                Valorar con IA
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/unidades/${unit.id}/editar`)}
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
                    <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todos los datos
                      asociados a esta unidad.
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

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Maximize className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Superficie</p>
                  <p className="text-2xl font-bold">{unit.superficie} m²</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Bed className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Habitaciones</p>
                  <p className="text-2xl font-bold">{unit.habitaciones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Bath className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Baños</p>
                  <p className="text-2xl font-bold">{unit.banos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Euro className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renta mensual</p>
                  <p className="text-2xl font-bold">{formatCurrency(unit.rentaMensual)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="tenant">Inquilino</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
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
                      <p className="font-medium">{unit.tipo || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Planta</p>
                      <p className="font-medium">{unit.planta ?? 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Orientación</p>
                      <p className="font-medium">{unit.orientacion || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Superficie útil</p>
                      <p className="font-medium">
                        {unit.superficieUtil ? `${unit.superficieUtil} m²` : 'No especificada'}
                      </p>
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
                      {unit.aireAcondicionado ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={unit.aireAcondicionado ? '' : 'text-muted-foreground'}>
                        Aire acondicionado
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unit.calefaccion ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={unit.calefaccion ? '' : 'text-muted-foreground'}>
                        Calefacción
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unit.terraza ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={unit.terraza ? '' : 'text-muted-foreground'}>Terraza</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unit.balcon ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={unit.balcon ? '' : 'text-muted-foreground'}>Balcón</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unit.amueblado ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={unit.amueblado ? '' : 'text-muted-foreground'}>Amueblado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edificio */}
              {unit.building && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edificio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{unit.building.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {unit.building.direccion}
                          {unit.building.ciudad && `, ${unit.building.ciudad}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/edificios/${unit.building?.id}`)}
                    >
                      Ver edificio
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Fechas */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del registro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fecha de creación</span>
                    <span className="font-medium">
                      {new Date(unit.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Última actualización</span>
                    <span className="font-medium">
                      {new Date(unit.updatedAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tenant" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inquilino actual</CardTitle>
                <CardDescription>
                  Información del inquilino asignado a esta unidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unit.tenant ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold">{unit.tenant.nombreCompleto}</p>
                        <p className="text-muted-foreground">DNI: {unit.tenant.dni}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{unit.tenant.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Teléfono</p>
                          <p className="font-medium">{unit.tenant.telefono}</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => router.push(`/inquilinos/${unit.tenant?.id}`)}
                    >
                      Ver perfil completo
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin inquilino</h3>
                    <p className="text-muted-foreground mb-4">
                      Esta unidad no tiene un inquilino asignado actualmente.
                    </p>
                    <Button onClick={() => router.push(`/contratos/nuevo?unitId=${unit.id}`)}>
                      Crear contrato
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contratos</CardTitle>
                  <CardDescription>Historial de contratos de esta unidad</CardDescription>
                </div>
                <Button onClick={() => router.push(`/contratos/nuevo?unitId=${unit.id}`)}>
                  Nuevo contrato
                </Button>
              </CardHeader>
              <CardContent>
                {unit.contracts && unit.contracts.length > 0 ? (
                  <div className="space-y-4">
                    {unit.contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {new Date(contract.fechaInicio).toLocaleDateString('es-ES')} -{' '}
                            {new Date(contract.fechaFin).toLocaleDateString('es-ES')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(contract.rentaMensual)}/mes
                          </p>
                        </div>
                        <Badge>{contract.estado}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin contratos</h3>
                    <p className="text-muted-foreground">
                      No hay contratos registrados para esta unidad.
                    </p>
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
                  <CardDescription>Documentos asociados a esta unidad</CardDescription>
                </div>
                <Button variant="outline">Subir documento</Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin documentos</h3>
                  <p className="text-muted-foreground">
                    No hay documentos asociados a esta unidad.
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

