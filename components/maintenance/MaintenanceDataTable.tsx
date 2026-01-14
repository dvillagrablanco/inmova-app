'use client';

import { useState } from 'react';
import { useMaintenance } from '@/hooks/queries/useMaintenance';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Wrench, Calendar, AlertTriangle } from 'lucide-react';
import { MaintenanceRequest } from '@/types/maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'urgente': return 'bg-red-500/10 text-red-700 border-red-200';
    case 'alta': return 'bg-orange-500/10 text-orange-700 border-orange-200';
    case 'media': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'baja': return 'bg-green-500/10 text-green-700 border-green-200';
    default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completada': return 'bg-green-100 text-green-800';
    case 'en_proceso': return 'bg-blue-100 text-blue-800';
    case 'pendiente': return 'bg-yellow-100 text-yellow-800';
    case 'cancelada': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function MaintenanceDataTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data, isLoading, isError } = useMaintenance({
    page,
    limit: 10,
    estado: statusFilter,
    prioridad: priorityFilter,
  });

  const columns = [
    {
      key: 'title',
      header: 'Solicitud',
      render: (item: MaintenanceRequest) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{item.titulo}</span>
          <span className="text-sm text-gray-500 truncate max-w-[300px]">
            {item.descripcion}
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Ubicación',
      render: (item: MaintenanceRequest) => (
        <div className="flex flex-col text-sm text-gray-600">
          <span className="font-medium">
            {item.unit?.building?.nombre} - {item.unit?.numero}
          </span>
          {item.unit?.tenant && (
            <span className="text-xs text-gray-400">
              Inquilino: {item.unit.tenant.nombreCompleto}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (item: MaintenanceRequest) => (
        <Badge variant="outline" className={getPriorityColor(item.prioridad)}>
          {item.prioridad.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: MaintenanceRequest) => (
        <Badge variant="secondary" className={getStatusColor(item.estado)}>
          {item.estado.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (item: MaintenanceRequest) => (
        <span className="text-sm text-gray-500 flex items-center gap-1">
          <Calendar size={12} /> {formatDate(item.fechaSolicitud)}
        </span>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
        Error al cargar las solicitudes. Por favor, intenta de nuevo más tarde.
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.location.href = '/dashboard/maintenance/new'}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
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
                    <Wrench className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No hay solicitudes</h3>
                  <p className="text-gray-500 max-w-sm mb-6">
                    No se encontraron solicitudes de mantenimiento con los filtros seleccionados.
                  </p>
                  <Button variant="outline" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); }}>
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
