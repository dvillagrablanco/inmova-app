'use client';

/**
 * Renovaciones de Contratos
 * 
 * Gestión de renovaciones de contratos próximos a vencer
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Search,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Filter,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, addYears } from 'date-fns';
import { es } from 'date-fns/locale';

interface Contrato {
  id: string;
  propiedad: string;
  inquilino: string;
  email: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  estado: string;
  diasRestantes: number;
}

export default function RenovacionesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [renovandoId, setRenovandoId] = useState<string | null>(null);

  useEffect(() => {
    fetchContratos();
  }, []);

  const fetchContratos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contracts?expiring=true');
      if (response.ok) {
        const data = await response.json();
        // Transformar datos para incluir días restantes
        const contratosConDias = (data.data || []).map((c: any) => ({
          id: c.id,
          propiedad: c.property?.address || c.propiedad || 'Sin dirección',
          inquilino: c.tenant?.name || c.inquilino || 'Sin inquilino',
          email: c.tenant?.email || c.email || '',
          fechaInicio: c.startDate || c.fechaInicio,
          fechaFin: c.endDate || c.fechaFin,
          rentaMensual: c.monthlyRent || c.rentaMensual || 0,
          estado: c.status || c.estado,
          diasRestantes: differenceInDays(new Date(c.endDate || c.fechaFin), new Date()),
        }));
        setContratos(contratosConDias);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenovar = async (contratoId: string) => {
    setRenovandoId(contratoId);
    try {
      const response = await fetch(`/api/contracts/${contratoId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ years: 1 }), // Renovar por 1 año
      });

      if (response.ok) {
        toast.success('Contrato renovado correctamente');
        fetchContratos();
      } else {
        toast.error('Error al renovar el contrato');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setRenovandoId(null);
    }
  };

  const handleEnviarRecordatorio = async (contrato: Contrato) => {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CONTRACT_RENEWAL_REMINDER',
          recipientEmail: contrato.email,
          contractId: contrato.id,
        }),
      });

      if (response.ok) {
        toast.success(`Recordatorio enviado a ${contrato.email}`);
      } else {
        toast.error('Error al enviar recordatorio');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const getEstadoBadge = (diasRestantes: number) => {
    if (diasRestantes <= 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (diasRestantes <= 30) {
      return <Badge className="bg-red-100 text-red-700">Crítico ({diasRestantes}d)</Badge>;
    } else if (diasRestantes <= 60) {
      return <Badge className="bg-yellow-100 text-yellow-700">Próximo ({diasRestantes}d)</Badge>;
    } else if (diasRestantes <= 90) {
      return <Badge className="bg-blue-100 text-blue-700">En plazo ({diasRestantes}d)</Badge>;
    }
    return <Badge variant="secondary">{diasRestantes} días</Badge>;
  };

  const contratosFiltrados = contratos.filter((c) => {
    const matchBusqueda =
      c.propiedad.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.inquilino.toLowerCase().includes(busqueda.toLowerCase());
    
    let matchFiltro = true;
    if (filtroEstado === 'critico') matchFiltro = c.diasRestantes <= 30;
    else if (filtroEstado === 'proximo') matchFiltro = c.diasRestantes <= 60 && c.diasRestantes > 30;
    else if (filtroEstado === 'vencido') matchFiltro = c.diasRestantes <= 0;

    return matchBusqueda && matchFiltro;
  });

  const stats = {
    total: contratos.length,
    criticos: contratos.filter((c) => c.diasRestantes <= 30 && c.diasRestantes > 0).length,
    vencidos: contratos.filter((c) => c.diasRestantes <= 0).length,
    proximos: contratos.filter((c) => c.diasRestantes <= 60 && c.diasRestantes > 30).length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Renovaciones de Contratos
          </h1>
          <p className="text-muted-foreground">
            Gestiona las renovaciones de contratos próximos a vencer
          </p>
        </div>
        <Button onClick={fetchContratos} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFiltroEstado('todos')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contratos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFiltroEstado('critico')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticos (≤30d)</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticos}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFiltroEstado('vencido')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-2xl font-bold text-gray-600">{stats.vencidos}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFiltroEstado('proximo')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximos (30-60d)</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.proximos}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por propiedad o inquilino..."
                className="pl-10"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="critico">Críticos (≤30d)</SelectItem>
                <SelectItem value="proximo">Próximos (30-60d)</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de contratos */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos por Renovar ({contratosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : contratosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay contratos que coincidan con los filtros
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Renta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratosFiltrados.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell className="font-medium">{contrato.propiedad}</TableCell>
                    <TableCell>
                      <div>
                        <p>{contrato.inquilino}</p>
                        <p className="text-xs text-muted-foreground">{contrato.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(contrato.fechaFin), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>€{contrato.rentaMensual.toLocaleString()}/mes</TableCell>
                    <TableCell>{getEstadoBadge(contrato.diasRestantes)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnviarRecordatorio(contrato)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Renovar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Renovar Contrato</DialogTitle>
                              <DialogDescription>
                                ¿Deseas renovar el contrato de {contrato.propiedad} con {contrato.inquilino}?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm">
                                <strong>Nueva fecha de vencimiento:</strong>{' '}
                                {format(addYears(new Date(contrato.fechaFin), 1), 'dd/MM/yyyy', { locale: es })}
                              </p>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleRenovar(contrato.id)}
                                disabled={renovandoId === contrato.id}
                              >
                                {renovandoId === contrato.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Confirmar Renovación
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
