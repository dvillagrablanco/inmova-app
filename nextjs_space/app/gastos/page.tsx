'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DollarSign, Plus, TrendingUp, ArrowLeft, Home, Search, Euro, Calendar as CalendarIcon, Building2, Tag, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';

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
  const { canCreate } = usePermissions();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Array<{ id: string; label: string; value: string }>>([]);
  const [form, setForm] = useState({
    concepto: '',
    categoria: 'otro',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  });
  const [editForm, setEditForm] = useState({
    concepto: '',
    categoria: 'otro',
    monto: '',
    fecha: '',
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

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      concepto: expense.concepto || '',
      categoria: expense.categoria || 'otro',
      monto: expense.monto?.toString() || '',
      fecha: expense.fecha ? new Date(expense.fecha).toISOString().split('T')[0] : '',
      notas: (expense as any).notas || '',
    });
    setOpenEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editForm.concepto || !editForm.categoria || !editForm.monto || !editForm.fecha) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast.success('Gasto actualizado exitosamente');
        setOpenEditDialog(false);
        setEditingExpense(null);
        fetchExpenses();
      } else {
        toast.error('Error al actualizar gasto');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Error al actualizar gasto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Gasto eliminado exitosamente');
        fetchExpenses();
      } else {
        toast.error('Error al eliminar gasto');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error al eliminar gasto');
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      mantenimiento: 'Mantenimiento',
      servicios: 'Servicios',
      impuestos: 'Impuestos',
      seguros: 'Seguros',
      personal: 'Personal',
      marketing: 'Marketing',
      legal: 'Legal',
      otro: 'Otro',
    };
    return labels[categoria] || categoria;
  };

  const getCategoriaBadgeColor = (categoria: string) => {
    const colors: Record<string, string> = {
      mantenimiento: 'bg-blue-500 text-white hover:bg-blue-600',
      servicios: 'bg-green-500 text-white hover:bg-green-600',
      impuestos: 'bg-red-500 text-white hover:bg-red-600',
      seguros: 'bg-purple-500 text-white hover:bg-purple-600',
      personal: 'bg-orange-500 text-white hover:bg-orange-600',
      marketing: 'bg-pink-500 text-white hover:bg-pink-600',
      legal: 'bg-indigo-500 text-white hover:bg-indigo-600',
      otro: 'bg-gray-500 text-white hover:bg-gray-600',
    };
    return colors[categoria] || 'bg-muted';
  };

  // Actualizar filtros activos
  useEffect(() => {
    const filters: Array<{ id: string; label: string; value: string }> = [];
    
    if (searchTerm) {
      filters.push({ id: 'search', label: 'Búsqueda', value: searchTerm });
    }
    if (filterCategoria !== 'all') {
      const categoriaLabels: Record<string, string> = {
        'mantenimiento': 'Mantenimiento',
        'servicios': 'Servicios',
        'impuestos': 'Impuestos',
        'seguros': 'Seguros',
        'renovacion': 'Renovación',
        'otro': 'Otro',
      };
      filters.push({ id: 'categoria', label: 'Categoría', value: categoriaLabels[filterCategoria] || filterCategoria });
    }
    
    setActiveFilters(filters);
  }, [searchTerm, filterCategoria]);

  const clearFilter = (id: string) => {
    if (id === 'search') {
      setSearchTerm('');
    } else if (id === 'categoria') {
      setFilterCategoria('all');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategoria('all');
  };

  // Filtrado de gastos
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = searchTerm === '' ||
        expense.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.building?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.provider?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategoria = filterCategoria === 'all' || expense.categoria === filterCategoria;

      return matchesSearch && matchesCategoria;
    });
  }, [expenses, searchTerm, filterCategoria]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalGastos = expenses.reduce((sum, e) => sum + e.monto, 0);
    const gastosEsteMes = expenses.filter(e => {
      const expenseDate = new Date(e.fecha);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.monto, 0);

    return {
      total: expenses.length,
      totalMonto: totalGastos,
      esteMes: gastosEsteMes,
      mantenimiento: expenses.filter(e => e.categoria === 'mantenimiento').reduce((sum, e) => sum + e.monto, 0),
    };
  }, [expenses]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <LoadingState message="Cargando gastos..." />
          </main>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Gastos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
                <p className="text-muted-foreground">
                  Gestiona los gastos de tus propiedades
                </p>
              </div>
              {canCreate && (
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Gasto
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
                          placeholder="Ej: Reparación caldera"
                          required
                        />
                      </div>
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
                            <SelectItem value="servicios">Servicios</SelectItem>
                            <SelectItem value="impuestos">Impuestos</SelectItem>
                            <SelectItem value="seguros">Seguros</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
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
                        <Input
                          id="notas"
                          value={form.notas}
                          onChange={(e) => setForm({ ...form, notas: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          Registrar Gasto
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Diálogo de Edición */}
            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Gasto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-concepto">Concepto *</Label>
                    <Input
                      id="edit-concepto"
                      value={editForm.concepto}
                      onChange={(e) => setEditForm({ ...editForm, concepto: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-categoria">Categoría *</Label>
                    <Select
                      value={editForm.categoria}
                      onValueChange={(value) => setEditForm({ ...editForm, categoria: value })}
                    >
                      <SelectTrigger id="edit-categoria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="servicios">Servicios</SelectItem>
                        <SelectItem value="impuestos">Impuestos</SelectItem>
                        <SelectItem value="seguros">Seguros</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-monto">Monto (€) *</Label>
                    <Input
                      id="edit-monto"
                      type="number"
                      step="0.01"
                      value={editForm.monto}
                      onChange={(e) => setEditForm({ ...editForm, monto: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-fecha">Fecha *</Label>
                    <Input
                      id="edit-fecha"
                      type="date"
                      value={editForm.fecha}
                      onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-notas">Notas</Label>
                    <Input
                      id="edit-notas"
                      value={editForm.notas}
                      onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Gastos
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monto Total
                  </CardTitle>
                  <Euro className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{stats.totalMonto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Este Mes
                  </CardTitle>
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{stats.esteMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Mantenimiento
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{stats.mantenimiento.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>
            </div>

            {/* Búsqueda y Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Buscar Gastos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por concepto, edificio o proveedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="servicios">Servicios</SelectItem>
                      <SelectItem value="impuestos">Impuestos</SelectItem>
                      <SelectItem value="seguros">Seguros</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Filter Chips */}
            <FilterChips filters={activeFilters} onRemove={clearFilter} onClearAll={clearAllFilters} />

            {/* Lista de Gastos */}
            <div className="space-y-4">
              {filteredExpenses.length === 0 ? (
                searchTerm || filterCategoria !== 'all' ? (
                  <EmptyState
                    icon={<Search className="h-16 w-16 text-gray-400" />}
                    title="No se encontraron resultados"
                    description="Intenta ajustar los filtros de búsqueda"
                    action={{
                      label: "Limpiar filtros",
                      onClick: clearAllFilters,
                      icon: <Search className="h-4 w-4" />
                    }}
                  />
                ) : (
                  <EmptyState
                    icon={<DollarSign className="h-16 w-16 text-gray-400" />}
                    title="No hay gastos registrados"
                    description="Comienza registrando tu primer gasto para un mejor control financiero"
                    action={canCreate ? {
                      label: "Crear Primer Gasto",
                      onClick: () => setOpenDialog(true),
                      icon: <Plus className="h-4 w-4" />
                    } : undefined}
                  />
                )
              ) : (
                filteredExpenses.map((expense) => (
                  <Card key={expense.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Icono */}
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Euro className="h-6 w-6 text-primary" />
                          </div>
                        </div>

                        {/* Información Principal */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="text-lg font-semibold break-words flex-1">
                              {expense.concepto}
                            </h3>
                            <Badge className={getCategoriaBadgeColor(expense.categoria)}>
                              {getCategoriaLabel(expense.categoria)}
                            </Badge>
                          </div>

                          {/* Entidad relacionada */}
                          {(expense.building || expense.unit || expense.provider) && (
                            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                              {expense.building && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Building2 className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Edificio: {expense.building.nombre}</span>
                                </div>
                              )}
                              {expense.unit && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Home className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Unidad: {expense.unit.numero}</span>
                                </div>
                              )}
                              {expense.provider && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Tag className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Proveedor: {expense.provider.nombre}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fecha y Monto */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="text-muted-foreground flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                Fecha
                              </div>
                              <div className="font-medium">
                                {format(new Date(expense.fecha), 'dd MMM yyyy', { locale: es })}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Euro className="h-3 w-3" />
                                Monto
                              </div>
                              <div className="font-bold text-lg text-red-600">
                                €{expense.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(expense)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
