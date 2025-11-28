'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
  id: string;
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
  building?: { nombre: string };
  unit?: { numero: string };
  provider?: { nombre: string };
}

export default function GastosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [form, setForm] = useState({
    concepto: '',
    categoria: 'otro',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchExpenses();
    }
  }, [session]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concepto || !form.categoria || !form.monto || !form.fecha) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success('Gasto registrado exitosamente');
        setOpenDialog(false);
        setForm({ concepto: '', categoria: 'otro', monto: '', fecha: new Date().toISOString().split('T')[0], notas: '' });
        fetchExpenses();
      } else {
        toast.error('Error al registrar gasto');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Error al registrar gasto');
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      mantenimiento: 'Mantenimiento',
      impuestos: 'Impuestos',
      seguros: 'Seguros',
      servicios: 'Servicios',
      reparaciones: 'Reparaciones',
      comunidad: 'Comunidad',
      otro: 'Otro',
    };
    return labels[categoria] || categoria;
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      mantenimiento: 'bg-blue-500',
      impuestos: 'bg-red-500',
      seguros: 'bg-purple-500',
      servicios: 'bg-green-500',
      reparaciones: 'bg-orange-500',
      comunidad: 'bg-indigo-500',
      otro: 'bg-gray-500',
    };
    return colors[categoria] || 'bg-gray-500';
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filterCategoria === 'all') return true;
    return expense.categoria === filterCategoria;
  });

  const totalGastos = filteredExpenses.reduce((sum, exp) => sum + exp.monto, 0);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Cargando gastos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gastos</h1>
          <p className="text-muted-foreground">Registra y controla todos los gastos</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="concepto">Concepto *</Label>
                <Input
                  id="concepto"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  placeholder="Ej: Reparación ascensor"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Select
                    value={form.categoria}
                    onValueChange={(value) => setForm({ ...form, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="impuestos">Impuestos</SelectItem>
                      <SelectItem value="seguros">Seguros</SelectItem>
                      <SelectItem value="servicios">Servicios</SelectItem>
                      <SelectItem value="reparaciones">Reparaciones</SelectItem>
                      <SelectItem value="comunidad">Comunidad</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="monto">Monto (€) *</Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="notas">Notas</Label>
                <textarea
                  id="notas"
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Gasto</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Gastos {filterCategoria !== 'all' ? `(${getCategoriaLabel(filterCategoria)})` : ''}</p>
              <p className="text-3xl font-bold">{totalGastos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtro por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="impuestos">Impuestos</SelectItem>
              <SelectItem value="seguros">Seguros</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="reparaciones">Reparaciones</SelectItem>
              <SelectItem value="comunidad">Comunidad</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Gastos Registrados ({filteredExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay gastos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.fecha).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="font-medium">{expense.concepto}</TableCell>
                    <TableCell>
                      <Badge className={getCategoriaColor(expense.categoria)}>
                        {getCategoriaLabel(expense.categoria)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.building && <span>{expense.building.nombre}</span>}
                      {expense.unit && <span>Unidad {expense.unit.numero}</span>}
                      {!expense.building && !expense.unit && <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {expense.provider ? expense.provider.nombre : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {expense.monto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
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
