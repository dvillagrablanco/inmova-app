'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  Home,
  Building2,
  Plus,
  Search,
  Users,
  Bed,
  Euro,
  DoorOpen,
  Eye,
  Pencil,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import Link from 'next/link';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface ColivingUnit {
  id: string;
  numero: string;
  tipo: string;
  superficie: number;
  precioMensual: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';
  amenities: string[];
  property?: {
    id: string;
    nombre: string;
    direccion: string;
  };
  tenant?: {
    id: string;
    nombre: string;
    apellidos: string;
  };
}

export default function ColivingUnidadesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate } = usePermissions();
  const [units, setUnits] = useState<ColivingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUnits();
    }
  }, [status, router]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      // Usar la API de unidades con filtro para coliving
      const res = await fetch('/api/units?tipo=coliving');
      if (res.ok) {
        const data = await res.json();
        setUnits(Array.isArray(data) ? data : data.data || []);
      } else {
        // Si no hay unidades específicas de coliving, mostrar todas las habitaciones
        const resAll = await fetch('/api/units');
        if (resAll.ok) {
          const dataAll = await resAll.json();
          const allUnits = Array.isArray(dataAll) ? dataAll : dataAll.data || [];
          // Filtrar solo habitaciones/estudios que podrían ser coliving
          setUnits(allUnits.filter((u: ColivingUnit) => 
            u.tipo?.toLowerCase().includes('habitacion') || 
            u.tipo?.toLowerCase().includes('estudio') ||
            u.tipo?.toLowerCase().includes('suite') ||
            u.tipo?.toLowerCase().includes('coliving')
          ));
        }
      }
    } catch (error) {
      logger.error('Error fetching coliving units:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter((u) =>
    u.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.property?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Métricas
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.estado === 'ocupada').length;
  const availableUnits = units.filter(u => u.estado === 'disponible').length;
  const avgPrice = units.length > 0
    ? units.reduce((sum, u) => sum + (u.precioMensual || 0), 0) / units.length
    : 0;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ocupada':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Ocupada</Badge>;
      case 'disponible':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"><DoorOpen className="h-3 w-3 mr-1" />Disponible</Badge>;
      case 'mantenimiento':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"><Clock className="h-3 w-3 mr-1" />Mantenimiento</Badge>;
      case 'reservada':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"><Clock className="h-3 w-3 mr-1" />Reservada</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando unidades de living...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
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
              <BreadcrumbLink href="/coliving/propiedades">Coliving</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Unidades de Living</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <DoorOpen className="h-8 w-8 text-purple-600" />
              Unidades de Living
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las habitaciones y espacios de tus propiedades coliving
            </p>
          </div>
          {canCreate && (
            <Link href="/unidades/nuevo?tipo=coliving">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Unidad
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{occupiedUnits}</div>
              <p className="text-xs text-muted-foreground">
                {occupancyRate.toFixed(1)}% ocupación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <DoorOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{availableUnits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precio Medio</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{avgPrice.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground">por mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar unidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Units Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Listado de Unidades
            </CardTitle>
            <CardDescription>
              {filteredUnits.length} unidades encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUnits.length === 0 ? (
              <div className="text-center py-12">
                <Bed className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No hay unidades de living registradas</p>
                {canCreate && (
                  <Link href="/unidades/nuevo?tipo=coliving">
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
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Superficie</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Inquilino</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.numero}</TableCell>
                        <TableCell>
                          {unit.property ? (
                            <Link 
                              href={`/coliving/propiedades/${unit.property.id}`}
                              className="text-purple-600 hover:underline"
                            >
                              {unit.property.nombre}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">{unit.tipo}</TableCell>
                        <TableCell>{unit.superficie} m²</TableCell>
                        <TableCell>€{Number(unit.precioMensual || 0).toLocaleString('es-ES')}/mes</TableCell>
                        <TableCell>{getEstadoBadge(unit.estado)}</TableCell>
                        <TableCell>
                          {unit.tenant ? (
                            <Link 
                              href={`/inquilinos/${unit.tenant.id}`}
                              className="text-purple-600 hover:underline"
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
    </AuthenticatedLayout>
  );
}
