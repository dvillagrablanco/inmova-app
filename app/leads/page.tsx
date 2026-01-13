'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Building2,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  empresa?: string;
  fuente: string;
  estado: 'nuevo' | 'contactado' | 'cualificado' | 'propuesta' | 'ganado' | 'perdido';
  interes?: string;
  presupuesto?: number;
  notas?: string;
  createdAt: string;
  asignadoA?: string;
}

const LEAD_STATUS = [
  { value: 'nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  { value: 'contactado', label: 'Contactado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'cualificado', label: 'Cualificado', color: 'bg-purple-100 text-purple-800' },
  { value: 'propuesta', label: 'Propuesta', color: 'bg-orange-100 text-orange-800' },
  { value: 'ganado', label: 'Ganado', color: 'bg-green-100 text-green-800' },
  { value: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800' },
];

const LEAD_SOURCES = [
  { value: 'all', label: 'Todas las fuentes' },
  { value: 'web', label: 'Formulario Web' },
  { value: 'referido', label: 'Referido' },
  { value: 'publicidad', label: 'Publicidad' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'otro', label: 'Otro' },
];

export default function LeadsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadLeads();
    }
  }, [status, router]);

  const loadLeads = async () => {
    try {
      // En una implementación real, esto llamaría a /api/leads
      // Por ahora, mostramos un estado vacío para datos reales
      const response = await fetch('/api/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : data.data || []);
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    const status = LEAD_STATUS.find(s => s.value === estado);
    return status ? (
      <Badge className={status.color}>{status.label}</Badge>
    ) : (
      <Badge variant="outline">{estado}</Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || lead.estado === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.fuente === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  // Estadísticas
  const stats = {
    total: leads.length,
    nuevos: leads.filter(l => l.estado === 'nuevo').length,
    enProceso: leads.filter(l => ['contactado', 'cualificado', 'propuesta'].includes(l.estado)).length,
    ganados: leads.filter(l => l.estado === 'ganado').length,
    tasaConversion: leads.length > 0 
      ? Math.round((leads.filter(l => l.estado === 'ganado').length / leads.length) * 100) 
      : 0,
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Gestiona tus oportunidades de negocio
            </p>
          </div>
          <Button onClick={() => router.push('/leads/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Lead
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">En el pipeline</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.nuevos}</div>
              <p className="text-xs text-muted-foreground">Sin contactar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.enProceso}</div>
              <p className="text-xs text-muted-foreground">Activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.tasaConversion}%</div>
              <p className="text-xs text-muted-foreground">{stats.ganados} ganados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {LEAD_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Fuente" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay leads</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                  ? 'No se encontraron leads con los filtros seleccionados'
                  : 'Comienza agregando tu primer lead para gestionar oportunidades'}
              </p>
              <Button onClick={() => router.push('/leads/nuevo')}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Lead
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(lead.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{lead.nombre}</h3>
                          {getStatusBadge(lead.estado)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                          {lead.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.telefono}
                            </span>
                          )}
                          {lead.empresa && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {lead.empresa}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="outline">{lead.fuente}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}/editar`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
