'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  Building2,
  User,
  Euro,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Reservation {
  id: string;
  servicio: string;
  categoria: string;
  proveedor: string;
  cliente: {
    empresa: string;
    contacto: string;
    email: string;
  };
  propiedad: string | null;
  fechaSolicitud: string;
  fechaServicio: string | null;
  precio: number;
  comision: number;
  estado: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
  notas: string | null;
}

interface ReservationStats {
  total: number;
  pendientes: number;
  confirmadas: number;
  completadas: number;
  canceladas: number;
  ingresosMes: number;
  comisionesMes: number;
}

export default function MarketplaceReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setStats({
        total: 156,
        pendientes: 12,
        confirmadas: 28,
        completadas: 108,
        canceladas: 8,
        ingresosMes: 18450,
        comisionesMes: 2768,
      });

      setReservations([
        {
          id: '1',
          servicio: 'Seguro de Alquiler Premium',
          categoria: 'Seguros',
          proveedor: 'Mapfre',
          cliente: {
            empresa: 'Gestiones Madrid SL',
            contacto: 'Carlos Pérez',
            email: 'carlos@gestionesmadrid.es',
          },
          propiedad: 'Calle Mayor 123, Madrid',
          fechaSolicitud: '2026-01-08T10:30:00',
          fechaServicio: null,
          precio: 350,
          comision: 52.50,
          estado: 'pending',
          notas: 'Cliente solicita cobertura extendida',
        },
        {
          id: '2',
          servicio: 'Certificado Energético',
          categoria: 'Certificaciones',
          proveedor: 'CertiHome',
          cliente: {
            empresa: 'Inmuebles BCN',
            contacto: 'Ana García',
            email: 'ana@inmueblesbn.com',
          },
          propiedad: 'Av. Diagonal 456, Barcelona',
          fechaSolicitud: '2026-01-07T14:15:00',
          fechaServicio: '2026-01-10T09:00:00',
          precio: 120,
          comision: 25,
          estado: 'confirmed',
          notas: null,
        },
        {
          id: '3',
          servicio: 'Limpieza Fin de Obra',
          categoria: 'Limpieza',
          proveedor: 'CleanPro',
          cliente: {
            empresa: 'Constructora Sur',
            contacto: 'Miguel López',
            email: 'miguel@construtorasur.es',
          },
          propiedad: 'C/ Nueva 78, Sevilla',
          fechaSolicitud: '2026-01-05T09:00:00',
          fechaServicio: '2026-01-06T08:00:00',
          precio: 450,
          comision: 45,
          estado: 'completed',
          notas: 'Piso de 120m², 3 habitaciones',
        },
        {
          id: '4',
          servicio: 'Home Staging Completo',
          categoria: 'Marketing',
          proveedor: 'StageIt',
          cliente: {
            empresa: 'Premium Homes',
            contacto: 'Laura Martín',
            email: 'laura@premiumhomes.es',
          },
          propiedad: 'Paseo Castellana 200, Madrid',
          fechaSolicitud: '2026-01-04T16:00:00',
          fechaServicio: null,
          precio: 1200,
          comision: 144,
          estado: 'cancelled',
          notas: 'Cliente canceló por venta anticipada',
        },
      ]);
    } catch (error) {
      toast.error('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    toast.success('Reserva confirmada');
    loadData();
  };

  const handleCancel = async (id: string) => {
    toast.success('Reserva cancelada');
    loadData();
  };

  const handleComplete = async (id: string) => {
    toast.success('Reserva marcada como completada');
    loadData();
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmada</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Completada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      case 'disputed':
        return <Badge className="bg-orange-100 text-orange-700"><AlertCircle className="w-3 h-3 mr-1" />En Disputa</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = r.servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservas del Marketplace</h1>
            <p className="text-gray-600 mt-1">Gestiona las reservas de servicios del marketplace</p>
          </div>
          <Button variant="outline" onClick={() => toast.info('Exportando...')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500">Pendientes</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pendientes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500">Confirmadas</p>
                <p className="text-xl font-bold text-blue-600">{stats.confirmadas}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500">Completadas</p>
                <p className="text-xl font-bold text-green-600">{stats.completadas}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500">Canceladas</p>
                <p className="text-xl font-bold text-red-600">{stats.canceladas}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500">Ingresos Mes</p>
                <p className="text-xl font-bold">€{stats.ingresosMes.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-500">Comisiones</p>
                <p className="text-xl font-bold text-purple-600">€{stats.comisionesMes.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por servicio, proveedor o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Fecha Servicio</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.servicio}</p>
                        <p className="text-sm text-gray-500">{reservation.categoria}</p>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.proveedor}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {reservation.cliente.empresa}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {reservation.cliente.contacto}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(reservation.fechaSolicitud), 'dd MMM yyyy HH:mm', { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {reservation.fechaServicio ? (
                        <span className="text-sm">
                          {format(new Date(reservation.fechaServicio), 'dd MMM yyyy', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Por definir</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">€{reservation.precio.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-green-600">€{reservation.comision.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(reservation.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {reservation.estado === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirm(reservation.id)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(reservation.id)}
                              className="text-red-600"
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        {reservation.estado === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComplete(reservation.id)}
                          >
                            Completar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Reserva</DialogTitle>
            </DialogHeader>
            {selectedReservation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Servicio</p>
                    <p className="font-medium">{selectedReservation.servicio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Proveedor</p>
                    <p className="font-medium">{selectedReservation.proveedor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium">{selectedReservation.cliente.empresa}</p>
                    <p className="text-sm text-gray-500">{selectedReservation.cliente.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    {getStatusBadge(selectedReservation.estado)}
                  </div>
                  {selectedReservation.propiedad && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Propiedad</p>
                      <p className="font-medium">{selectedReservation.propiedad}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Precio</p>
                    <p className="font-medium">€{selectedReservation.precio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Comisión</p>
                    <p className="font-medium text-green-600">€{selectedReservation.comision.toFixed(2)}</p>
                  </div>
                </div>
                {selectedReservation.notas && (
                  <div>
                    <p className="text-sm text-gray-500">Notas</p>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedReservation.notas}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
