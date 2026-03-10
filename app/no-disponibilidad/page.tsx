'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Calendar } from 'lucide-react';

interface Periodo {
  id: string;
  inmuebleId: string;
  inmuebleNombre: string;
  motivo: string;
  fechaDesde: string;
  fechaHasta: string;
  notas: string;
}

const MOTIVOS = ['reforma', 'venta', 'personal', 'otro'];

export default function NoDisponibilidadPage() {
  const { status } = useSession();
  const router = useRouter();
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    inmuebleId: '',
    inmuebleNombre: '',
    motivo: 'reforma',
    fechaDesde: '',
    fechaHasta: '',
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadPeriodos();
  }, [status, router]);

  const loadPeriodos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/no-disponibilidad');
      if (res.ok) {
        const data = await res.json();
        setPeriodos(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Error cargando periodos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/no-disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inmuebleId: form.inmuebleId || 'inv1',
          inmuebleNombre: form.inmuebleNombre || 'Inmueble',
          motivo: form.motivo,
          fechaDesde: form.fechaDesde,
          fechaHasta: form.fechaHasta,
          notas: form.notas,
        }),
      });
      if (res.ok) {
        const nuevo = await res.json();
        setPeriodos((prev) => [nuevo, ...prev]);
        toast.success('Periodo añadido');
        setOpenDialog(false);
        setForm({ inmuebleId: '', inmuebleNombre: '', motivo: 'reforma', fechaDesde: '', fechaHasta: '', notas: '' });
      } else {
        toast.error('Error añadiendo periodo');
      }
    } catch {
      toast.error('Error añadiendo periodo');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto p-4">Cargando...</div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Periodos de No-Disponibilidad</h1>
            <p className="text-sm text-muted-foreground">
              Inmuebles no disponibles temporalmente
            </p>
          </div>
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir periodo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Periodos activos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Se muestran en la integración de calendario
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inmueble</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hasta</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.inmuebleNombre}</TableCell>
                    <TableCell className="capitalize">{p.motivo}</TableCell>
                    <TableCell>{new Date(p.fechaDesde).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>{new Date(p.fechaHasta).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell className="max-w-48 truncate">{p.notas || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir periodo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div>
                <Label>Inmueble</Label>
                <Select
                  value={form.inmuebleId}
                  onValueChange={(v) => {
                    const nombres: Record<string, string> = { inv1: 'Piso Centro Madrid', inv2: 'Ático Barcelona', inv3: 'Chalet Valencia' };
                    setForm({ ...form, inmuebleId: v, inmuebleNombre: nombres[v] || v });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inv1">Piso Centro Madrid</SelectItem>
                    <SelectItem value="inv2">Ático Barcelona</SelectItem>
                    <SelectItem value="inv3">Chalet Valencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Motivo</Label>
                <Select value={form.motivo} onValueChange={(v) => setForm({ ...form, motivo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Desde</Label>
                  <Input
                    type="date"
                    value={form.fechaDesde}
                    onChange={(e) => setForm({ ...form, fechaDesde: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Hasta</Label>
                  <Input
                    type="date"
                    value={form.fechaHasta}
                    onChange={(e) => setForm({ ...form, fechaHasta: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Input
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Notas opcionales"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Añadir</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
