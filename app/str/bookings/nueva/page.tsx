'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  Calendar,
  User,
  Euro,
  Phone,
  Mail,
  Users,
  Save,
  Hotel,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Listing {
  id: string;
  titulo: string;
  precioNoche: number;
  precioLimpieza: number;
  capacidad: number;
}

export default function NuevaReservaSTRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [form, setForm] = useState({
    listingId: '',
    fechaEntrada: '',
    fechaSalida: '',
    huespedes: 1,
    nombreHuesped: '',
    emailHuesped: '',
    telefonoHuesped: '',
    canal: 'directo',
    precioTotal: 0,
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/str/listings');
        if (response.ok) {
          const data = await response.json();
          setListings(data);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };

    if (status === 'authenticated') {
      fetchListings();
    }
  }, [status]);

  // Calculate price when dates or listing change
  useEffect(() => {
    if (selectedListing && form.fechaEntrada && form.fechaSalida) {
      const entrada = new Date(form.fechaEntrada);
      const salida = new Date(form.fechaSalida);
      const noches = differenceInDays(salida, entrada);

      if (noches > 0) {
        const total = noches * selectedListing.precioNoche + selectedListing.precioLimpieza;
        setForm((prev) => ({ ...prev, precioTotal: total }));
      }
    }
  }, [selectedListing, form.fechaEntrada, form.fechaSalida]);

  const handleListingChange = (listingId: string) => {
    const listing = listings.find((l) => l.id === listingId);
    setSelectedListing(listing || null);
    setForm((prev) => ({ ...prev, listingId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.listingId || !form.fechaEntrada || !form.fechaSalida || !form.nombreHuesped) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const entrada = new Date(form.fechaEntrada);
    const salida = new Date(form.fechaSalida);

    if (entrada >= salida) {
      toast.error('La fecha de salida debe ser posterior a la fecha de entrada');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/str/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          noches: differenceInDays(salida, entrada),
        }),
      });

      if (response.ok) {
        toast.success('Reserva creada exitosamente');
        router.push('/str/bookings');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al crear reserva');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear reserva');
    } finally {
      setLoading(false);
    }
  };

  const noches =
    form.fechaEntrada && form.fechaSalida
      ? differenceInDays(new Date(form.fechaSalida), new Date(form.fechaEntrada))
      : 0;

  if (!isMounted || status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/str">STR</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/str/bookings">Reservas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nueva Reserva</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nueva Reserva</h1>
            <p className="text-muted-foreground">Registra una reserva directa en tu propiedad</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Propiedad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Propiedad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Selecciona el Anuncio *</Label>
                <Select value={form.listingId} onValueChange={handleListingChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un anuncio" />
                  </SelectTrigger>
                  <SelectContent>
                    {listings.map((listing) => (
                      <SelectItem key={listing.id} value={listing.id}>
                        {listing.titulo} - €{listing.precioNoche}/noche
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas de Estancia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="fechaEntrada">Fecha de Entrada *</Label>
                  <Input
                    id="fechaEntrada"
                    type="date"
                    value={form.fechaEntrada}
                    onChange={(e) => setForm({ ...form, fechaEntrada: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="fechaSalida">Fecha de Salida *</Label>
                  <Input
                    id="fechaSalida"
                    type="date"
                    value={form.fechaSalida}
                    onChange={(e) => setForm({ ...form, fechaSalida: e.target.value })}
                    min={form.fechaEntrada || format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="huespedes">Número de Huéspedes</Label>
                  <Input
                    id="huespedes"
                    type="number"
                    min="1"
                    max={selectedListing?.capacidad || 10}
                    value={form.huespedes}
                    onChange={(e) => setForm({ ...form, huespedes: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {noches > 0 && selectedListing && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Noches:</span>
                    <span className="font-medium">{noches}</span>
                    <span>Precio por noche:</span>
                    <span className="font-medium">€{selectedListing.precioNoche}</span>
                    <span>Subtotal estancia:</span>
                    <span className="font-medium">
                      €{(noches * selectedListing.precioNoche).toLocaleString()}
                    </span>
                    <span>Limpieza:</span>
                    <span className="font-medium">€{selectedListing.precioLimpieza}</span>
                    <span className="font-bold pt-2 border-t">Total:</span>
                    <span className="font-bold text-lg text-green-600 pt-2 border-t">
                      €{form.precioTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos del Huésped */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos del Huésped
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="nombreHuesped">Nombre Completo *</Label>
                  <Input
                    id="nombreHuesped"
                    value={form.nombreHuesped}
                    onChange={(e) => setForm({ ...form, nombreHuesped: e.target.value })}
                    placeholder="Nombre del huésped"
                  />
                </div>
                <div>
                  <Label htmlFor="emailHuesped">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="emailHuesped"
                      type="email"
                      value={form.emailHuesped}
                      onChange={(e) => setForm({ ...form, emailHuesped: e.target.value })}
                      placeholder="email@ejemplo.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="telefonoHuesped">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefonoHuesped"
                      type="tel"
                      value={form.telefonoHuesped}
                      onChange={(e) => setForm({ ...form, telefonoHuesped: e.target.value })}
                      placeholder="+34 600 000 000"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canal y Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Canal de Reserva</Label>
                  <Select
                    value={form.canal}
                    onValueChange={(value) => setForm({ ...form, canal: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="directo">Reserva Directa</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="booking">Booking.com</SelectItem>
                      <SelectItem value="vrbo">VRBO</SelectItem>
                      <SelectItem value="telefono">Teléfono</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="precioTotal">Precio Total (€)</Label>
                  <Input
                    id="precioTotal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precioTotal}
                    onChange={(e) =>
                      setForm({ ...form, precioTotal: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Puedes ajustar el precio manualmente si aplicas descuentos
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="notas">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Notas internas sobre la reserva..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Crear Reserva
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
