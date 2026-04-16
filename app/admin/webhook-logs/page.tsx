'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Activity, ExternalLink } from 'lucide-react';

interface WebhookLog {
  id: string;
  evento: string;
  url: string;
  method: string;
  statusCode: number;
  requestBody: string;
  responseBody: string;
  duracion: number;
  createdAt: string;
  success: boolean;
}

export default function WebhookLogsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDetail, setOpenDetail] = useState<WebhookLog | null>(null);
  const [filters, setFilters] = useState({
    evento: '',
    status: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadLogs();
  }, [status, router, filters.evento, filters.status, filters.fechaDesde, filters.fechaHasta]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.evento) params.set('evento', filters.evento);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta);
      const res = await fetch(`/api/admin/webhook-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Error cargando logs');
    } finally {
      setLoading(false);
    }
  };

  const hoy = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const exitosos = logs.filter((l) => l.success);
  const fallidos = logs.filter((l) => !l.success);
  const tasaExito = logs.length > 0 ? Math.round((exitosos.length / logs.length) * 100) : 0;

  const truncate = (s: string, max = 60) => {
    if (!s) return '-';
    return s.length > max ? s.slice(0, max) + '...' : s;
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto p-4">Cargando...</div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-bold">Logs de Webhooks</h1>
          <p className="text-sm text-muted-foreground">
            Historial de ejecuciones de webhooks
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Activity className="h-5 w-5 mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">Total hoy</p>
              <p className="text-xl font-bold">{hoy.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <CheckCircle className="h-5 w-5 mb-1 text-green-600" />
              <p className="text-xs text-muted-foreground">Exitosos</p>
              <p className="text-xl font-bold">{exitosos.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <XCircle className="h-5 w-5 mb-1 text-red-600" />
              <p className="text-xs text-muted-foreground">Fallidos</p>
              <p className="text-xl font-bold">{fallidos.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Clock className="h-5 w-5 mb-1 text-amber-600" />
              <p className="text-xs text-muted-foreground">Tasa éxito</p>
              <p className="text-xl font-bold">{tasaExito}%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
            <div className="flex flex-wrap gap-4 pt-2">
              <div>
                <Label className="text-xs">Evento</Label>
                <Input
                  className="w-40"
                  value={filters.evento}
                  onChange={(e) => setFilters({ ...filters, evento: e.target.value })}
                  placeholder="Ej: property.created"
                />
              </div>
              <div>
                <Label className="text-xs">Estado</Label>
                <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="success">Exitoso</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Desde</Label>
                <Input
                  type="date"
                  className="w-36"
                  value={filters.fechaDesde}
                  onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Hasta</Label>
                <Input
                  type="date"
                  className="w-36"
                  value={filters.fechaHasta}
                  onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>URL destino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Respuesta</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead className="w-20">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Cargando...</TableCell>
                  </TableRow>
                ) : (
                  logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{new Date(l.createdAt).toLocaleString('es-ES')}</TableCell>
                      <TableCell>{l.evento}</TableCell>
                      <TableCell className="max-w-48 truncate">{l.url}</TableCell>
                      <TableCell>
                        <Badge variant={l.success ? 'default' : 'destructive'}>
                          {l.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{truncate(l.responseBody, 40)}</TableCell>
                      <TableCell>{l.duracion} ms</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setOpenDetail(l)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!openDetail} onOpenChange={() => setOpenDetail(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Detalle del webhook</DialogTitle>
            </DialogHeader>
            {openDetail && (
              <div className="space-y-4 text-sm font-mono">
                <div>
                  <p className="font-semibold text-foreground mb-1">Evento</p>
                  <p className="text-muted-foreground">{openDetail.evento}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">URL</p>
                  <p className="text-muted-foreground break-all">{openDetail.url}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Request</p>
                  <pre className="bg-muted p-3 rounded max-h-32 overflow-auto text-xs whitespace-pre-wrap">
                    {openDetail.requestBody}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Response</p>
                  <pre className="bg-muted p-3 rounded max-h-32 overflow-auto text-xs whitespace-pre-wrap">
                    {openDetail.responseBody}
                  </pre>
                </div>
                <div className="flex gap-4">
                  <span>Status: {openDetail.statusCode}</span>
                  <span>Duración: {openDetail.duracion} ms</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
