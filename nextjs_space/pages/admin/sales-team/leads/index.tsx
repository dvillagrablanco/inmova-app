import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Lead {
  id: string;
  nombreContacto: string;
  emailContacto: string;
  nombreEmpresa: string;
  estado: string;
  prioridad: string;
  convertido: boolean;
  fechaCaptura: string;
  salesRep: {
    id: string;
    nombreCompleto: string;
    email: string;
    codigoReferido: string;
  };
}

export default function LeadsList() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [prioridadFilter, setPrioridadFilter] = useState<string>('all');
  const [convertidoFilter, setConvertidoFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'super_admin' && session?.user?.role !== 'administrador') {
      router.push('/dashboard');
      return;
    }

    loadLeads();
  }, [session, status, router]);

  const loadLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (estadoFilter && estadoFilter !== 'all') params.append('estado', estadoFilter);
      if (prioridadFilter && prioridadFilter !== 'all') params.append('prioridad', prioridadFilter);
      if (convertidoFilter && convertidoFilter !== 'all') params.append('convertido', convertidoFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/sales-team/leads?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error cargando leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      NUEVO: 'bg-blue-100 text-blue-800',
      CONTACTADO: 'bg-purple-100 text-purple-800',
      CALIFICADO: 'bg-indigo-100 text-indigo-800',
      DEMO: 'bg-yellow-100 text-yellow-800',
      PROPUESTA: 'bg-orange-100 text-orange-800',
      NEGOCIACION: 'bg-amber-100 text-amber-800',
      CERRADO_GANADO: 'bg-green-100 text-green-800',
      CERRADO_PERDIDO: 'bg-red-100 text-red-800',
      DESCARTADO: 'bg-gray-100 text-gray-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadBadge = (prioridad: string) => {
    const colors: Record<string, string> = {
      alta: 'bg-red-100 text-red-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-green-100 text-green-800',
    };
    return colors[prioridad] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Leads - Equipo Comercial - INMOVA</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads Captados</h1>
            <p className="text-gray-600">Gestión de leads del equipo comercial externo</p>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar por nombre, empresa o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button onClick={loadLeads}>
                    <Filter className="mr-2 h-4 w-4" /> Aplicar Filtros
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="NUEVO">Nuevo</SelectItem>
                        <SelectItem value="CONTACTADO">Contactado</SelectItem>
                        <SelectItem value="CALIFICADO">Calificado</SelectItem>
                        <SelectItem value="DEMO">Demo</SelectItem>
                        <SelectItem value="PROPUESTA">Propuesta</SelectItem>
                        <SelectItem value="NEGOCIACION">Negociación</SelectItem>
                        <SelectItem value="CERRADO_GANADO">Cerrado - Ganado</SelectItem>
                        <SelectItem value="CERRADO_PERDIDO">Cerrado - Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las prioridades</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value={convertidoFilter} onValueChange={setConvertidoFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Conversión" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Convertidos</SelectItem>
                        <SelectItem value="false">No convertidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de leads */}
          <Card>
            <CardHeader>
              <CardTitle>Leads ({leads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Lead</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Comercial</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Estado</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Prioridad</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Fecha Captura</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          No se encontraron leads
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr key={lead.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{lead.nombreContacto}</div>
                              <div className="text-sm text-gray-600">{lead.nombreEmpresa}</div>
                              <div className="text-xs text-gray-500">{lead.emailContacto}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lead.salesRep.nombreCompleto}</div>
                              <div className="text-xs text-gray-500">{lead.salesRep.codigoReferido}</div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge className={getEstadoBadge(lead.estado)}>
                              {lead.estado.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge className={getPrioridadBadge(lead.prioridad)}>
                              {lead.prioridad.charAt(0).toUpperCase() + lead.prioridad.slice(1)}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4 text-sm text-gray-700">
                            {format(new Date(lead.fechaCaptura), 'dd MMM yyyy', { locale: es })}
                          </td>
                          <td className="text-center py-3 px-4">
                            <Link href={`/admin/sales-team/leads/${lead.id}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
