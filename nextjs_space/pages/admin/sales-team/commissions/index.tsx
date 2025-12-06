import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Commission {
  id: string;
  tipo: string;
  descripcion: string;
  periodo: string | null;
  montoBase: number;
  porcentaje: number | null;
  montoComision: number;
  retencionIRPF: number;
  montoNeto: number;
  estado: string;
  fechaGeneracion: string;
  fechaAprobacion: string | null;
  fechaPago: string | null;
  salesRep: {
    id: string;
    nombreCompleto: string;
    email: string;
  };
  lead: {
    id: string;
    nombreEmpresa: string;
    nombreContacto: string;
  } | null;
}

export default function CommissionsList() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'super_admin' && session?.user?.role !== 'administrador') {
      router.push('/dashboard');
      return;
    }

    loadCommissions();
  }, [session, status, router]);

  const loadCommissions = async () => {
    try {
      const params = new URLSearchParams();
      if (estadoFilter && estadoFilter !== 'all') params.append('estado', estadoFilter);
      if (tipoFilter && tipoFilter !== 'all') params.append('tipo', tipoFilter);

      const response = await fetch(`/api/sales-team/commissions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCommissions(data);
      }
    } catch (error) {
      console.error('Error cargando comisiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('¿Aprobar esta comisión?')) return;

    try {
      const response = await fetch(`/api/sales-team/commissions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notaAprobacion: 'Aprobado' }),
      });

      if (response.ok) {
        toast.success('Comisión aprobada');
        loadCommissions();
      } else {
        toast.error('Error al aprobar comisión');
      }
    } catch (error) {
      toast.error('Error al aprobar comisión');
    }
  };

  const handlePay = async (id: string) => {
    const referencia = prompt('Número de referencia del pago:');
    if (!referencia) return;

    try {
      const response = await fetch(`/api/sales-team/commissions/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenciaPago: referencia,
          metodoPago: 'transferencia',
        }),
      });

      if (response.ok) {
        toast.success('Comisión marcada como pagada');
        loadCommissions();
      } else {
        toast.error('Error al marcar comisión como pagada');
      }
    } catch (error) {
      toast.error('Error al procesar el pago');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const icons: Record<string, JSX.Element> = {
      PENDIENTE: <Clock className="h-3 w-3 mr-1" />,
      APROBADA: <CheckCircle className="h-3 w-3 mr-1" />,
      PAGADA: <CheckCircle className="h-3 w-3 mr-1" />,
      CANCELADA: <XCircle className="h-3 w-3 mr-1" />,
      RETENIDA: <AlertCircle className="h-3 w-3 mr-1" />,
    };

    const colors: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      APROBADA: 'bg-blue-100 text-blue-800',
      PAGADA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
      RETENIDA: 'bg-orange-100 text-orange-800',
    };

    return (
      <Badge className={`${colors[estado] || 'bg-gray-100 text-gray-800'} flex items-center justify-center`}>
        {icons[estado]}
        {estado}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      CAPTACION: 'bg-purple-100 text-purple-800',
      RECURRENTE: 'bg-blue-100 text-blue-800',
      REACTIVACION: 'bg-indigo-100 text-indigo-800',
      BONIFICACION: 'bg-green-100 text-green-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando comisiones...</p>
        </div>
      </div>
    );
  }

  const totalPendiente = commissions
    .filter((c) => c.estado === 'PENDIENTE' || c.estado === 'APROBADA')
    .reduce((sum, c) => sum + c.montoNeto, 0);

  const totalPagado = commissions
    .filter((c) => c.estado === 'PAGADA')
    .reduce((sum, c) => sum + c.montoNeto, 0);

  return (
    <>
      <Head>
        <title>Comisiones - Equipo Comercial - INMOVA</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Comisiones</h1>
            <p className="text-gray-600">Gestión de comisiones del equipo comercial externo</p>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pendiente de Pago</span>
                  <Clock className="h-5 w-5 text-yellow-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPendiente)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Total Pagado</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPagado)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="w-64">
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="APROBADA">Aprobada</SelectItem>
                      <SelectItem value="PAGADA">Pagada</SelectItem>
                      <SelectItem value="CANCELADA">Cancelada</SelectItem>
                      <SelectItem value="RETENIDA">Retenida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-64">
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="CAPTACION">Captación</SelectItem>
                      <SelectItem value="RECURRENTE">Recurrente</SelectItem>
                      <SelectItem value="REACTIVACION">Reactivación</SelectItem>
                      <SelectItem value="BONIFICACION">Bonificación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={loadCommissions}>Aplicar Filtros</Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de comisiones */}
          <Card>
            <CardHeader>
              <CardTitle>Comisiones ({commissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Comercial</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Descripción</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Tipo</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Monto Bruto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">IRPF</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Monto Neto</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Estado</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          No se encontraron comisiones
                        </td>
                      </tr>
                    ) : (
                      commissions.map((commission) => (
                        <tr key={commission.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{commission.salesRep.nombreCompleto}</div>
                              <div className="text-xs text-gray-500">{commission.salesRep.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm text-gray-900">{commission.descripcion}</div>
                              {commission.lead && (
                                <div className="text-xs text-gray-500">{commission.lead.nombreEmpresa}</div>
                              )}
                              {commission.periodo && (
                                <div className="text-xs text-gray-500">Periodo: {commission.periodo}</div>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge className={getTipoBadge(commission.tipo)}>{commission.tipo}</Badge>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                              commission.montoComision
                            )}
                          </td>
                          <td className="text-right py-3 px-4 text-red-600">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                              commission.retencionIRPF
                            )}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                              commission.montoNeto
                            )}
                          </td>
                          <td className="text-center py-3 px-4">{getEstadoBadge(commission.estado)}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex gap-1 justify-center">
                              {commission.estado === 'PENDIENTE' && (
                                <Button size="sm" variant="outline" onClick={() => handleApprove(commission.id)}>
                                  Aprobar
                                </Button>
                              )}
                              {commission.estado === 'APROBADA' && (
                                <Button size="sm" onClick={() => handlePay(commission.id)}>
                                  Pagar
                                </Button>
                              )}
                            </div>
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
