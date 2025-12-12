'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  DoorOpen,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Euro,
  Calendar,
  CheckCircle,
  FileText,
  Home,
  Bed,
  Bath,
  Wind,
  Table,
  Armchair,
  Sun,
  Check,
  X,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import logger from '@/lib/logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [room, setRoom] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [contractData, setContractData] = useState<any>({
    tenantId: '',
    fechaInicio: '',
    fechaFin: '',
    rentaMensual: '',
    diaPago: '1',
    deposito: '',
    gastosIncluidos: [],
  });

  const roomId = params?.roomId as string;
  const unitId = params?.unitId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && roomId) {
      loadData();
    }
  }, [status, roomId, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [roomRes, tenantsRes] = await Promise.all([
        fetch(`/api/room-rental/rooms/${roomId}`),
        fetch('/api/tenants'),
      ]);

      if (roomRes.ok) {
        const roomData = await roomRes.json();
        setRoom(roomData);
        setFormData({
          nombre: roomData.nombre || '',
          superficie: roomData.superficie,
          tipoHabitacion: roomData.tipoHabitacion,
          precioPorMes: roomData.precioPorMes,
          precioPorSemana: roomData.precioPorSemana || '',
          bajoPrivado: roomData.bajoPrivado,
          balcon: roomData.balcon,
          escritorio: roomData.escritorio,
          armarioEmpotrado: roomData.armarioEmpotrado,
          aireAcondicionado: roomData.aireAcondicionado,
          calefaccion: roomData.calefaccion,
          amueblada: roomData.amueblada,
          cama: roomData.cama || '',
          mesaNoche: roomData.mesaNoche,
          cajonera: roomData.cajonera,
          estanteria: roomData.estanteria,
          silla: roomData.silla,
          descripcion: roomData.descripcion || '',
        });
        setContractData({
          ...contractData,
          rentaMensual: roomData.precioPorMes,
        });
      }

      if (tenantsRes.ok) setTenants(await tenantsRes.json());
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRoom(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/room-rental/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Habitación actualizada correctamente');
        setShowEditDialog(false);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al actualizar habitación');
      }
    } catch (error) {
      logger.error('Error updating room:', error);
      toast.error('Error al actualizar habitación');
    }
  }

  async function handleCreateContract(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/room-rental/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contractData, roomId }),
      });

      if (res.ok) {
        toast.success('Contrato creado correctamente');
        setShowContractDialog(false);
        setContractData({
          tenantId: '',
          fechaInicio: '',
          fechaFin: '',
          rentaMensual: room?.precioPorMes || '',
          diaPago: '1',
          deposito: '',
          gastosIncluidos: [],
        });
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear contrato');
      }
    } catch (error) {
      logger.error('Error creating contract:', error);
      toast.error('Error al crear contrato');
    }
  }

  async function handleDeleteRoom() {
    if (!confirm('¿Estás seguro de eliminar esta habitación? Esta acción no se puede deshacer.'))
      return;

    try {
      const res = await fetch(`/api/room-rental/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Habitación eliminada correctamente');
        router.push(`/room-rental/${unitId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al eliminar habitación');
      }
    } catch (error) {
      logger.error('Error deleting room:', error);
      toast.error('Error al eliminar habitación');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-0 lg:ml-64">
          <Header />
          <main className="p-6">
            <div className="text-center py-12">Cargando...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-0 lg:ml-64">
          <Header />
          <main className="p-6">
            <div className="text-center py-12">
              <p className="text-red-600">Habitación no encontrada</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const activeContract = room.contracts?.find((c: any) => c.estado === 'activo');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-64">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <DoorOpen className="mr-3 h-8 w-8 text-blue-600" />
                  Habitación {room.numero}
                  {room.nombre && (
                    <span className="text-gray-600 text-2xl ml-2">({room.nombre})</span>
                  )}
                </h1>
                <p className="text-gray-600">
                  {room.unit?.building?.nombre} - Unidad {room.unit?.numero}
                </p>
              </div>
              <div className="space-x-2">
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleUpdateRoom}>
                      <DialogHeader>
                        <DialogTitle>Editar Habitación</DialogTitle>
                        <DialogDescription>
                          Actualiza la información de la habitación
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div>
                          <Label htmlFor="nombre">Nombre</Label>
                          <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Habitación Azul"
                          />
                        </div>
                        <div>
                          <Label htmlFor="superficie">Superficie (m²)</Label>
                          <Input
                            id="superficie"
                            type="number"
                            step="0.1"
                            value={formData.superficie}
                            onChange={(e) =>
                              setFormData({ ...formData, superficie: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="precioPorMes">Precio/Mes (€)</Label>
                          <Input
                            id="precioPorMes"
                            type="number"
                            step="0.01"
                            value={formData.precioPorMes}
                            onChange={(e) =>
                              setFormData({ ...formData, precioPorMes: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="precioPorSemana">Precio/Semana (€)</Label>
                          <Input
                            id="precioPorSemana"
                            type="number"
                            step="0.01"
                            value={formData.precioPorSemana}
                            onChange={(e) =>
                              setFormData({ ...formData, precioPorSemana: e.target.value })
                            }
                            placeholder="Opcional"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="descripcion">Descripción</Label>
                          <Input
                            id="descripcion"
                            value={formData.descripcion}
                            onChange={(e) =>
                              setFormData({ ...formData, descripcion: e.target.value })
                            }
                            placeholder="Descripción de la habitación"
                          />
                        </div>

                        <div className="col-span-2 border-t pt-4">
                          <h3 className="font-semibold mb-3">Características</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { key: 'bajoPrivado', label: 'Baño Privado' },
                              { key: 'balcon', label: 'Balcón' },
                              { key: 'escritorio', label: 'Escritorio' },
                              { key: 'armarioEmpotrado', label: 'Armario Empotrado' },
                              { key: 'aireAcondicionado', label: 'Aire Acondicionado' },
                              { key: 'calefaccion', label: 'Calefacción' },
                              { key: 'mesaNoche', label: 'Mesa de Noche' },
                              { key: 'cajonera', label: 'Cajonera' },
                              { key: 'estanteria', label: 'Estantería' },
                              { key: 'silla', label: 'Silla' },
                            ].map((feature) => (
                              <div key={feature.key} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={feature.key}
                                  checked={formData[feature.key]}
                                  onChange={(e) =>
                                    setFormData({ ...formData, [feature.key]: e.target.checked })
                                  }
                                  className="h-4 w-4"
                                />
                                <Label htmlFor={feature.key} className="text-sm">
                                  {feature.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEditDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">Guardar Cambios</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button variant="destructive" onClick={handleDeleteRoom}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Información Principal */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Habitación</p>
                        <p className="font-medium capitalize">{room.tipoHabitacion}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Superficie</p>
                        <p className="font-medium">{room.superficie}m²</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Precio Mensual</p>
                        <p className="font-medium text-green-600">€{room.precioPorMes}/mes</p>
                      </div>
                      {room.precioPorSemana && (
                        <div>
                          <p className="text-sm text-gray-600">Precio Semanal</p>
                          <p className="font-medium text-green-600">
                            €{room.precioPorSemana}/semana
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Estado</p>
                        <Badge variant={room.estado === 'disponible' ? 'default' : 'secondary'}>
                          {room.estado}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Amueblada</p>
                        <p className="font-medium">{room.amueblada ? 'Sí' : 'No'}</p>
                      </div>
                    </div>

                    {room.descripcion && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-1">Descripción</p>
                        <p className="text-gray-800">{room.descripcion}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Características y Equipamiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { icon: Bath, label: 'Baño Privado', value: room.bajoPrivado },
                        { icon: Sun, label: 'Balcón', value: room.balcon },
                        { icon: Table, label: 'Escritorio', value: room.escritorio },
                        {
                          icon: DoorOpen,
                          label: 'Armario Empotrado',
                          value: room.armarioEmpotrado,
                        },
                        { icon: Wind, label: 'Aire Acondicionado', value: room.aireAcondicionado },
                        { icon: Wind, label: 'Calefacción', value: room.calefaccion },
                        { icon: Bed, label: room.cama || 'Cama', value: true },
                        { icon: Table, label: 'Mesa de Noche', value: room.mesaNoche },
                        { icon: DoorOpen, label: 'Cajonera', value: room.cajonera },
                        { icon: DoorOpen, label: 'Estantería', value: room.estanteria },
                        { icon: Armchair, label: 'Silla', value: room.silla },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <item.icon
                            className={`h-5 w-5 ${item.value ? 'text-green-600' : 'text-gray-400'}`}
                          />
                          <span className={item.value ? 'text-gray-900' : 'text-gray-400'}>
                            {item.label}
                          </span>
                          {item.value ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contratos */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Contratos</CardTitle>
                      {room.estado === 'disponible' && (
                        <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              Nuevo Contrato
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <form onSubmit={handleCreateContract}>
                              <DialogHeader>
                                <DialogTitle>Crear Contrato de Habitación</DialogTitle>
                                <DialogDescription>
                                  Asigna esta habitación a un inquilino
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="col-span-2">
                                  <Label htmlFor="tenantId">Inquilino *</Label>
                                  <Select
                                    value={contractData.tenantId}
                                    onValueChange={(value) =>
                                      setContractData({ ...contractData, tenantId: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona un inquilino" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tenants.map((tenant) => (
                                        <SelectItem key={tenant.id} value={tenant.id}>
                                          {tenant.nombreCompleto} - {tenant.email}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="fechaInicio">Fecha Inicio *</Label>
                                  <Input
                                    id="fechaInicio"
                                    type="date"
                                    value={contractData.fechaInicio}
                                    onChange={(e) =>
                                      setContractData({
                                        ...contractData,
                                        fechaInicio: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="fechaFin">Fecha Fin *</Label>
                                  <Input
                                    id="fechaFin"
                                    type="date"
                                    value={contractData.fechaFin}
                                    onChange={(e) =>
                                      setContractData({ ...contractData, fechaFin: e.target.value })
                                    }
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="rentaMensual">Renta Mensual (€) *</Label>
                                  <Input
                                    id="rentaMensual"
                                    type="number"
                                    step="0.01"
                                    value={contractData.rentaMensual}
                                    onChange={(e) =>
                                      setContractData({
                                        ...contractData,
                                        rentaMensual: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="diaPago">Día de Pago</Label>
                                  <Input
                                    id="diaPago"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={contractData.diaPago}
                                    onChange={(e) =>
                                      setContractData({ ...contractData, diaPago: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label htmlFor="deposito">Depósito (€)</Label>
                                  <Input
                                    id="deposito"
                                    type="number"
                                    step="0.01"
                                    value={contractData.deposito}
                                    onChange={(e) =>
                                      setContractData({ ...contractData, deposito: e.target.value })
                                    }
                                    placeholder="Opcional"
                                  />
                                </div>
                              </div>

                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowContractDialog(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button type="submit">Crear Contrato</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {room.contracts && room.contracts.length > 0 ? (
                      <div className="space-y-4">
                        {room.contracts.map((contract: any) => (
                          <div key={contract.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-gray-500" />
                                <span className="font-medium">
                                  {contract.tenant?.nombreCompleto}
                                </span>
                              </div>
                              <Badge
                                variant={contract.estado === 'activo' ? 'default' : 'secondary'}
                              >
                                {contract.estado}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Periodo:</span>
                                <p className="font-medium">
                                  {format(new Date(contract.fechaInicio), 'dd/MM/yyyy', {
                                    locale: es,
                                  })}{' '}
                                  -{' '}
                                  {format(new Date(contract.fechaFin), 'dd/MM/yyyy', {
                                    locale: es,
                                  })}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Renta:</span>
                                <p className="font-medium text-green-600">
                                  €{contract.rentaMensual}/mes
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-8">
                        No hay contratos para esta habitación
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {activeContract && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Inquilino Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-gray-500" />
                          <span className="font-medium">
                            {activeContract.tenant?.nombreCompleto}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">Email: {activeContract.tenant?.email}</p>
                          <p className="text-gray-600">
                            Teléfono: {activeContract.tenant?.telefono}
                          </p>
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-600">Contrato hasta:</p>
                          <p className="font-medium">
                            {format(new Date(activeContract.fechaFin), 'dd MMMM yyyy', {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setShowEditDialog(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Habitación
                    </Button>
                    {room.estado === 'disponible' && (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => setShowContractDialog(true)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Crear Contrato
                      </Button>
                    )}
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => router.push(`/room-rental/${unitId}`)}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Ver Todas las Habitaciones
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
