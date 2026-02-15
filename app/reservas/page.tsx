'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, CalendarDays, Clock, User, Building2, Euro, CheckCircle2, XCircle, Search, Plus, Eye, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Reserva {
  id: string;
  propiedad: string;
  unidad: string;
  cliente: string;
  email: string;
  telefono: string;
  fechaEntrada: string;
  fechaSalida: string;
  noches: number;
  precioPorNoche: number;
  total: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  plataforma?: string;
}

export default function ReservasPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const [reservas, setReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') {
      fetchReservas();
    }
  }, [status, router]);

  const fetchReservas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reservas');
      if (res.ok) {
        const data = await res.json();
        setReservas(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error loading reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservas = reservas.filter(r => {
    const matchesSearch = r.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || r.propiedad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || r.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const stats = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === 'pendiente').length,
    confirmadas: reservas.filter(r => r.estado === 'confirmada').length,
    ingresos: reservas.filter(r => r.estado === 'confirmada' || r.estado === 'completada').reduce((sum, r) => sum + r.total, 0),
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { className: string; label: string }> = {
      pendiente: { className: 'bg-yellow-500', label: 'Pendiente' },
      confirmada: { className: 'bg-green-500', label: 'Confirmada' },
      cancelada: { className: 'bg-red-500', label: 'Cancelada' },
      completada: { className: 'bg-gray-500', label: 'Completada' },
    };
    const { className, label } = config[estado] || config.pendiente;
    return <Badge className={className}>{label}</Badge>;
  };

  const handleConfirmar = (id: string) => {
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'confirmada' } : r));
    toast.success('Reserva confirmada');
  };

  const handleCancelar = (id: string) => {
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'cancelada' } : r));
    toast.success('Reserva cancelada');
  };

  if (loading) {
    return <AuthenticatedLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AuthenticatedLayout>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Reservas</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-100 rounded-xl"><CalendarDays className="h-8 w-8 text-cyan-600" /></div>
            <div><h1 className="text-2xl sm:text-3xl font-bold">Gestión de Reservas</h1><p className="text-muted-foreground">Administra reservas de alquiler vacacional</p></div>
          </div>
          <Button onClick={() => setShowNewDialog(true)}><Plus className="h-4 w-4 mr-2" />Nueva Reserva</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Reservas</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-yellow-600">{stats.pendientes}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Confirmadas</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{stats.confirmadas}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ingresos</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">€{stats.ingresos.toLocaleString()}</div></CardContent></Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por cliente o propiedad..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="space-y-4">
          {filteredReservas.map((reserva) => (
            <Card key={reserva.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">{reserva.cliente}{getEstadoBadge(reserva.estado)}{reserva.plataforma && <Badge variant="outline">{reserva.plataforma}</Badge>}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1"><Building2 className="h-3 w-3" />{reserva.propiedad} - {reserva.unidad}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">€{reserva.total}</p>
                    <p className="text-sm text-muted-foreground">{reserva.noches} noches × €{reserva.precioPorNoche}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-4 w-4" />Entrada: {new Date(reserva.fechaEntrada).toLocaleDateString('es-ES')}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-4 w-4" />Salida: {new Date(reserva.fechaSalida).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex gap-2">
                    {reserva.estado === 'pendiente' && (
                      <>
                        <Button size="sm" onClick={() => handleConfirmar(reserva.id)}><CheckCircle2 className="h-4 w-4 mr-1" />Confirmar</Button>
                        <Button variant="outline" size="sm" onClick={() => handleCancelar(reserva.id)}><XCircle className="h-4 w-4 mr-1" />Cancelar</Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem>Enviar Confirmación</DropdownMenuItem>
                        <DropdownMenuItem>Modificar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog Nueva Reserva */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Reserva</DialogTitle><DialogDescription>Registra una nueva reserva manualmente</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Propiedad *</Label><Select><SelectTrigger><SelectValue placeholder="Seleccionar propiedad" /></SelectTrigger><SelectContent><SelectItem value="p1">Apartamento Playa</SelectItem><SelectItem value="p2">Estudio Centro</SelectItem><SelectItem value="p3">Casa Rural</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre del Cliente *</Label><Input placeholder="Nombre completo" /></div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="email@ejemplo.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Fecha Entrada</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Fecha Salida</Label><Input type="date" /></div>
              </div>
              <div className="space-y-2"><Label>Precio por Noche (€)</Label><Input type="number" placeholder="100" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
              <Button onClick={() => { toast.success('Reserva creada'); setShowNewDialog(false); }}>Crear Reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
