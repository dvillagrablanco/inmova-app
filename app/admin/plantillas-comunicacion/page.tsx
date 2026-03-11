'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { MessageSquare, Edit, Eye, Power, PowerOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Plantilla {
  id: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
  tipo: 'email' | 'sms' | 'ambos';
  evento_trigger: 'manual' | 'automatico';
  activa: boolean;
}

type PlantillaFormState = {
  nombre: string;
  asunto: string;
  cuerpo: string;
  tipo: Plantilla['tipo'];
  evento_trigger: Plantilla['evento_trigger'];
};

const VARIABLES_EJEMPLO: Record<string, string> = {
  inquilino_nombre: 'Juan García',
  inmueble_direccion: 'Calle Mayor 123, Piso 1A, Madrid',
  fecha: '15/03/2025',
  importe: '950',
  nombre_saliente: 'María López',
  nombre_entrante: 'Carlos Ruiz',
  horario: '10:00 - 14:00',
  periodo: 'Enero - Marzo 2025',
  hora: '12:00',
  punto_encuentro: 'Portería del edificio',
  punto_entrega: 'Oficina de gestión',
  enlace_firma: 'https://firma.ejemplo.com/abc123',
};

function renderPreview(texto: string): string {
  let out = texto;
  for (const [k, v] of Object.entries(VARIABLES_EJEMPLO)) {
    out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
  }
  return out;
}

export default function PlantillasComunicacionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<Plantilla | null>(null);
  const [previewPlantilla, setPreviewPlantilla] = useState<Plantilla | null>(null);
  const [form, setForm] = useState<PlantillaFormState>({
    nombre: '',
    asunto: '',
    cuerpo: '',
    tipo: 'email',
    evento_trigger: 'manual',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated') return;
    fetchPlantillas();
  }, [status, router]);

  async function fetchPlantillas() {
    setLoading(true);
    try {
      const res = await fetch('/api/plantillas-comunicacion');
      const json = await res.json();
      if (json.success) setPlantillas(json.data ?? []);
    } catch {
      setPlantillas([]);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(p: Plantilla) {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      asunto: p.asunto,
      cuerpo: p.cuerpo,
      tipo: p.tipo,
      evento_trigger: p.evento_trigger,
    });
    setEditOpen(true);
  }

  function openPreview(p: Plantilla) {
    setPreviewPlantilla(p);
    setPreviewOpen(true);
  }

  async function handleSave() {
    if (!editing) return;
    try {
      const res = await fetch('/api/plantillas-comunicacion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          ...form,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Plantilla actualizada');
        setEditOpen(false);
        setEditing(null);
        fetchPlantillas();
      } else {
        toast.error(json.error ?? 'Error al guardar');
      }
    } catch {
      toast.error('Error al guardar');
    }
  }

  async function toggleActiva(p: Plantilla) {
    try {
      const res = await fetch('/api/plantillas-comunicacion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, activa: !p.activa }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(p.activa ? 'Plantilla desactivada' : 'Plantilla activada');
        fetchPlantillas();
      } else {
        toast.error(json.error ?? 'Error');
      }
    } catch {
      toast.error('Error al actualizar');
    }
  }

  if (status === 'loading' || !session) {
    return (
      <AuthenticatedLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold">Plantillas de comunicación</h1>
          <p className="text-muted-foreground">Gestión de plantillas para emails y SMS</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Plantillas disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plantillas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.evento_trigger === 'automatico' ? 'default' : 'secondary'}
                        >
                          {p.evento_trigger}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.activa ? 'default' : 'secondary'}>
                          {p.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPreview(p)}
                            title="Vista previa"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActiva(p)}
                            title={p.activa ? 'Desactivar' : 'Activar'}
                          >
                            {p.activa ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
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

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar plantilla</DialogTitle>
              <DialogDescription>
                Modifica el contenido de la plantilla. Usa variables como {'{{inquilino_nombre}}'},{' '}
                {'{{inmueble_direccion}}'}, {'{{fecha}}'}, {'{{importe}}'}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="asunto">Asunto</Label>
                <Input
                  id="asunto"
                  value={form.asunto}
                  onChange={(e) => setForm((f) => ({ ...f, asunto: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="cuerpo">Cuerpo</Label>
                <Textarea
                  id="cuerpo"
                  value={form.cuerpo}
                  onChange={(e) => setForm((f) => ({ ...f, cuerpo: e.target.value }))}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, tipo: v as 'email' | 'sms' | 'ambos' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Evento trigger</Label>
                  <Select
                    value={form.evento_trigger}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, evento_trigger: v as 'manual' | 'automatico' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatico">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista previa</DialogTitle>
              <DialogDescription>
                {previewPlantilla?.nombre} — Con datos de ejemplo
              </DialogDescription>
            </DialogHeader>
            {previewPlantilla && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div>
                  <Label className="text-muted-foreground">Asunto</Label>
                  <p className="font-medium">{renderPreview(previewPlantilla.asunto)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cuerpo</Label>
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-background p-4 text-sm">
                    {renderPreview(previewPlantilla.cuerpo)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
