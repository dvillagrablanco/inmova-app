'use client';

import { useState } from 'react';
import { usePayments } from '@/hooks/queries/usePayments';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, DollarSign, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Payment } from '@/types/payments';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation'; // Import useRouter

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pagado': return 'bg-green-500/10 text-green-700 hover:bg-green-500/20';
    case 'pendiente': return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20';
    case 'vencido': return 'bg-red-500/10 text-red-700 hover:bg-red-500/20';
    case 'parcial': return 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20';
    default: return 'bg-gray-500/10 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export function PaymentsDataTable() {
  const router = useRouter(); // Use useRouter hook
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, isError } = usePayments({
    page,
    limit: 10,
    estado: statusFilter,
  });

  const columns = [
    {
      key: 'concept',
      header: 'Concepto / Inquilino',
      render: (item: Payment) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{item.periodo}</span>
          <span className="text-sm text-gray-500">
            {item.contract?.tenant?.nombreCompleto || 'Inquilino desconocido'}
          </span>
          <span className="text-xs text-gray-400">
            {item.contract?.unit?.building?.nombre} - {item.contract?.unit?.numero}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (item: Payment) => (
        <div className="flex items-center gap-1 font-semibold text-gray-900">
          <DollarSign size={14} className="text-gray-400" />
          {formatCurrency(item.monto)}
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Fechas',
      render: (item: Payment) => (
        <div className="flex flex-col text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar size={12} /> Vence: {formatDate(item.fechaVencimiento)}
          </span>
          {item.fechaPago && (
            <span className="flex items-center gap-1 text-green-600">
              <CreditCard size={12} /> Pagado: {formatDate(item.fechaPago)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: Payment) => (
        <Badge variant="secondary" className={getStatusColor(item.estado)}>
          {getStatusLabel(item.estado)}
        </Badge>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        Error al cargar los pagos. Por favor, intenta de nuevo más tarde.
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push('/dashboard/payments/new')}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Pago
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-white">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
             <DataTable
              data={data?.data || []}
              columns={columns}
              emptyMessage={
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-indigo-50 rounded-full p-4 mb-4">
                    <AlertCircle className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No se encontraron pagos</h3>
                  <p className="text-gray-500 max-w-sm mb-6">
                    No hay registros de pagos que coincidan con los filtros seleccionados.
                  </p>
                  <Button variant="outline" onClick={() => setStatusFilter('all')}>
                    Limpiar filtros
                  </Button>
                </div>
              }
            />
            
            {/* Pagination Controls */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Página {data.pagination.page} de {data.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
