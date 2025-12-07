'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Users, Star, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipo: 'limpiador',
    capacidadDiaria: 1,
    tarifaHora: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadStaff();
    }
  }, [status, router]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/str-housekeeping/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar personal');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/str-housekeeping/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tarifaHora: formData.tarifaHora ? parseFloat(formData.tarifaHora) : null,
        }),
      });

      if (res.ok) {
        toast.success('Personal creado correctamente');
        setShowDialog(false);
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          tipo: 'limpiador',
          capacidadDiaria: 1,
          tarifaHora: '',
        });
        loadStaff();
      } else {
        toast.error('Error al crear personal');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear personal');
    }
  };

  const handleToggleDisponible = async (staffId: string, disponible: boolean) => {
    try {
      const res = await fetch(`/api/str-housekeeping/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: !disponible }),
      });

      if (res.ok) {
        toast.success('Estado actualizado');
        loadStaff();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar estado');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Personal de Limpieza</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona el personal de limpieza y mantenimiento
                </p>
              </div>
              <Button onClick={() => setShowDialog(true)} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Personal
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Personal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{staff.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {staff.filter((s) => s.disponible).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    No Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {staff.filter((s) => !s.disponible).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Staff List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No hay personal</h3>
                    <p className="text-muted-foreground mb-4">Añade el primer miembro del equipo</p>
                    <Button onClick={() => setShowDialog(true)} className="gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Personal
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                staff.map((s) => (
                  <Card key={s.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{s.nombre}</h3>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={s.disponible ? 'default' : 'secondary'}>
                              {s.disponible ? 'Disponible' : 'No disponible'}
                            </Badge>
                            <Badge variant="outline">
                              {s.tipo === 'limpiador' && 'Limpiador'}
                              {s.tipo === 'supervisor' && 'Supervisor'}
                              {s.tipo === 'mantenimiento' && 'Mantenimiento'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {s.telefono && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {s.telefono}
                          </div>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {s.email}
                          </div>
                        )}
                        {s.calificacionPromedio && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {s.calificacionPromedio.toFixed(1)} / 5.0
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Capacidad diaria:</span>
                          <span className="font-medium">{s.capacidadDiaria} propiedades</span>
                        </div>
                        {s.tarifaHora && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tarifa/hora:</span>
                            <span className="font-medium">€{s.tarifaHora}</span>
                          </div>
                        )}
                        {s.tareasCompletadas > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tareas completadas:</span>
                            <span className="font-medium">{s.tareasCompletadas}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleToggleDisponible(s.id, s.disponible)}
                      >
                        {s.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Dialog Create Staff */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Personal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre completo *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <Label>Teléfono *</Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@example.com"
              />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limpiador">Limpiador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacidad diaria</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacidadDiaria}
                  onChange={(e) =>
                    setFormData({ ...formData, capacidadDiaria: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div>
                <Label>Tarifa por hora (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tarifaHora}
                  onChange={(e) => setFormData({ ...formData, tarifaHora: e.target.value })}
                  placeholder="15.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} className="gradient-primary">
                Añadir Personal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
