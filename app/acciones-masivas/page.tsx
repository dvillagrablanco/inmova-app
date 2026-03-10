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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Play, Package, Clock, Euro } from 'lucide-react';
import { ModuleAIAssistant } from '@/components/ai/ModuleAIAssistant';

interface BatchOp {
  id: string;
  tipo: string;
  entidades: string[];
  concepto: string;
  importe: number;
  estado: string;
  fechaCreacion: string;
  fechaProcesamiento: string | null;
}

export default function AccionesMasivasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [batches, setBatches] = useState<BatchOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cobros');
  const [form, setForm] = useState({
    entidad: '',
    concepto: '',
    importe: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadBatches();
  }, [status, router]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/acciones-masivas');
      if (res.ok) {
        const data = await res.json();
        setBatches(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Error cargando lotes');
    } finally {
      setLoading(false);
    }
  };

  const tipoFromTab = () => {
    if (activeTab === 'cobros') return 'cobro_masivo';
    if (activeTab === 'gastos') return 'gasto_masivo';
    return 'transferencia';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/acciones-masivas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoFromTab(),
          entidades: form.entidad ? [form.entidad] : ['Entidad genérica'],
          concepto: form.concepto || 'Sin concepto',
          importe: Number(form.importe) || 0,
        }),
      });
      if (res.ok) {
        const nuevo = await res.json();
        setBatches((prev) => [nuevo, ...prev]);
        toast.success('Lote creado correctamente');
        setForm({ ...form, concepto: '', importe: '', entidad: '' });
      } else {
        toast.error('Error creando lote');
      }
    } catch {
      toast.error('Error creando lote');
    }
  };

  const handleExecute = () => {
    toast.info('Ejecución de lotes pendientes (mock)');
  };

  const pendientes = batches.filter((b) => b.estado === 'pendiente');
  const ultimoProcesado = batches.find((b) => b.estado === 'procesado');
  const totalProcesado = batches
    .filter((b) => b.estado === 'procesado')
    .reduce((s, b) => s + b.importe, 0);

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
        <div>
          <h1 className="text-2xl font-bold">Acciones Masivas</h1>
          <p className="text-sm text-muted-foreground">
            Cobros, gastos y transferencias en lote
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Package className="h-5 w-5 mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">Lotes pendientes</p>
              <p className="text-xl font-bold">{pendientes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Clock className="h-5 w-5 mb-1 text-amber-600" />
              <p className="text-xs text-muted-foreground">Último procesado</p>
              <p className="text-sm font-bold truncate">
                {ultimoProcesado
                  ? new Date(ultimoProcesado.fechaProcesamiento!).toLocaleDateString('es-ES')
                  : '-'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Euro className="h-5 w-5 mb-1 text-green-600" />
              <p className="text-xs text-muted-foreground">Total procesado</p>
              <p className="text-xl font-bold">{totalProcesado.toLocaleString('es-ES')} €</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="cobros">Cobros masivos</TabsTrigger>
            <TabsTrigger value="gastos">Gastos masivos</TabsTrigger>
            <TabsTrigger value="transferencias">Transferencias</TabsTrigger>
          </TabsList>
          <TabsContent value="cobros" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nuevo cobro masivo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Rango fechas</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="date"
                        value={form.fechaDesde}
                        onChange={(e) => setForm({ ...form, fechaDesde: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={form.fechaHasta}
                        onChange={(e) => setForm({ ...form, fechaHasta: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Entidad (inmueble/inquilino)</Label>
                    <Select
                      value={form.entidad}
                      onValueChange={(v) => setForm({ ...form, entidad: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inm1">Inmueble A</SelectItem>
                        <SelectItem value="inm2">Inmueble B</SelectItem>
                        <SelectItem value="inq1">Inquilino 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Concepto</Label>
                    <Input
                      value={form.concepto}
                      onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                      placeholder="Ej: Alquiler enero"
                    />
                  </div>
                  <div>
                    <Label>Importe (€)</Label>
                    <Input
                      type="number"
                      value={form.importe}
                      onChange={(e) => setForm({ ...form, importe: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit">Añadir a lote</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="gastos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nuevo gasto masivo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Rango fechas</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="date"
                        value={form.fechaDesde}
                        onChange={(e) => setForm({ ...form, fechaDesde: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={form.fechaHasta}
                        onChange={(e) => setForm({ ...form, fechaHasta: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Entidad</Label>
                    <Select value={form.entidad} onValueChange={(v) => setForm({ ...form, entidad: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inm1">Inmueble A</SelectItem>
                        <SelectItem value="inm2">Inmueble B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Concepto</Label>
                    <Input
                      value={form.concepto}
                      onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                      placeholder="Ej: IBI trimestral"
                    />
                  </div>
                  <div>
                    <Label>Importe (€)</Label>
                    <Input
                      type="number"
                      value={form.importe}
                      onChange={(e) => setForm({ ...form, importe: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit">Añadir a lote</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="transferencias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nueva transferencia</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Concepto</Label>
                    <Input
                      value={form.concepto}
                      onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                      placeholder="Ej: Traspaso fondos"
                    />
                  </div>
                  <div>
                    <Label>Importe (€)</Label>
                    <Input
                      type="number"
                      value={form.importe}
                      onChange={(e) => setForm({ ...form, importe: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit">Añadir a lote</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lotes pendientes</CardTitle>
            <Button onClick={handleExecute} disabled={pendientes.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Ejecutar lote
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidades</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha creación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="capitalize">{b.tipo.replace('_', ' ')}</TableCell>
                    <TableCell>{b.entidades.join(', ')}</TableCell>
                    <TableCell>{b.concepto}</TableCell>
                    <TableCell>{b.importe.toLocaleString('es-ES')} €</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          b.estado === 'procesado'
                            ? 'default'
                            : b.estado === 'error'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {b.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(b.fechaCreacion).toLocaleString('es-ES')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <ModuleAIAssistant module="acciones-masivas" />
    </AuthenticatedLayout>
  );
}
