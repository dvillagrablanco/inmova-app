'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  FileText,
  Plus,
  Euro,
  Calendar,
  Building2,
  User,
  MoreVertical,
  Eye,
  Edit,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContratoGestion {
  id: string;
  propietario: string;
  inmuebles: string[];
  tipo: string;
  honorarios?: number;
  honorariosPorcentaje?: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  condiciones?: string;
  createdAt: string;
}

const TIPO_LABELS: Record<string, string> = {
  integral: 'Gestión integral',
  parcial: 'Gestión parcial',
  subarriendo: 'Subarriendo',
};

const ESTADO_LABELS: Record<string, string> = {
  activo: 'Activo',
  expirado: 'Expirado',
  pendiente: 'Pendiente',
};

export default function ContratosGestionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [contratos, setContratos] = useState<ContratoGestion[]>([]);
  const [filteredContratos, setFilteredContratos] = useState<ContratoGestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [propietarioFilter, setPropietarioFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContratos = async () => {
      if (status !== 'authenticated') return;
      try {
        const res = await fetch('/api/contratos-gestion');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
          setContratos(items);
          setFilteredContratos(items);
        }
      } catch {
        toast.error('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContratos();
  }, [status]);

  useEffect(() => {
    let filtered = contratos;
    if (propietarioFilter) {
      filtered = filtered.filter((c) =>
        c.propietario.toLowerCase().includes(propietarioFilter.toLowerCase())
      );
    }
    if (estadoFilter !== 'all') {
      filtered = filtered.filter((c) => c.estado === estadoFilter);
    }
    if (tipoFilter !== 'all') {
      filtered = filtered.filter((c) => c.tipo === tipoFilter);
    }
    setFilteredContratos(filtered);
  }, [propietarioFilter, estadoFilter, tipoFilter, contratos]);

  const honorariosMensualesTotal = contratos
    .filter((c) => c.estado === 'activo' && c.honorarios)
    .reduce((sum, c) => sum + (c.honorarios || 0), 0);

  const contratosPorRenovar = contratos.filter((c) => {
    if (c.estado !== 'activo') return false;
    const fin = new Date(c.fechaFin);
    const hoy = new Date();
    const dias = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return dias > 0 && dias <= 90;
  }).length;

  const propietariosUnicos = Array.from(new Set(contratos.map((c) => c.propietario)));

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contratos de Gestión</h1>
            <p className="text-muted-foreground">
              Contratos entre el gestor y los propietarios de inmuebles
            </p>
          </div>
          <Button onClick={() => router.push('/contratos-gestion/nuevo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo contrato de gestión
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total contratos activos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contratos.filter((c) => c.estado === 'activo').length}
              </div>
              <p className="text-xs text-muted-foreground">En vigor</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Honorarios mensuales totales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{honorariosMensualesTotal.toLocaleString('es-ES')}
              </div>
              <p className="text-xs text-muted-foreground">Fijos activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos por renovar</CardTitle>
              <Calendar className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{contratosPorRenovar}</div>
              <p className="text-xs text-muted-foreground">Próximos 90 días</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propietarios gestionados</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propietariosUnicos.length}</div>
              <p className="text-xs text-muted-foreground">Únicos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Input
              placeholder="Buscar por propietario"
              value={propietarioFilter}
              onChange={(e) => setPropietarioFilter(e.target.value)}
              className="max-w-xs"
            />
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="expirado">Expirado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="integral">Gestión integral</SelectItem>
                <SelectItem value="parcial">Gestión parcial</SelectItem>
                <SelectItem value="subarriendo">Subarriendo</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabla */}
        {filteredContratos.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={FileText}
                title="No hay contratos de gestión"
                description="Crea tu primer contrato de gestión con un propietario para empezar."
                action={{
                  label: 'Nuevo contrato de gestión',
                  onClick: () => router.push('/contratos-gestion/nuevo'),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Propietario</th>
                      <th className="text-left p-4 font-medium">Inmueble(s)</th>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-left p-4 font-medium">Honorarios</th>
                      <th className="text-left p-4 font-medium">Inicio</th>
                      <th className="text-left p-4 font-medium">Fin</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                      <th className="text-right p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContratos.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {c.propietario}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {c.inmuebles.map((inv, i) => (
                              <span key={i} className="text-sm flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {inv}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">{TIPO_LABELS[c.tipo] || c.tipo}</td>
                        <td className="p-4">
                          {c.honorarios
                            ? `€${c.honorarios}/mes`
                            : c.honorariosPorcentaje
                              ? `${c.honorariosPorcentaje}%`
                              : '-'}
                        </td>
                        <td className="p-4">
                          {format(new Date(c.fechaInicio), 'dd MMM yyyy', { locale: es })}
                        </td>
                        <td className="p-4">
                          {format(new Date(c.fechaFin), 'dd MMM yyyy', { locale: es })}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              c.estado === 'activo'
                                ? 'default'
                                : c.estado === 'expirado'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {ESTADO_LABELS[c.estado] || c.estado}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
