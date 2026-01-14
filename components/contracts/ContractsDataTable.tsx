'use client';

import { useState } from 'react';
import { useContracts } from '@/hooks/queries/useContracts';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, FileText, Calendar, Wallet } from 'lucide-react';
import { Contract } from '@/types/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation'; // Import useRouter

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'activo': return 'bg-green-500/10 text-green-700';
    case 'pendiente': return 'bg-yellow-500/10 text-yellow-700';
    case 'finalizado': return 'bg-gray-500/10 text-gray-700';
    case 'cancelado': return 'bg-red-500/10 text-red-700';
    default: return 'bg-gray-500/10 text-gray-700';
  }
};

export function ContractsDataTable() {
  const router = useRouter(); // Use useRouter hook
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useContracts({
    page,
    limit: 10,
  });

  const columns = [
    {
      key: 'property',
      header: 'Propiedad / Inquilino',
      render: (item: Contract) => (
        <div className="flex flex-col">
            {/* Accessing nested relations if available in data, checking logic */}
            <span className="font-medium text-gray-900">
                {item.unit ? `Unidad ${item.unitId}` : `Contrato #${item.id.substring(0, 8)}`}
            </span>
            <span className="text-sm text-gray-500">
                {item.tenant ? (item.tenant as any).nombreCompleto : 'Sin inquilino asignado'}
            </span>
        </div>
      ),
    },
    {
        key: 'rent',
        header: 'Renta',
        render: (item: Contract) => (
            <div className="flex items-center gap-1 font-semibold text-gray-900">
                <Wallet size={14} className="text-gray-400" />
                {formatCurrency(item.rentaMensual)}
            </div>
        )
    },
    {
      key: 'dates',
      header: 'Vigencia',
      render: (item: Contract) => (
        <div className="flex flex-col text-sm text-gray-600">
            <span>Inicio: {formatDate(item.fechaInicio)}</span>
            <span>Fin: {formatDate(item.fechaFin)}</span>
            <span className={`text-xs ${item.diasHastaVencimiento < 30 ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                {item.diasHastaVencimiento > 0 ? `Vence en ${item.diasHastaVencimiento} días` : 'Vencido'}
            </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: Contract) => (
        <Badge variant="secondary" className={getStatusColor(item.estado)}>
          {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
        </Badge>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        Error al cargar contratos. Por favor, intenta de nuevo más tarde.
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2 w-full sm:w-auto">
             {/* Filters placeholder */}
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push('/dashboard/contracts/new')}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Contrato
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
                    <FileText className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No se encontraron contratos</h3>
                  <p className="text-gray-500 max-w-sm mb-6">
                    No hay contratos activos o registrados que coincidan con los criterios.
                  </p>
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
