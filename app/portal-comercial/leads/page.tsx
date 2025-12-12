'use client';
export const dynamic = 'force-dynamic';


import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';


interface Lead {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  cargo: string | null;
  presupuestoMensual: number | null;
  propiedadesEstimadas: number | null;
  estado: string;
  prioridad: string;
  fuente: string;
  scoring: number | null;
  fechaCreacion: Date;
  fechaContacto: Date | null;
}

const estadosLeads = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'CONTACTADO', label: 'Contactado' },
  { value: 'CALIFICADO', label: 'Calificado' },
  { value: 'PROPUESTA', label: 'Propuesta Enviada' },
  { value: 'NEGOCIACION', label: 'En Negociación' },
  { value: 'CERRADO_GANADO', label: 'Cerrado Ganado' },
  { value: 'CERRADO_PERDIDO', label: 'Cerrado Perdido' },
];

const prioridades = [
  { value: 'all', label: 'Todas las prioridades' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

const fuentes = [
  { value: 'all', label: 'Todas las fuentes' },
  { value: 'WEB', label: 'Web' },
  { value: 'REFERIDO', label: 'Referido' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'EVENTO', label: 'Evento' },
  { value: 'OTRO', label: 'Otro' },
];

export default function LeadsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [prioridadFilter, setPrioridadFilter] = useState('all');
  const [fuenteFilter, setFuenteFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadLeads();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [leads, searchTerm, estadoFilter, prioridadFilter, fuenteFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      } else {
        toast.error('Error al cargar leads');
      }
    } catch (error) {
      logger.error('Error loading leads:', error);
      toast.error('Error al cargar leads');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Filtro de búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.nombreCompleto.toLowerCase().includes(search) ||
          lead.email.toLowerCase().includes(search) ||
          (lead.empresa && lead.empresa.toLowerCase().includes(search)) ||
          (lead.telefono && lead.telefono.includes(search))
      );
    }

    // Filtro de estado
    if (estadoFilter && estadoFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.estado === estadoFilter);
    }

    // Filtro de prioridad
    if (prioridadFilter && prioridadFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.prioridad === prioridadFilter);
    }

    // Filtro de fuente
    if (fuenteFilter && fuenteFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.fuente === fuenteFilter);
    }

    setFilteredLeads(filtered);
  };

  const getBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      NUEVO: 'bg-blue-100 text-blue-700',
      CONTACTADO: 'bg-purple-100 text-purple-700',
      CALIFICADO: 'bg-indigo-100 text-indigo-700',
      PROPUESTA: 'bg-yellow-100 text-yellow-700',
      NEGOCIACION: 'bg-orange-100 text-orange-700',
      CERRADO_GANADO: 'bg-green-100 text-green-700',
      CERRADO_PERDIDO: 'bg-red-100 text-red-700',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      ALTA: 'text-red-600',
      MEDIA: 'text-yellow-600',
      BAJA: 'text-green-600',
    };
    return colors[prioridad] || 'text-gray-600';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <LoadingState message="Cargando leads..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/portal-comercial">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Mis Leads</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                  Gestiona tus oportunidades comerciales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={loadLeads} variant="outline">
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Estado */}
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {estadosLeads.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Prioridad */}
              <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {prioridades.map((prioridad) => (
                    <SelectItem key={prioridad.value} value={prioridad.value}>
                      {prioridad.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Fuente */}
              <Select value={fuenteFilter} onValueChange={setFuenteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fuente" />
                </SelectTrigger>
                <SelectContent>
                  {fuentes.map((fuente) => (
                    <SelectItem key={fuente.value} value={fuente.value}>
                      {fuente.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resultados */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}{' '}
                encontrados
              </p>
              {(searchTerm || estadoFilter !== 'all' || prioridadFilter !== 'all' || fuenteFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setEstadoFilter('all');
                    setPrioridadFilter('all');
                    setFuenteFilter('all');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Leads */}
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No se encontraron leads</p>
                  <p className="text-sm">
                  {searchTerm || estadoFilter !== 'all' || prioridadFilter !== 'all' || fuenteFilter !== 'all'
                    ? 'Intenta ajustar los filtros'
                    : 'Aún no tienes leads registrados'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLeads.map((lead) => (
              <Link key={lead.id} href={`/portal-comercial/leads/${lead.id}`}>
                <Card className="card-hover cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Cabecera */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            {lead.nombreCompleto}
                          </h3>
                          <Badge className={getBadgeColor(lead.estado)}>
                            {lead.estado.replace('_', ' ')}
                          </Badge>
                          {lead.scoring && lead.scoring >= 70 && (
                            <Badge variant="outline" className="bg-yellow-50">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Alto potencial
                            </Badge>
                          )}
                        </div>

                        {/* Información de contacto */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {lead.empresa && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {lead.empresa}
                              {lead.cargo && ` • ${lead.cargo}`}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {lead.email}
                          </div>
                          {lead.telefono && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {lead.telefono}
                            </div>
                          )}
                        </div>

                        {/* Información adicional */}
                        <div className="flex flex-wrap gap-3 text-xs">
                          <Badge variant="outline" className={getPriorityColor(lead.prioridad)}>
                            Prioridad: {lead.prioridad}
                          </Badge>
                          <Badge variant="outline">Fuente: {lead.fuente}</Badge>
                            {lead.presupuestoMensual && (
                            <Badge variant="outline">
                              Presupuesto: {lead.presupuestoMensual}€/mes
                            </Badge>
                          )}
                          {lead.propiedadesEstimadas && (
                            <Badge variant="outline">
                              {lead.propiedadesEstimadas} propiedades
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Fecha */}
                      <div className="text-right text-sm text-muted-foreground">
                        <p>
                          {lead.fechaCreacion
                            ? format(new Date(lead.fechaCreacion), "d 'de' MMM 'de' yyyy", {
                                locale: es,
                              })
                            : 'Sin fecha'}
                        </p>
                        {lead.fechaContacto && (
                          <p className="text-xs mt-1">
                            Contactado:{' '}
                            {format(new Date(lead.fechaContacto), "d 'de' MMM", {
                              locale: es,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
