'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, Loader2, Shield, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  changes: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-gray-100 text-gray-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  EXPORT: 'bg-amber-100 text-amber-800',
  IMPORT: 'bg-amber-100 text-amber-800',
};

const ACTION_OPTIONS = [
  { value: '_all_', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Crear' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'EXPORT', label: 'Exportar' },
  { value: 'IMPORT', label: 'Importar' },
];

export default function AuditoriaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    action: '_all_',
    entityType: '',
    userId: '',
    from: '',
    to: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') loadData(1);
  }, [status, router]);

  const loadData = async (page: number = 1, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '100');
      if (filters.action && filters.action !== '_all_') params.set('action', filters.action);
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (!res.ok) throw new Error('Error cargando auditoría');
      const data = await res.json();
      const newLogs = data.logs || [];
      setLogs((prev) => (append ? [...prev, ...newLogs] : newLogs));
      setPagination(data.pagination || { page: 1, limit: 100, total: 0, pages: 0 });
    } catch {
      toast.error('Error al cargar auditoría');
      if (!append) setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => loadData(1);

  const loadMore = () => {
    if (pagination.page < pagination.pages) loadData(pagination.page + 1, true);
  };

  const getActionBadgeClass = (action: string) =>
    ACTION_COLORS[action] || 'bg-gray-100 text-gray-800';

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Auditoría</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select value={filters.action} onValueChange={(v) => setFilters((f) => ({ ...f, action: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Acción" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Tipo entidad"
                value={filters.entityType}
                onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value }))}
              />
              <Input
                placeholder="ID Usuario"
                value={filters.userId}
                onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="Desde"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="Hasta"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              />
            </div>
            <Button className="mt-4" onClick={handleFilter}>
              Aplicar filtros
            </Button>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No hay registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-gray-600">
                            {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.user?.name || '-'}</div>
                              <div className="text-xs text-gray-500">{log.user?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionBadgeClass(log.action)}>{log.action}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{log.entityType}</span>
                            {log.entityName && (
                              <div className="text-xs text-gray-500 truncate max-w-[120px]">
                                {log.entityName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="text-sm truncate block" title={log.changes || ''}>
                              {log.changes || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{log.ipAddress || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {pagination.page < pagination.pages && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={loadMore} disabled={loading}>
                      Cargar más
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
