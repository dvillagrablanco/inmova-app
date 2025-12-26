'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

interface Quote {
  id: string;
  workOrderId: string;
  estado: string;
  subtotal: number;
  iva: number;
  total: number;
  validezDias: number;
  fechaValidez: string;
  createdAt: string;
  workOrder: {
    id: string;
    titulo: string;
    building: { id: string; nombre: string };
  };
}

const estadoBadgeColor: { [key: string]: string } = {
  pendiente: 'bg-yellow-500',
  aceptado: 'bg-green-500',
  rechazado: 'bg-red-500',
  expirado: 'bg-gray-500',
};

const estadoLabel: { [key: string]: string } = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  expirado: 'Expirado',
};

export default function PresupuestosPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
  }, [estadoFilter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (estadoFilter && estadoFilter !== 'all') {
        params.append('estado', estadoFilter);
      }

      const response = await fetch(`/api/portal-proveedor/quotes?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Error al cargar presupuestos');
      const data = await response.json();
      setQuotes(data);
    } catch (error) {
      logger.error('Error fetching quotes:', error);
      toast.error('Error al cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Presupuestos</h1>
          <p className="text-gray-600">Gestiona tus presupuestos enviados</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4 items-center">
                <Filter className="h-5 w-5 text-gray-500" />
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aceptado">Aceptado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => router.push('/portal-proveedor/presupuestos/nuevo')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Presupuesto
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Presupuestado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(quotes.reduce((sum, q) => sum + q.total, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Presupuestos Aceptados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotes.filter((q) => q.estado === 'aceptado').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pendientes de Respuesta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotes.filter((q) => q.estado === 'pendiente').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Presupuestos</CardTitle>
            <CardDescription>
              {quotes.length} presupuesto{quotes.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando presupuestos...</p>
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No hay presupuestos disponibles</p>
                <Button
                  onClick={() => router.push('/portal-proveedor/presupuestos/nuevo')}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer presupuesto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden de Trabajo</TableHead>
                      <TableHead>Edificio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Validez</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>{quote.workOrder.titulo}</TableCell>
                        <TableCell>{quote.workOrder.building.nombre}</TableCell>
                        <TableCell>
                          {format(new Date(quote.createdAt), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(quote.fechaValidez), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(quote.total)}</TableCell>
                        <TableCell>
                          <Badge className={`${estadoBadgeColor[quote.estado] || 'bg-gray-500'}`}>
                            {estadoLabel[quote.estado] || quote.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/portal-proveedor/presupuestos/${quote.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
