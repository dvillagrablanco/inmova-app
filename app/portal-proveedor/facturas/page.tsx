'use client';
export const dynamic = 'force-dynamic';


import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

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


interface Invoice {
  id: string;
  numeroFactura: string;
  workOrderId: string;
  estado: string;
  subtotal: number;
  iva: number;
  total: number;
  fechaEmision: string;
  fechaEnvio?: string;
  fechaVencimiento?: string;
  workOrder: {
    id: string;
    titulo: string;
    building: {
      id: string;
      nombre: string;
    };
  };
  payments: any[];
}

const estadoBadgeColor: { [key: string]: string } = {
  borrador: 'bg-gray-500',
  enviada: 'bg-blue-500',
  pagada: 'bg-green-500',
  cancelada: 'bg-red-500',
};

const estadoLabel: { [key: string]: string } = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  pagada: 'Pagada',
  cancelada: 'Cancelada',
};

export default function FacturasPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  useEffect(() => {
    fetchInvoices();
  }, [estadoFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (estadoFilter && estadoFilter !== 'all') {
        params.append('estado', estadoFilter);
      }

      const response = await fetch(`/api/portal-proveedor/invoices?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar facturas');
      }

      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      toast.error('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const calculateTotalPagado = (payments: any[]) => {
    return payments.reduce((sum, payment) => sum + payment.monto, 0);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Facturas</h1>
              <p className="text-gray-600">Gestiona tus facturas y realiza seguimiento de pagos</p>
            </div>

            {/* Filtros y acciones */}
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
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="borrador">Borrador</SelectItem>
                        <SelectItem value="enviada">Enviada</SelectItem>
                        <SelectItem value="pagada">Pagada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => router.push('/portal-proveedor/facturas/nueva')}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Factura
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resumen */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Facturado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pendiente de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      invoices
                        .filter((inv) => inv.estado === 'enviada')
                        .reduce((sum, inv) => sum + inv.total, 0)
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Cobrado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      invoices
                        .filter((inv) => inv.estado === 'pagada')
                        .reduce((sum, inv) => sum + inv.total, 0)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de facturas */}
            <Card>
              <CardHeader>
                <CardTitle>Listado de Facturas</CardTitle>
                <CardDescription>
                  {invoices.length} factura{invoices.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Cargando facturas...</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No hay facturas disponibles</p>
                    <Button
                      onClick={() => router.push('/portal-proveedor/facturas/nueva')}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primera factura
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Orden de Trabajo</TableHead>
                          <TableHead>Edificio</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.numeroFactura}</TableCell>
                            <TableCell>{invoice.workOrder.titulo}</TableCell>
                            <TableCell>{invoice.workOrder.building.nombre}</TableCell>
                            <TableCell>
                              {format(new Date(invoice.fechaEmision), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(invoice.total)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${estadoBadgeColor[invoice.estado] || 'bg-gray-500'}`}
                              >
                                {estadoLabel[invoice.estado] || invoice.estado}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/portal-proveedor/facturas/${invoice.id}`)
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
        </main>
      </div>
    </div>
  );
}
