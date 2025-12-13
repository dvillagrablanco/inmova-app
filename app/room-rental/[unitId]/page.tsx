'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  DoorOpen,
  Plus,
  Edit,
  Users,
  Euro,
  Calendar,
  Calculator,
  Trash2,
  Home,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import logger, { logError } from '@/lib/logger';

export default function UnitRoomsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [unit, setUnit] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProrationDialog, setShowProrationDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({
    numero: '',
    nombre: '',
    superficie: '',
    tipoHabitacion: 'individual',
    precioPorMes: '',
    bajoPrivado: false,
    amueblada: true,
  });

  const unitId = params?.unitId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && unitId) {
      loadData();
    }
  }, [status, unitId, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [unitRes, roomsRes] = await Promise.all([
        fetch(`/api/units/${unitId}`),
        fetch(`/api/room-rental/rooms?unitId=${unitId}`),
      ]);

      if (unitRes.ok) setUnit(await unitRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/room-rental/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, unitId }),
      });

      if (res.ok) {
        toast.success('Habitación creada correctamente');
        setShowCreateDialog(false);
        setFormData({
          numero: '',
          nombre: '',
          superficie: '',
          tipoHabitacion: 'individual',
          precioPorMes: '',
          bajoPrivado: false,
          amueblada: true,
        });
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear habitación');
      }
    } catch (error) {
      logger.error('Error creating room:', error);
      toast.error('Error al crear habitación');
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
                  ← Volver
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">
                  {unit?.building?.nombre} - Unidad {unit?.numero}
                </h1>
                <p className="text-gray-600">Gestiona las habitaciones de esta unidad</p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/room-rental/${unitId}/proration`)}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Prorratear Suministros
                </Button>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Habitación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <form onSubmit={handleCreateRoom}>
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Habitación</DialogTitle>
                        <DialogDescription>
                          Agrega una nueva habitación a esta unidad para alquiler
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div>
                          <Label htmlFor="numero">Número *</Label>
                          <Input
                            id="numero"
                            value={formData.numero}
                            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                            required
                          />
                        </div>
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
                          <Label htmlFor="superficie">Superficie (m²) *</Label>
                          <Input
                            id="superficie"
                            type="number"
                            step="0.1"
                            value={formData.superficie}
                            onChange={(e) =>
                              setFormData({ ...formData, superficie: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="precioPorMes">Precio/Mes (€) *</Label>
                          <Input
                            id="precioPorMes"
                            type="number"
                            step="0.01"
                            value={formData.precioPorMes}
                            onChange={(e) =>
                              setFormData({ ...formData, precioPorMes: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tipoHabitacion">Tipo de Habitación</Label>
                          <Select
                            value={formData.tipoHabitacion}
                            onValueChange={(value) =>
                              setFormData({ ...formData, tipoHabitacion: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="doble">Doble</SelectItem>
                              <SelectItem value="suite">Suite</SelectItem>
                              <SelectItem value="estudio">Estudio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="bajoPrivado"
                              checked={formData.bajoPrivado}
                              onChange={(e) =>
                                setFormData({ ...formData, bajoPrivado: e.target.checked })
                              }
                              className="h-4 w-4"
                            />
                            <Label htmlFor="bajoPrivado">Baño Privado</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="amueblada"
                              checked={formData.amueblada}
                              onChange={(e) =>
                                setFormData({ ...formData, amueblada: e.target.checked })
                              }
                              className="h-4 w-4"
                            />
                            <Label htmlFor="amueblada">Amueblada</Label>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">Crear Habitación</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Lista de Habitaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Habitación {room.numero}
                          {room.nombre && (
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              ({room.nombre})
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>{room.tipoHabitacion}</CardDescription>
                      </div>
                      <Badge variant={room.estado === 'disponible' ? 'default' : 'secondary'}>
                        {room.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Superficie:</span>
                          <p className="font-medium">{room.superficie}m²</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Precio:</span>
                          <p className="font-medium text-green-600">€{room.precioPorMes}/mes</p>
                        </div>
                      </div>

                      {room.contracts && room.contracts.length > 0 && (
                        <div className="border-t pt-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {room.contracts[0].tenant?.nombreCompleto}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/room-rental/${unitId}/rooms/${room.id}`)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {rooms.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <DoorOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">
                        No hay habitaciones creadas en esta unidad
                      </p>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Primera Habitación
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
