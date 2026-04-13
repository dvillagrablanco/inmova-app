// @ts-nocheck
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
  CreditCard,
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
import { PhotoGallery } from '@/components/ui/photo-gallery';
import { EntityDocuments } from '@/components/ui/entity-documents';
import { PropertyMap } from '@/components/property/PropertyMap';
import { CatastroPlanoViewer } from '@/components/property/CatastroPlanoViewer';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';
import { cn, formatUnitTipoLabel } from '@/lib/utils';

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

/** Extrae ciudad desde dirección tipo "calle, CP ciudad" y quita comas finales. */
function ciudadFromDireccion(direccion: string): string {
  const parts = direccion
    .split(',')
    .map((p) => p.trim().replace(/,+$/, '').trim())
    .filter(Boolean);
  if (parts.length < 2) return '';
  const last = parts[parts.length - 1];
  const cpCity = last.match(/^\d{5}\s+(.+)$/);
  if (cpCity) return cpCity[1].replace(/,+$/, '').trim();
  return last.replace(/,+$/, '').trim();
}

interface BuildingDetails {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  referenciaCatastral?: string;
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
  const [images, setImages] = useState<string[]>([]);
  const [noiData, setNoiData] = useState<{
    ingresoAnual: number;
    gastosOperativos: number;
    noi: number;
    desglose: Array<{ tipo: string; importe: number }>;
  } | null>(null);
  const [buildingPayments, setBuildingPayments] = useState<any[]>([]);

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
          setImages(data.imagenes || []);

          try {
            const payRes = await fetch(`/api/payments?buildingId=${buildingId}`);
            if (payRes.ok) {
              const payJson = await payRes.json();
              const list = Array.isArray(payJson) ? payJson : payJson.data || [];
              setBuildingPayments(list);
            } else {
              setBuildingPayments([]);
            }
          } catch {
            setBuildingPayments([]);
          }
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

  // Cargar datos de rentabilidad contable (NOI)
  useEffect(() => {
    if (!building) return;
    const fetchNoi = async () => {
      try {
        const res = await fetch(`/api/accounting/enrichment?type=noi`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.data) return;

        const nombre = (building.nombre + ' ' + building.direccion).toLowerCase();
        const keywords = nombre
          .replace(/[,./]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length > 3);

        // Match income entries by building name/address
        let ingresoAnual = 0;
        for (const ing of data.data.ingresos || []) {
          const t = (ing.inmueble || '').toLowerCase();
          if (keywords.some((k: string) => t.includes(k))) {
            ingresoAnual += ing.ingresoAnual || 0;
          }
        }

        // Match expense entries
        let gastosOperativos = 0;
        const desglose: Array<{ tipo: string; importe: number }> = [];
        const gastosPorTipo: Record<string, number> = {};
        for (const g of data.data.gastos || []) {
          const t = (g.inmueble || '').toLowerCase();
          if (keywords.some((k: string) => t.includes(k))) {
            gastosOperativos += g.gastoAnual || 0;
            const tipo = g.tipoGasto || 'Otros';
            gastosPorTipo[tipo] = (gastosPorTipo[tipo] || 0) + (g.gastoAnual || 0);
          }
        }
        for (const [tipo, importe] of Object.entries(gastosPorTipo)) {
          desglose.push({ tipo, importe });
        }
        desglose.sort((a, b) => b.importe - a.importe);

        if (ingresoAnual > 0 || gastosOperativos > 0) {
          setNoiData({
            ingresoAnual,
            gastosOperativos,
            noi: ingresoAnual - gastosOperativos,
            desglose,
          });
        }
      } catch {
        // Silently fail — enrichment is optional
      }
    };
    fetchNoi();
  }, [building]);

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

  const handleImagesChange = async (newImages: string[]) => {
    setImages(newImages);
    try {
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenes: newImages }),
      });
      if (!response.ok) throw new Error('Error al guardar las fotos');
      setBuilding((prev) => (prev ? { ...prev, imagenes: newImages } : null));
      toast.success('Fotos actualizadas');
    } catch (error) {
      toast.error('Error al guardar las fotos');
      setImages(building?.imagenes || []);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const badges: Record<
      string,
      { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }
    > = {
      residencial: { variant: 'default', label: 'Residencial' },
      comercial: { variant: 'secondary', label: 'Comercial' },
      mixto: { variant: 'outline', label: 'Mixto' },
      industrial: { variant: 'destructive', label: 'Industrial' },
    };
    return badges[tipo?.toLowerCase()] || { variant: 'default', label: tipo };
  };

  const getEstadoUnidadBadge = (estado: string) => {
    const badges: Record<
      string,
      { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }
    > = {
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

    const ocupadas = building.units.filter((u) => u.estado?.toLowerCase() === 'ocupada').length;
    const disponibles = building.units.filter(
      (u) => u.estado?.toLowerCase() === 'disponible'
    ).length;
    const ingresos = building.units
      .filter((u) => u.estado?.toLowerCase() === 'ocupada')
      .reduce((acc, u) => acc + (u.rentaMensual || 0), 0);
    const ocupacionPct = building.units.length > 0 ? (ocupadas / building.units.length) * 100 : 0;

    const enMantenimiento = building.units.filter(
      (u) => u.estado?.toLowerCase() === 'en_mantenimiento'
    ).length;
    const superficieTotal = building.units.reduce((acc, u) => acc + (u.superficie || 0), 0);
    const yieldEstimado =
      superficieTotal > 0 && ingresos > 0 ? ((ingresos * 12) / (superficieTotal * 4500)) * 100 : 0;

    return {
      ocupadas,
      disponibles,
      enMantenimiento,
      ingresos,
      ocupacionPct,
      superficieTotal,
      yieldEstimado,
    };
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
  const ciudadLine = ciudadFromDireccion(building.direccion || '');

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
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
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight break-words">
                {building.nombre}
              </h1>
              <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">{building.direccion}</span>
            </div>
            {building.anoConstructor > 0 && (
              <p className="text-sm text-muted-foreground">
                Construido en {building.anoConstructor}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="sm:size-default"
              onClick={() => router.push(`/edificios/${building.id}/editar`)}
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 sm:size-default"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {building.units?.length || building.numeroUnidades}
              </div>
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
              <p className="text-xs text-muted-foreground">
                {metrics.ocupacionPct.toFixed(1)}% ocupación
              </p>
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

        {/* Rentabilidad Contable (NOI) */}
        {noiData && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Rentabilidad Contable (2025)
                </CardTitle>
                <Badge variant={noiData.noi > 0 ? 'default' : 'destructive'}>
                  NOI: {noiData.noi > 0 ? '+' : ''}
                  {noiData.noi.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  })}
                </Badge>
              </div>
              <CardDescription>Datos reales de contabilidad (Zucchetti)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {noiData.ingresoAnual.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Ingresos/año</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">
                    {noiData.gastosOperativos.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Gastos/año</p>
                </div>
                <div className="text-center">
                  <p
                    className={`text-lg font-bold ${noiData.noi > 0 ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {noiData.noi.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">NOI</p>
                </div>
              </div>
              {noiData.desglose.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Desglose gastos:</p>
                  {noiData.desglose.slice(0, 5).map((g, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{g.tipo}</span>
                      <span className="font-medium">
                        {g.importe.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Galería de Imágenes */}
            <PhotoGallery
              images={images}
              onImagesChange={handleImagesChange}
              folder="buildings"
              title="Fotos del edificio"
              description="Sube fotos para documentar el estado del edificio"
              editable={true}
            />

            <EntityDocuments entityType="building" entityId={buildingId} className="mt-6" />

            {/* Lista de Unidades */}
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Unidades del Edificio</CardTitle>
                  <CardDescription>
                    {building.units?.length || 0} unidades registradas
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(`/propiedades/crear?buildingId=${building.id}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Unidad
                </Button>
              </CardHeader>
              <CardContent>
                {building.units && building.units.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="min-w-[600px] sm:min-w-0 px-4 sm:px-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Unidad</TableHead>
                            <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="hidden md:table-cell">Superficie</TableHead>
                            <TableHead>Renta</TableHead>
                            <TableHead className="hidden lg:table-cell">Inquilino</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {building.units.map((unit) => {
                            const estadoBadge = getEstadoUnidadBadge(unit.estado);
                            return (
                              <TableRow
                                key={unit.id}
                                className="cursor-pointer"
                                onClick={() => router.push(`/propiedades/${unit.id}`)}
                              >
                                <TableCell className="font-medium">
                                  <div>{unit.numero}</div>
                                  <div className="text-xs text-muted-foreground sm:hidden">
                                    {formatUnitTipoLabel(unit.tipo)}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {formatUnitTipoLabel(unit.tipo)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={estadoBadge.variant} className="text-xs">
                                    {estadoBadge.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {unit.superficie}m²
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  €{unit.rentaMensual?.toLocaleString('es-ES') || 0}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  {unit.tenant ? (
                                    <Link
                                      href={`/inquilinos/${unit.tenant.id}`}
                                      className="text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
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
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
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
                                        onClick={() =>
                                          router.push(`/propiedades/${unit.id}/editar`)
                                        }
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
                    </div>
                  </div>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cobros del Edificio
                </CardTitle>
                <CardDescription>Pagos asociados a las unidades de este edificio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {buildingPayments.length} pagos registrados
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/pagos/nuevo?buildingId=${buildingId}`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Registrar Cobro
                  </Button>
                </div>
                {buildingPayments.length > 0 ? (
                  <div className="divide-y">
                    {buildingPayments.slice(0, 10).map((p: any) => (
                      <div key={p.id} className="py-2 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">
                            {p.contract?.tenant?.nombreCompleto || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.periodo} · {p.contract?.unit?.numero || ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            €{Number(p.monto || 0).toLocaleString('es-ES')}
                          </p>
                          <Badge
                            variant={
                              p.estado === 'pagado'
                                ? 'default'
                                : p.estado === 'atrasado'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {p.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay pagos registrados
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Características del Edificio */}
            <Card>
              <CardHeader>
                <CardTitle>Equipamiento y Servicios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-3">
                  {[
                    { label: 'Ascensor', value: building.ascensor, icon: Building2 },
                    { label: 'Garaje', value: building.garaje, icon: Car },
                    { label: 'Trastero', value: building.trastero, icon: Warehouse },
                    { label: 'Piscina', value: building.piscina, icon: Droplet },
                    { label: 'Jardín', value: building.jardin, icon: TreePine },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <Icon
                          className={`h-5 w-5 flex-shrink-0 ${item.value ? 'text-green-600' : 'text-muted-foreground'}`}
                        />
                        <span
                          className={cn(
                            'text-sm',
                            item.value
                              ? 'text-green-700 font-medium'
                              : 'text-muted-foreground line-through'
                          )}
                        >
                          {item.value ? '✓ ' : ''}
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
          <div className="space-y-4 sm:space-y-6">
            {/* Mapa de Ubicación */}
            <PropertyMap
              address={building.direccion}
              city={ciudadLine || undefined}
              latitude={building.latitud ?? undefined}
              longitude={building.longitud ?? undefined}
            />

            {/* Plano Catastral */}
            <CatastroPlanoViewer
              referenciaCatastral={building.referenciaCatastral}
              latitud={building.latitud}
              longitud={building.longitud}
            />

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
                      description: `Ingresos: €${rentaAnual.toLocaleString('es-ES')}/año - Gastos: €${gastos.toLocaleString('es-ES')}/año = €${netAnual.toLocaleString('es-ES')}/año neto`,
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
      <AIDocumentAssistant />
    </AuthenticatedLayout>
  );
}
