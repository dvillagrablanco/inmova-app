'use client';

import { useState } from 'react';
import { useProperties } from '@/hooks/queries/useProperties';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Building2, MapPin, Euro } from 'lucide-react';
import { Property } from '@/types/properties';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce'; 
import { useRouter } from 'next/navigation'; // Import useRouter

// Helper to get color by status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'bg-green-500/10 text-green-700 hover:bg-green-500/20';
    case 'RENTED': return 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20';
    case 'MAINTENANCE': return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20';
    case 'INACTIVE': return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'Disponible';
    case 'RENTED': return 'Alquilado';
    case 'MAINTENANCE': return 'Mantenimiento';
    case 'INACTIVE': return 'Inactivo';
    default: return status;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'APARTMENT': return 'Apartamento';
    case 'HOUSE': return 'Casa';
    case 'STUDIO': return 'Estudio';
    case 'ROOM': return 'Habitación';
    case 'OFFICE': return 'Oficina';
    case 'LOCAL': return 'Local';
    case 'PARKING': return 'Parking';
    case 'STORAGE': return 'Trastero';
    default: return type;
  }
};

export function PropertiesDataTable() {
  const router = useRouter(); // Use useRouter hook
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isError } = useProperties({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter as Property['status'],
    type: typeFilter === 'all' ? undefined : typeFilter as Property['type'],
  });

  const columns = [
    {
      key: 'address',
      header: 'Dirección',
      render: (item: Property) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{item.address}</span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin size={12} /> {item.city} {item.postalCode ? `(${item.postalCode})` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (item: Property) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-gray-400" />
          <span>{getTypeLabel(item.type)}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      render: (item: Property) => (
        <span className="font-semibold text-gray-900">{formatCurrency(item.price)}/mes</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: Property) => (
        <Badge variant="secondary" className={getStatusColor(item.status)}>
          {getStatusLabel(item.status)}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Actualizado',
      render: (item: Property) => (
        <span className="text-sm text-gray-500">{formatDate(item.updatedAt)}</span>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        Error al cargar las propiedades. Por favor, intenta de nuevo más tarde.
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
                placeholder="Buscar por dirección..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="RENTED">Alquilado</SelectItem>
                <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="APARTMENT">Apartamento</SelectItem>
                <SelectItem value="HOUSE">Casa</SelectItem>
                <SelectItem value="OFFICE">Oficina</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push('/dashboard/properties/new')}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Propiedad
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
                    <Building2 className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No se encontraron propiedades</h3>
                  <p className="text-gray-500 max-w-sm mb-6">
                    No hay propiedades que coincidan con tus filtros o aún no has creado ninguna.
                  </p>
                  <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}>
                    Limpiar filtros
                  </Button>
                </div>
              }
            />
            
            {/* Pagination Controls */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Mostrando página {data.pagination.page} de {data.pagination.pages}
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
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
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
