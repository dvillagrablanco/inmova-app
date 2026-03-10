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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';

interface CustomField {
  id: string;
  entidad: string;
  nombre: string;
  tipo: string;
  obligatorio: boolean;
  opciones?: string[];
  orden: number;
  activo: boolean;
}

const ENTIDADES = ['inmueble', 'inquilino', 'contrato', 'incidencia', 'propietario'];
const TIPOS = ['texto', 'numero', 'fecha', 'select', 'checkbox'];

export default function CamposPersonalizadosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [entidad, setEntidad] = useState('inmueble');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'texto',
    obligatorio: false,
    opciones: '',
    orden: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadFields();
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && entidad) loadFields();
  }, [entidad]);

  const loadFields = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campos-personalizados?entidad=${entidad}`);
      if (res.ok) {
        const data = await res.json();
        setFields(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Error cargando campos');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ nombre: '', tipo: 'texto', obligatorio: false, opciones: '', orden: fields.length });
    setOpenDialog(true);
  };

  const openEdit = (f: CustomField) => {
    setEditing(f);
    setForm({
      nombre: f.nombre,
      tipo: f.tipo,
      obligatorio: f.obligatorio,
      opciones: (f.opciones || []).join(', '),
      orden: f.orden,
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      const opcionesArr = form.opciones ? form.opciones.split(',').map((s) => s.trim()).filter(Boolean) : [];
      if (editing) {
        const res = await fetch('/api/admin/campos-personalizados', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editing.id,
            nombre: form.nombre,
            tipo: form.tipo,
            obligatorio: form.obligatorio,
            opciones: form.tipo === 'select' ? opcionesArr : undefined,
            orden: form.orden,
          }),
        });
        if (res.ok) {
          toast.success('Campo actualizado');
          setOpenDialog(false);
          loadFields();
        } else toast.error('Error actualizando');
      } else {
        const res = await fetch('/api/admin/campos-personalizados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entidad,
            nombre: form.nombre,
            tipo: form.tipo,
            obligatorio: form.obligatorio,
            opciones: form.tipo === 'select' ? opcionesArr : undefined,
            orden: form.orden,
          }),
        });
        if (res.ok) {
          toast.success('Campo creado');
          setOpenDialog(false);
          loadFields();
        } else toast.error('Error creando');
      }
    } catch {
      toast.error('Error guardando');
    }
  };

  const toggleActivo = async (f: CustomField) => {
    try {
      const res = await fetch('/api/admin/campos-personalizados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: f.id,
          nombre: f.nombre,
          tipo: f.tipo,
          obligatorio: f.obligatorio,
          opciones: f.opciones,
          orden: f.orden,
          activo: !f.activo,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFields((prev) => prev.map((x) => (x.id === f.id ? { ...x, ...updated } : x)));
        toast.success(f.activo ? 'Campo desactivado' : 'Campo activado');
      }
    } catch {
      toast.error('Error actualizando');
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campos Personalizados</h1>
            <p className="text-sm text-muted-foreground">
              Definir campos adicionales por tipo de entidad
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir campo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entidad</CardTitle>
            <Select value={entidad} onValueChange={setEntidad}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTIDADES.map((e) => (
                  <SelectItem key={e} value={e} className="capitalize">
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Obligatorio</TableHead>
                  <TableHead>Opciones</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Cargando...</TableCell>
                  </TableRow>
                ) : (
                  fields.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.nombre}</TableCell>
                      <TableCell>{f.tipo}</TableCell>
                      <TableCell>{f.obligatorio ? 'Sí' : 'No'}</TableCell>
                      <TableCell className="max-w-32 truncate">
                        {f.opciones?.join(', ') || '-'}
                      </TableCell>
                      <TableCell>{f.orden}</TableCell>
                      <TableCell>
                        <Badge variant={f.activo ? 'default' : 'secondary'}>
                          {f.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActivo(f)}
                            title={f.activo ? 'Desactivar' : 'Activar'}
                          >
                            {f.activo ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar campo' : 'Nuevo campo'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Referencia catastral"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="obligatorio"
                  checked={form.obligatorio}
                  onCheckedChange={(c) => setForm({ ...form, obligatorio: !!c })}
                />
                <Label htmlFor="obligatorio">Obligatorio</Label>
              </div>
              {form.tipo === 'select' && (
                <div>
                  <Label>Opciones (separadas por coma)</Label>
                  <Input
                    value={form.opciones}
                    onChange={(e) => setForm({ ...form, opciones: e.target.value })}
                    placeholder="Opción 1, Opción 2, Opción 3"
                  />
                </div>
              )}
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm({ ...form, orden: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
