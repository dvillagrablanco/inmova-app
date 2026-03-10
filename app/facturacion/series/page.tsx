'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Power,
  PowerOff,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
interface SerieFacturacion {
  id: string;
  prefijo: string;
  nombre: string;
  ultimoNumero: number;
  impuestoPorDefecto: { iva: number; irpf: number };
  activa: boolean;
  createdAt: string;
  companyId: string;
}

export default function SeriesFacturacionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [series, setSeries] = useState<SerieFacturacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState<SerieFacturacion | null>(null);
  const [form, setForm] = useState({ prefijo: '', nombre: '', iva: 21, irpf: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) loadSeries();
  }, [session]);

  const loadSeries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/facturacion/series');
      if (res.ok) {
        const json = await res.json();
        setSeries(json.data || []);
      } else {
        toast.error('Error al cargar series');
      }
    } catch {
      toast.error('Error al cargar series');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.prefijo.trim() || !form.nombre.trim()) {
      toast.error('Prefijo y nombre son obligatorios');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/facturacion/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefijo: form.prefijo.trim(),
          nombre: form.nombre.trim(),
          impuestoPorDefecto: { iva: form.iva, irpf: form.irpf },
        }),
      });
      if (res.ok) {
        toast.success('Serie creada correctamente');
        setShowCreate(false);
        setForm({ prefijo: '', nombre: '', iva: 21, irpf: 0 });
        loadSeries();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al crear serie');
      }
    } catch {
      toast.error('Error al crear serie');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (serie: SerieFacturacion) => {
    setSelectedSerie(serie);
    setForm({
      prefijo: serie.prefijo,
      nombre: serie.nombre,
      iva: serie.impuestoPorDefecto.iva,
      irpf: serie.impuestoPorDefecto.irpf,
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSerie) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/facturacion/series/${selectedSerie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefijo: form.prefijo.trim(),
          nombre: form.nombre.trim(),
          impuestoPorDefecto: { iva: form.iva, irpf: form.irpf },
        }),
      });
      if (res.ok) {
        toast.success('Serie actualizada');
        setShowEdit(false);
        setSelectedSerie(null);
        loadSeries();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al actualizar');
      }
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActiva = async (serie: SerieFacturacion) => {
    try {
      const res = await fetch(`/api/facturacion/series/${serie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !serie.activa }),
      });
      if (res.ok) {
        toast.success(serie.activa ? 'Serie desactivada' : 'Serie activada');
        loadSeries();
      } else {
        toast.error('Error al cambiar estado');
      }
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/facturacion')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Series de facturación</h1>
            <p className="text-muted-foreground">
              Gestiona las series para facturas, proformas y rectificativas
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Series
                </CardTitle>
                <CardDescription>Prefijos y configuración por defecto</CardDescription>
              </div>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva serie
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Cargando...</div>
            ) : series.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay series. Crea la primera.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prefijo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Último nº</TableHead>
                    <TableHead>IVA%</TableHead>
                    <TableHead>IRPF%</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {series.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-medium">{s.prefijo}</TableCell>
                      <TableCell>{s.nombre}</TableCell>
                      <TableCell>{s.ultimoNumero}</TableCell>
                      <TableCell>{s.impuestoPorDefecto.iva}%</TableCell>
                      <TableCell>{s.impuestoPorDefecto.irpf}%</TableCell>
                      <TableCell>
                        <Badge variant={s.activa ? 'default' : 'secondary'}>
                          {s.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(s)}
                            disabled={!s.activa}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActiva(s)}
                            title={s.activa ? 'Desactivar' : 'Activar'}
                          >
                            {s.activa ? (
                              <PowerOff className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Power className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog Crear */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva serie</DialogTitle>
              <DialogDescription>
                Crea una nueva serie de facturación (ej: A-, AB-, etc.)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Prefijo</Label>
                <Input
                  placeholder="Ej: F-, P-, R-"
                  value={form.prefijo}
                  onChange={(e) => setForm({ ...form, prefijo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej: Facturas"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IVA % por defecto</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.iva}
                    onChange={(e) => setForm({ ...form, iva: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IRPF % por defecto</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.irpf}
                    onChange={(e) => setForm({ ...form, irpf: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? 'Creando...' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Editar */}
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar serie</DialogTitle>
              <DialogDescription>
                Modifica la serie {selectedSerie?.prefijo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Prefijo</Label>
                <Input
                  value={form.prefijo}
                  onChange={(e) => setForm({ ...form, prefijo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IVA % por defecto</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.iva}
                    onChange={(e) => setForm({ ...form, iva: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IRPF % por defecto</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.irpf}
                    onChange={(e) => setForm({ ...form, irpf: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEdit(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
