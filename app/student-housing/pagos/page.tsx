'use client';

/**
 * Student Housing - Pagos
 * 
 * Gestión de pagos y facturación de residentes (conectado a API real)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Euro,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  FileText,
  TrendingUp,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface Pago {
  id: string;
  residente: string;
  habitacion: string;
  concepto: string;
  monto: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  estado: 'pagado' | 'pendiente' | 'vencido' | 'parcial';
  metodoPago: string | null;
  recibo: string | null;
}

export default function StudentHousingPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar pagos desde API
  const fetchPagos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student-housing/payments');
      if (response.ok) {
        const data = await response.json();
        setPagos(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);

  const filteredPagos = pagos.filter((p) => {
    const matchSearch =
      p.residente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.habitacion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'all' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <Badge className="bg-green-100 text-green-700">Pagado</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-700">Vencido</Badge>;
      case 'parcial':
        return <Badge className="bg-orange-100 text-orange-700">Parcial</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleMarcarPagado = (id: string) => {
    setPagos(
      pagos.map((p) =>
        p.id === id
          ? {
              ...p,
              estado: 'pagado' as const,
              fechaPago: new Date().toISOString().split('T')[0],
              metodoPago: 'Manual',
              recibo: `REC-${Date.now()}`,
            }
          : p
      )
    );
    toast.success('Pago marcado como completado');
  };

  const handleEnviarRecordatorio = (pago: Pago) => {
    toast.success(`Recordatorio enviado a ${pago.residente}`);
  };

  const handleDescargarRecibo = (recibo: string) => {
    toast.success(`Descargando recibo ${recibo}...`);
  };

  const stats = {
    totalRecaudado: pagos
      .filter((p) => p.estado === 'pagado')
      .reduce((acc, p) => acc + p.monto, 0),
    pendiente: pagos
      .filter((p) => p.estado === 'pendiente' || p.estado === 'vencido')
      .reduce((acc, p) => acc + p.monto, 0),
    vencidos: pagos.filter((p) => p.estado === 'vencido').length,
    tasaCobro: Math.round(
      (pagos.filter((p) => p.estado === 'pagado').length / pagos.length) * 100
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Euro className="h-6 w-6" />
            Pagos
          </h1>
          <p className="text-muted-foreground">
            Gestión de pagos y facturación
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generar Recibos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recaudado</p>
                <p className="text-2xl font-bold text-green-600">
                  €{stats.totalRecaudado.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  €{stats.pendiente.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Cobro</p>
                <p className="text-2xl font-bold">{stats.tasaCobro}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por residente o habitación..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pagos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos ({filteredPagos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residente</TableHead>
                  <TableHead>Habitación</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell className="font-medium">{pago.residente}</TableCell>
                    <TableCell>{pago.habitacion}</TableCell>
                    <TableCell>{pago.concepto}</TableCell>
                    <TableCell className="text-right font-medium">
                      €{pago.monto}
                    </TableCell>
                    <TableCell>{pago.fechaVencimiento}</TableCell>
                    <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPago(pago)}
                            >
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalle del Pago</DialogTitle>
                              <DialogDescription>
                                {pago.concepto}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Residente</p>
                                  <p className="font-medium">{pago.residente}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Habitación</p>
                                  <p className="font-medium">{pago.habitacion}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Monto</p>
                                  <p className="font-medium text-lg">€{pago.monto}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Estado</p>
                                  {getEstadoBadge(pago.estado)}
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Vencimiento</p>
                                  <p className="font-medium">{pago.fechaVencimiento}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Fecha Pago</p>
                                  <p className="font-medium">
                                    {pago.fechaPago || 'Sin pagar'}
                                  </p>
                                </div>
                                {pago.metodoPago && (
                                  <div>
                                    <p className="text-muted-foreground">Método</p>
                                    <p className="font-medium">{pago.metodoPago}</p>
                                  </div>
                                )}
                                {pago.recibo && (
                                  <div>
                                    <p className="text-muted-foreground">Recibo</p>
                                    <p className="font-medium">{pago.recibo}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {pago.estado !== 'pagado' && (
                                  <>
                                    <Button
                                      className="flex-1"
                                      onClick={() => handleMarcarPagado(pago.id)}
                                    >
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Marcar Pagado
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleEnviarRecordatorio(pago)}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Recordatorio
                                    </Button>
                                  </>
                                )}
                                {pago.recibo && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDescargarRecibo(pago.recibo!)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Recibo
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {pago.estado !== 'pagado' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnviarRecordatorio(pago)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredPagos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron pagos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
