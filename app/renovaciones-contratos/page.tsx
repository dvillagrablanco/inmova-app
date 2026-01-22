'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  Send,
} from 'lucide-react';

interface ContratoRenovacion {
  id: string;
  inquilino: string;
  propiedad: string;
  fechaFin: string;
  diasParaVencer: number;
  estado: 'vigente' | 'proximo_vencer' | 'vencido' | 'renovado';
  precioActual: number;
  propuestaRenovacion?: number;
}

export default function RenovacionesContratosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<ContratoRenovacion[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchContratos();
    }
  }, [status, router]);

  const fetchContratos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contracts');
      if (res.ok) {
        const data = await res.json();
        const contratosData = (Array.isArray(data) ? data : data.contracts || []).map((c: any) => {
          const fechaFin = new Date(c.fechaFin);
          const hoy = new Date();
          const diasParaVencer = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          
          let estado: 'vigente' | 'proximo_vencer' | 'vencido' | 'renovado' = 'vigente';
          if (diasParaVencer < 0) estado = 'vencido';
          else if (diasParaVencer <= 60) estado = 'proximo_vencer';
          if (c.renovado) estado = 'renovado';

          return {
            id: c.id,
            inquilino: c.tenant?.nombreCompleto || c.inquilino || 'Sin asignar',
            propiedad: c.unit?.building?.nombre || c.propiedad || 'Sin asignar',
            fechaFin: c.fechaFin,
            diasParaVencer,
            estado,
            precioActual: c.rentaMensual || c.precio || 0,
            propuestaRenovacion: c.propuestaRenovacion,
          };
        });
        setContratos(contratosData);
      }
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      toast.error('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  const contratosFiltrados = contratos.filter(c =>
    !busqueda || c.inquilino.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.propiedad.toLowerCase().includes(busqueda.toLowerCase())
  );

  const estadisticas = {
    total: contratos.length,
    vigentes: contratos.filter(c => c.estado === 'vigente').length,
    proximosVencer: contratos.filter(c => c.estado === 'proximo_vencer').length,
    vencidos: contratos.filter(c => c.estado === 'vencido').length,
    renovados: contratos.filter(c => c.estado === 'renovado').length,
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'vigente': return 'bg-green-100 text-green-800';
      case 'proximo_vencer': return 'bg-yellow-100 text-yellow-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      case 'renovado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const enviarPropuestaRenovacion = (contratoId: string) => {
    toast.success('Propuesta de renovación enviada');
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Renovaciones de Contratos</h1>
            <p className="text-muted-foreground">Gestión de vencimientos y renovaciones</p>
          </div>
          <Button onClick={fetchContratos} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.vigentes}</p>
                  <p className="text-sm text-muted-foreground">Vigentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-800">{estadisticas.proximosVencer}</p>
                  <p className="text-sm text-yellow-700">Próximos a Vencer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.vencidos}</p>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.renovados}</p>
                  <p className="text-sm text-muted-foreground">Renovados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar contratos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Días para Vencer</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Renta Actual</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No hay contratos que mostrar</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  contratosFiltrados.map((contrato) => (
                    <TableRow key={contrato.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{contrato.inquilino}</TableCell>
                      <TableCell>{contrato.propiedad}</TableCell>
                      <TableCell>
                        {contrato.fechaFin
                          ? new Date(contrato.fechaFin).toLocaleDateString('es-ES')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={contrato.diasParaVencer <= 30 ? 'text-red-600 font-semibold' : ''}>
                          {contrato.diasParaVencer} días
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(contrato.estado)}>
                          {contrato.estado.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(contrato.precioActual)}
                      </TableCell>
                      <TableCell>
                        {contrato.estado === 'proximo_vencer' && (
                          <Button
                            size="sm"
                            onClick={() => enviarPropuestaRenovacion(contrato.id)}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Proponer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
