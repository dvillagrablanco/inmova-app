'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  Laptop, Users, Calendar, Euro, Building2, MapPin,
  Wifi, Coffee, Monitor, Car, CheckCircle2, Clock
} from 'lucide-react';

interface Space {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  capacidad: number;
  equipamiento: string[];
  tarifaHora?: number;
  tarifaDia?: number;
  tarifaMes?: number;
  activo: boolean;
  building?: {
    id: string;
    nombre: string;
    direccion: string;
  };
}

interface Member {
  id: string;
  nombre: string;
  email: string;
  tipoMembresia: string;
  fechaInicio: string;
  fechaFin?: string;
  activo: boolean;
}

interface Stats {
  totalSpaces: number;
  spacesActivos: number;
  totalMembers: number;
  ocupacionHoy: number;
}

export default function EspaciosCoworkingPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Cargar espacios
      const spacesRes = await fetch('/api/workspace/spaces');
      if (spacesRes.ok) {
        const data = await spacesRes.json();
        setSpaces(data.data || []);
      }

      // Cargar miembros
      const membersRes = await fetch('/api/workspace/members');
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.data || []);
      }

      // Cargar stats
      const statsRes = await fetch('/api/workspace/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos de coworking');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getTipoBadge = (tipo: string) => {
    const tipoConfig: Record<string, { label: string; color: string }> = {
      hot_desk: { label: 'Hot Desk', color: 'bg-blue-100 text-blue-700' },
      dedicated_desk: { label: 'Puesto Fijo', color: 'bg-green-100 text-green-700' },
      private_office: { label: 'Oficina Privada', color: 'bg-purple-100 text-purple-700' },
      meeting_room: { label: 'Sala Reuniones', color: 'bg-yellow-100 text-yellow-700' },
      event_space: { label: 'Espacio Eventos', color: 'bg-pink-100 text-pink-700' },
    };
    const config = tipoConfig[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-0.5 text-xs rounded-full ${config.color}`}>{config.label}</span>;
  };

  const getEquipamientoIcon = (eq: string) => {
    const icons: Record<string, React.ReactNode> = {
      wifi: <Wifi className="h-4 w-4" />,
      monitor: <Monitor className="h-4 w-4" />,
      coffee: <Coffee className="h-4 w-4" />,
      parking: <Car className="h-4 w-4" />,
    };
    return icons[eq.toLowerCase()] || <CheckCircle2 className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Espacios de Coworking</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Laptop className="h-6 w-6 text-blue-500" />
              Espacios de Coworking
            </h1>
            <p className="text-muted-foreground">
              Gestión de espacios de trabajo flexibles
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/workspace/booking">
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Reservar
              </Button>
            </Link>
            <Link href="/workspace/members">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Miembros
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats?.totalSpaces || spaces.length}</div>
              <div className="text-sm text-muted-foreground">Total Espacios</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats?.spacesActivos || 0}</div>
              <div className="text-sm text-muted-foreground">Activos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalMembers || members.length}</div>
              <div className="text-sm text-muted-foreground">Miembros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">{stats?.ocupacionHoy || 0}%</div>
              <div className="text-sm text-muted-foreground">Ocupación Hoy</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/workspace/dashboard">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="font-medium">Dashboard</div>
                  <div className="text-sm text-muted-foreground">Vista general</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/workspace/coworking">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <Laptop className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium">Coworking</div>
                  <div className="text-sm text-muted-foreground">Puestos trabajo</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/salas-reuniones">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="font-medium">Salas</div>
                  <div className="text-sm text-muted-foreground">Reservar sala</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/workspace/booking">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="font-medium">Reservas</div>
                  <div className="text-sm text-muted-foreground">Mis reservas</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Spaces Grid */}
        {spaces.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Laptop className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay espacios configurados</h3>
                <p className="text-muted-foreground mb-4">
                  Configura tus espacios de coworking
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <Card key={space.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{space.nombre}</CardTitle>
                      {space.building && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {space.building.direccion}
                        </CardDescription>
                      )}
                    </div>
                    {getTipoBadge(space.tipo)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {space.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {space.descripcion}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {space.capacidad} personas
                    </span>
                    <Badge variant={space.activo ? 'default' : 'secondary'}>
                      {space.activo ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </div>

                  {space.equipamiento && space.equipamiento.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {space.equipamiento.slice(0, 4).map((eq, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {getEquipamientoIcon(eq)}
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm">
                      {space.tarifaHora && (
                        <span className="font-medium">{formatCurrency(space.tarifaHora)}/hora</span>
                      )}
                      {space.tarifaDia && (
                        <span className="text-muted-foreground ml-2">
                          {formatCurrency(space.tarifaDia)}/día
                        </span>
                      )}
                    </div>
                    <Link href={`/workspace/booking?spaceId=${space.id}`}>
                      <Button size="sm">Reservar</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Members Section */}
        {members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Miembros Activos
              </CardTitle>
              <CardDescription>
                {members.filter(m => m.activo).length} miembros activos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {members.slice(0, 8).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-medium text-blue-600">
                        {member.nombre.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{member.nombre}</div>
                      <div className="text-xs text-muted-foreground">{member.tipoMembresia}</div>
                    </div>
                    <Badge variant={member.activo ? 'default' : 'secondary'} className="text-xs">
                      {member.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                ))}
              </div>
              {members.length > 8 && (
                <div className="mt-4 text-center">
                  <Link href="/workspace/members">
                    <Button variant="outline">Ver todos los miembros</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
