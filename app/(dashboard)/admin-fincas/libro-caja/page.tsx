'use client';

import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Euro, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CashBookEntry {
  id: string;
  fecha: string;
  tipo: string;
  concepto: string;
  importe: number;
  saldoActual: number;
  categoria: string;
}

interface Community {
  id: string;
  nombreComunidad: string;
}

export default function LibroCajaPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<CashBookEntry[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [saldoActual, setSaldoActual] = useState(0);
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [formState, setFormState] = useState({
    fecha: '',
    tipo: 'ingreso',
    concepto: '',
    descripcion: '',
    importe: '',
    categoria: 'otros',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCommunities();
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedCommunity) {
      fetchEntries();
    }
  }, [selectedCommunity]);

  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/admin-fincas/communities');
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
        if (data.length > 0) {
          const paramCommunityId = searchParams.get('communityId');
          const exists = paramCommunityId
            ? data.some((community: Community) => community.id === paramCommunityId)
            : false;
          setSelectedCommunity(exists ? (paramCommunityId as string) : data[0].id);
        }
      }
    } catch (error) {
      logger.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    if (!selectedCommunity) return;
    try {
      const res = await fetch(`/api/admin-fincas/cash-book?communityId=${selectedCommunity}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setSaldoActual(data.saldoActual);
      }
    } catch (error) {
      logger.error('Error fetching cash book entries:', error);
    }
  };

  const openNewEntryDialog = () => {
    if (!selectedCommunity) {
      toast.error('Selecciona una comunidad primero');
      return;
    }
    setShowNewEntryDialog(true);
  };

  const handleCreateEntry = async () => {
    if (!selectedCommunity) {
      toast.error('Selecciona una comunidad');
      return;
    }
    if (!formState.concepto.trim() || !formState.importe) {
      toast.error('Completa concepto e importe');
      return;
    }

    try {
      setSavingEntry(true);
      const response = await fetch('/api/admin-fincas/cash-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: selectedCommunity,
          fecha: formState.fecha || undefined,
          tipo: formState.tipo,
          concepto: formState.concepto.trim(),
          descripcion: formState.descripcion.trim() || undefined,
          importe: parseFloat(formState.importe),
          categoria: formState.categoria.trim() || 'otros',
        }),
      });

      if (!response.ok) {
        throw new Error('Error creando movimiento');
      }

      const entry = await response.json();
      setEntries((prev) => [entry, ...prev]);
      setSaldoActual(entry.saldoActual);
      toast.success('Movimiento registrado correctamente');
      setShowNewEntryDialog(false);
      setFormState({
        fecha: '',
        tipo: 'ingreso',
        concepto: '',
        descripcion: '',
        importe: '',
        categoria: 'otros',
      });
    } catch (error) {
      logger.error('Error creating cash book entry:', error);
      toast.error('No se pudo registrar el movimiento');
    } finally {
      setSavingEntry(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Libro de Caja Digital</h1>
                <p className="text-muted-foreground mt-1">
                  Registro de ingresos y gastos por comunidad
                </p>
              </div>
              <Button disabled={!selectedCommunity} onClick={openNewEntryDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Movimiento
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Seleccionar Comunidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una comunidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombreComunidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(saldoActual)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedCommunity && (
              <Card>
                <CardHeader>
                  <CardTitle>Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Euro className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No hay movimientos registrados</h3>
                      <p className="text-muted-foreground mb-4">
                        Comienza registrando el primer movimiento
                      </p>
                      <Button onClick={openNewEntryDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Movimiento
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Fecha</th>
                            <th className="text-left p-2">Tipo</th>
                            <th className="text-left p-2">Concepto</th>
                            <th className="text-left p-2">Categoría</th>
                            <th className="text-right p-2">Importe</th>
                            <th className="text-right p-2">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => (
                            <tr key={entry.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                {format(new Date(entry.fecha), 'dd/MM/yyyy', { locale: es })}
                              </td>
                              <td className="p-2">
                                <div className="flex items-center gap-1">
                                  {entry.tipo === 'ingreso' ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="capitalize">{entry.tipo}</span>
                                </div>
                              </td>
                              <td className="p-2">{entry.concepto}</td>
                              <td className="p-2 capitalize">{entry.categoria}</td>
                              <td
                                className={`p-2 text-right font-semibold ${
                                  entry.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {entry.tipo === 'ingreso' ? '+' : '-'}
                                {new Intl.NumberFormat('es-ES', {
                                  style: 'currency',
                                  currency: 'EUR',
                                }).format(entry.importe)}
                              </td>
                              <td className="p-2 text-right">
                                {new Intl.NumberFormat('es-ES', {
                                  style: 'currency',
                                  currency: 'EUR',
                                }).format(entry.saldoActual)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </AuthenticatedLayout>

        <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Movimiento</DialogTitle>
              <DialogDescription>
                Registra un ingreso o gasto para la comunidad seleccionada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formState.tipo}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="gasto">Gasto</SelectItem>
                    <SelectItem value="traspaso">Traspaso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formState.fecha}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, fecha: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concepto">Concepto</Label>
                <Input
                  id="concepto"
                  placeholder="Ej: Pago de cuota"
                  value={formState.concepto}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, concepto: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  placeholder="Ej: mantenimiento"
                  value={formState.categoria}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, categoria: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="importe">Importe (€)</Label>
                <Input
                  id="importe"
                  type="number"
                  value={formState.importe}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, importe: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Opcional"
                  value={formState.descripcion}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, descripcion: event.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setShowNewEntryDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateEntry} disabled={savingEntry}>
                {savingEntry ? 'Guardando...' : 'Registrar movimiento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  );
}
