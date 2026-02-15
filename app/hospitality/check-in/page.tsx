'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Hotel, LogIn, LogOut, Search, Clock, CheckCircle, XCircle,
  Home, ArrowLeft, Users, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface Booking {
  id: string;
  guestNombre: string;
  guestEmail: string;
  guestTelefono?: string;
  guestPais?: string;
  numHuespedes: number;
  checkInDate: string;
  checkOutDate: string;
  numNoches: number;
  precioTotal: number;
  estado: string;
  listing?: { titulo: string; unit?: { numero: string; building?: { nombre: string } } };
}

export default function CheckInPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'today' | 'all'>('today');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchBookings();
  }, [status]);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/hospitality/check-in');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/hospitality/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'checkin' }),
      });
      if (res.ok) {
        toast.success('Check-in realizado');
        fetchBookings();
      } else {
        toast.error('Error en check-in');
      }
    } catch { toast.error('Error de conexión'); }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/hospitality/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'checkout' }),
      });
      if (res.ok) {
        toast.success('Check-out realizado');
        fetchBookings();
      } else {
        toast.error('Error en check-out');
      }
    } catch { toast.error('Error de conexión'); }
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = bookings.filter((b) => {
    const matchSearch = !search || 
      b.guestNombre.toLowerCase().includes(search.toLowerCase()) ||
      b.guestEmail.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || 
      b.checkInDate.startsWith(today) || 
      b.checkOutDate.startsWith(today);
    return matchSearch && matchFilter;
  });

  const stats = {
    checkinHoy: bookings.filter(b => b.checkInDate.startsWith(today) && b.estado !== 'checked_in').length,
    checkoutHoy: bookings.filter(b => b.checkOutDate.startsWith(today) && b.estado === 'checked_in').length,
    enEstancia: bookings.filter(b => b.estado === 'checked_in').length,
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/hospitality')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/hospitality">Hospitality</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Check-in / Check-out</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LogIn className="h-6 w-6 text-primary" />
            Check-in / Check-out
          </h1>
          <p className="text-muted-foreground">Gestión de entradas y salidas de huéspedes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <LogIn className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold">{stats.checkinHoy}</p>
                  <p className="text-xs text-muted-foreground">Check-ins hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <LogOut className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-3xl font-bold">{stats.checkoutHoy}</p>
                  <p className="text-xs text-muted-foreground">Check-outs hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-3xl font-bold">{stats.enEstancia}</p>
                  <p className="text-xs text-muted-foreground">En estancia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <CardTitle>Reservas</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar huésped..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button variant={filter === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('today')}>Hoy</Button>
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Todas</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay reservas {filter === 'today' ? 'para hoy' : ''}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Huésped</TableHead>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{b.guestNombre}</p>
                          <p className="text-xs text-muted-foreground">{b.guestEmail}</p>
                          {b.guestPais && <p className="text-xs text-muted-foreground">{b.guestPais} · {b.numHuespedes} pax</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{b.listing?.titulo || 'Sin asignar'}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(b.checkInDate), 'dd MMM', { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(b.checkOutDate), 'dd MMM', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.estado === 'checked_in' ? 'default' : b.estado === 'confirmada' ? 'secondary' : 'outline'}>
                          {b.estado === 'checked_in' ? 'En estancia' : b.estado === 'checked_out' ? 'Salido' : b.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {b.estado === 'confirmada' && b.checkInDate.startsWith(today) && (
                          <Button size="sm" onClick={() => handleCheckIn(b.id)} className="gap-1">
                            <LogIn className="h-3 w-3" /> Check-in
                          </Button>
                        )}
                        {b.estado === 'checked_in' && (
                          <Button size="sm" variant="outline" onClick={() => handleCheckOut(b.id)} className="gap-1">
                            <LogOut className="h-3 w-3" /> Check-out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
