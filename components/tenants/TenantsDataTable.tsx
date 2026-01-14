'use client';

import { useState } from 'react';
import { useTenants } from '@/hooks/queries/useTenants';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Search, Users, Mail, Phone, Calendar } from 'lucide-react';
import { Tenant } from '@/types/tenants';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { useRouter } from 'next/navigation'; // Import useRouter

export function TenantsDataTable() {
  const router = useRouter(); // Use useRouter hook
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  // Note: API doesn't seem to support search query param yet based on code inspection,
  // but we'll include logic for when it does or do client-side filtering if needed.
  // For now, we fetch pagination.
  const { data, isLoading, isError } = useTenants({
    page,
    limit: 10,
    // search: debouncedSearch, 
  });

  const columns = [
    {
      key: 'name',
      header: 'Inquilino',
      render: (item: Tenant) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{item.nombreCompleto}</span>
          {item.dni && <span className="text-xs text-gray-500">DNI: {item.dni}</span>}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contacto',
      render: (item: Tenant) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Mail size={12} /> {item.email}
          </div>
          {item.telefono && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Phone size={12} /> {item.telefono}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Contratos Activos',
      render: (item: Tenant) => {
        const activeContracts = item.contracts?.filter((c: any) => c.estado === 'activo').length || 0;
        return (
          <Badge variant={activeContracts > 0 ? "outline" : "secondary"} className={activeContracts > 0 ? "text-green-600 border-green-200 bg-green-50" : ""}>
            {activeContracts} Activos
          </Badge>
        );
      },
    },
    {
      key: 'joined',
      header: 'Registrado',
      render: (item: Tenant) => (
        <span className="text-sm text-gray-500 flex items-center gap-1">
           <Calendar size={12} /> {formatDate(item.createdAt)}
        </span>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        Error al cargar inquilinos. Por favor, intenta de nuevo más tarde.
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar inquilinos..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push('/dashboard/tenants/new')}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Inquilino
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
                    <Users className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No se encontraron inquilinos</h3>
                  <p className="text-gray-500 max-w-sm mb-6">
                    No hay inquilinos registrados en el sistema.
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
