'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Phone, Mail, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Provider {
  id: string;
  nombre: string;
  tipo: string;
  telefono: string;
  email?: string;
  rating?: number;
  _count?: {
    maintenanceRequests: number;
    expenses: number;
  };
}

export default function ProveedoresPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    tipo: '',
    telefono: '',
    email: '',
    direccion: '',
    rating: '',
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProviders();
    }
  }, [session]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.tipo || !form.telefono) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rating: form.rating ? parseFloat(form.rating) : null,
        }),
      });

      if (res.ok) {
        toast.success('Proveedor creado exitosamente');
        setOpenDialog(false);
        setForm({ nombre: '', tipo: '', telefono: '', email: '', direccion: '', rating: '', notas: '' });
        fetchProviders();
      } else {
        toast.error('Error al crear proveedor');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      toast.error('Error al crear proveedor');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona los proveedores de servicios</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo Proveedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Input
                    id="tipo"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    placeholder="Ej: Fontanería"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Valoración (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notas">Notas</Label>
                  <textarea
                    id="notas"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={form.notas}
                    onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Proveedor</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Proveedores ({providers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay proveedores registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Valoración</TableHead>
                  <TableHead>Servicios</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {provider.telefono}
                        </div>
                        {provider.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {provider.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {provider.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{provider.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          {provider._count?.maintenanceRequests || 0} mantenimientos
                        </span>
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
