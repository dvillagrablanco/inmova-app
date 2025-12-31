'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
  UserPlus,
  Building2,
  Calendar,
  ArrowLeft,
  Search,
  MoreVertical,
  Eye,
  CalendarClock,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Home,
} from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import logger, { logError } from '@/lib/logger';

interface Candidate {
  id: string;
  nombreCompleto: string;
  dni: string;
  email: string;
  telefono: string | null;
  fechaNacimiento: string;
  situacionLaboral: string | null;
  ingresosMensuales: number | null;
  scoring: number;
  estado: string;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  unit: {
    id: string;
    numero: string;
    building: {
      id: string;
      nombre: string;
    };
  } | null;
  visits?: any[];
}

export default function CandidatosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate } = usePermissions();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [scoringFilter, setScoringFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCandidates();
    }
  }, [status]);

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (error) {
      logger.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de candidatos
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      // Filtro por búsqueda (nombre, email, DNI, edificio)
      const matchesSearch =
        searchTerm === '' ||
        candidate.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.unit?.building?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por estado
      const matchesEstado = estadoFilter === 'all' || candidate.estado === estadoFilter;

      // Filtro por scoring
      let matchesScoring = true;
      if (scoringFilter === 'alto') {
        matchesScoring = candidate.scoring >= 80;
      } else if (scoringFilter === 'medio') {
        matchesScoring = candidate.scoring >= 60 && candidate.scoring < 80;
      } else if (scoringFilter === 'bajo') {
        matchesScoring = candidate.scoring < 60;
      }

      return matchesSearch && matchesEstado && matchesScoring;
    });
  }, [candidates, searchTerm, estadoFilter, scoringFilter]);

  // Cálculo de estadísticas
  const stats = useMemo(() => {
    return {
      total: candidates.length,
      nuevos: candidates.filter((c) => c.estado === 'nuevo').length,
      enRevision: candidates.filter((c) => c.estado === 'en_revision').length,
      aprobados: candidates.filter((c) => c.estado === 'aprobado').length,
    };
  }, [candidates]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
            <LoadingState message="Cargando candidatos..." />
          </AuthenticatedLayout>
    );
  }

  if (!session) {
    return null;
  }

  const getEstadoBadgeVariant = (estado: string) => {
    const variants: Record<string, string> = {
      nuevo: 'bg-blue-500 text-white hover:bg-blue-600',
      en_revision: 'bg-yellow-500 text-white hover:bg-yellow-600',
      preseleccionado: 'bg-purple-500 text-white hover:bg-purple-600',
      aprobado: 'bg-green-500 text-white hover:bg-green-600',
      rechazado: 'bg-red-500 text-white hover:bg-red-600',
    };
    return variants[estado] || 'bg-muted';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      nuevo: 'Nuevo',
      en_revision: 'En Revisión',
      preseleccionado: 'Preseleccionado',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
    };
    return labels[estado] || estado;
  };

  const getScoringColor = (scoring: number) => {
    if (scoring >= 80) return 'text-green-600 font-bold';
    if (scoring >= 60) return 'text-yellow-600 font-bold';
    if (scoring >= 40) return 'text-orange-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
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
                    <BreadcrumbPage>Candidatos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Candidatos</h1>
                <p className="text-muted-foreground">Gestión de candidatos a inquilinos</p>
              </div>
              {canCreate && (
                <Button onClick={() => router.push('/candidatos/nuevo')}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Candidato
                </Button>
              )}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Candidatos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Nuevos
                  </CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.nuevos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    En Revisión
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enRevision}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Aprobados
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.aprobados}</div>
                </CardContent>
              </Card>
            </div>

            {/* Búsqueda y Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Buscar Candidatos</CardTitle>
                <CardDescription>
                  Filtra candidatos por nombre, email, estado o puntuación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, email, DNI o edificio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="en_revision">En Revisión</SelectItem>
                      <SelectItem value="preseleccionado">Preseleccionado</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={scoringFilter} onValueChange={setScoringFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Puntuación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las puntuaciones</SelectItem>
                      <SelectItem value="alto">Alta (80-100)</SelectItem>
                      <SelectItem value="medio">Media (60-79)</SelectItem>
                      <SelectItem value="bajo">Baja (&lt;60)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Chips */}
                <FilterChips
                  filters={[
                    ...(searchTerm
                      ? [
                          {
                            id: 'search',
                            label: 'Búsqueda',
                            value: searchTerm,
                          },
                        ]
                      : []),
                    ...(estadoFilter !== 'all'
                      ? [
                          {
                            id: 'estado',
                            label: 'Estado',
                            value: getEstadoLabel(estadoFilter),
                          },
                        ]
                      : []),
                    ...(scoringFilter !== 'all'
                      ? [
                          {
                            id: 'scoring',
                            label: 'Puntuación',
                            value:
                              scoringFilter === 'alto'
                                ? 'Alta (80-100)'
                                : scoringFilter === 'medio'
                                  ? 'Media (60-79)'
                                  : 'Baja (<60)',
                          },
                        ]
                      : []),
                  ]}
                  onRemove={(id) => {
                    if (id === 'search') setSearchTerm('');
                    else if (id === 'estado') setEstadoFilter('all');
                    else if (id === 'scoring') setScoringFilter('all');
                  }}
                  onClearAll={() => {
                    setSearchTerm('');
                    setEstadoFilter('all');
                    setScoringFilter('all');
                  }}
                />
              </CardContent>
            </Card>

            {/* Lista de Candidatos */}
            <div className="space-y-4">
              {filteredCandidates.length === 0 ? (
                <EmptyState
                  icon={<UserPlus className="h-12 w-12" />}
                  title={
                    searchTerm || estadoFilter !== 'all' || scoringFilter !== 'all'
                      ? 'No se encontraron candidatos'
                      : 'No hay candidatos registrados'
                  }
                  description={
                    searchTerm || estadoFilter !== 'all' || scoringFilter !== 'all'
                      ? 'No se encontraron candidatos con los filtros aplicados. Intenta ajustar tu búsqueda.'
                      : 'Comienza registrando tu primer candidato a inquilino para gestionar el proceso de selección.'
                  }
                  action={
                    canCreate && !searchTerm && estadoFilter === 'all' && scoringFilter === 'all'
                      ? {
                          label: 'Registrar Primer Candidato',
                          onClick: () => router.push('/candidatos/nuevo'),
                          icon: <UserPlus className="h-4 w-4" />,
                        }
                      : undefined
                  }
                />
              ) : (
                filteredCandidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {getInitials(candidate.nombreCompleto)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Información Principal */}
                        <div className="flex-1 space-y-3">
                          {/* Nombre y Estado */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="text-lg font-semibold break-words">
                              {candidate.nombreCompleto}
                            </h3>
                            <Badge className={getEstadoBadgeVariant(candidate.estado)}>
                              {getEstadoLabel(candidate.estado)}
                            </Badge>
                          </div>

                          {/* Información de Contacto */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{candidate.email}</span>
                            </div>
                            {candidate.telefono && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{candidate.telefono}</span>
                              </div>
                            )}
                          </div>

                          {/* Unidad y Fecha */}
                          {candidate.unit && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 flex-shrink-0 text-primary" />
                                <span className="font-medium">
                                  {candidate.unit.building.nombre} - Unidad {candidate.unit.numero}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Información Adicional */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Scoring
                              </div>
                              <div className={getScoringColor(candidate.scoring)}>
                                {candidate.scoring}/100
                              </div>
                            </div>
                            {candidate.situacionLaboral && (
                              <div className="space-y-1">
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  Empleo
                                </div>
                                <div className="font-medium truncate">
                                  {candidate.situacionLaboral}
                                </div>
                              </div>
                            )}
                            {candidate.ingresosMensuales && (
                              <div className="space-y-1">
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  Ingresos
                                </div>
                                <div className="font-medium">
                                  €{candidate.ingresosMensuales.toLocaleString()}
                                </div>
                              </div>
                            )}
                            <div className="space-y-1">
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Registro
                              </div>
                              <div className="font-medium">
                                {new Date(candidate.createdAt).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex sm:flex-col items-center gap-2 self-start">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/candidatos/${candidate.id}`)}
                            className="w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/candidatos/${candidate.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CalendarClock className="h-4 w-4 mr-2" />
                                Programar Visita
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </AuthenticatedLayout>
  );
}
