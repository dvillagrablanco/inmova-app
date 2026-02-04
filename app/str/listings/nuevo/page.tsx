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
import { Checkbox } from '@/components/ui/checkbox';
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
  Hotel,
  MapPin,
  Euro,
  Bed,
  Bath,
  Users,
  Wifi,
  Car,
  Tv,
  UtensilsCrossed,
  Waves,
  Snowflake,
  Save,
  Image as ImageIcon,
} from 'lucide-react';

interface Property {
  id: string;
  numero: string;
  building: {
    nombre: string;
    direccion: string;
    ciudad: string;
  };
}

const amenitiesList = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'kitchen', label: 'Cocina', icon: UtensilsCrossed },
  { id: 'pool', label: 'Piscina', icon: Waves },
  { id: 'ac', label: 'Aire Acondicionado', icon: Snowflake },
];

export default function NuevoAnuncioSTRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    propertyId: '',
    tipoAlojamiento: 'entire_place',
    capacidad: 2,
    habitaciones: 1,
    camas: 1,
    banos: 1,
    precioNoche: 0,
    precioLimpieza: 0,
    minimoNoches: 1,
    maximoNoches: 30,
    checkInHora: '15:00',
    checkOutHora: '11:00',
    amenities: [] as string[],
    politicaCancelacion: 'flexible',
    instantBooking: true,
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
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/units');
        if (response.ok) {
          const data = await response.json();
          setProperties(data);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    if (status === 'authenticated') {
      fetchProperties();
    }
  }, [status]);

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, amenityId]
        : prev.amenities.filter((a) => a !== amenityId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titulo || !form.precioNoche) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/str/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Anuncio creado exitosamente');
        router.push('/str/listings');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al crear anuncio');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear anuncio');
    } finally {
      setLoading(false);
    }
  };

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
              <BreadcrumbLink href="/str/listings">Anuncios</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nuevo Anuncio</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nuevo Anuncio STR</h1>
            <p className="text-muted-foreground">Crea un nuevo anuncio para alquiler vacacional</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="titulo">Título del Anuncio *</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Apartamento con vistas al mar en Barcelona"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Describe tu propiedad..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Propiedad Asociada</Label>
                  <Select
                    value={form.propertyId}
                    onValueChange={(value) => setForm({ ...form, propertyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.building.nombre} - {prop.numero}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Alojamiento</Label>
                  <Select
                    value={form.tipoAlojamiento}
                    onValueChange={(value) => setForm({ ...form, tipoAlojamiento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entire_place">Alojamiento entero</SelectItem>
                      <SelectItem value="private_room">Habitación privada</SelectItem>
                      <SelectItem value="shared_room">Habitación compartida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Capacidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="capacidad">Huéspedes</Label>
                  <Input
                    id="capacidad"
                    type="number"
                    min="1"
                    value={form.capacidad}
                    onChange={(e) => setForm({ ...form, capacidad: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="habitaciones">Habitaciones</Label>
                  <Input
                    id="habitaciones"
                    type="number"
                    min="0"
                    value={form.habitaciones}
                    onChange={(e) =>
                      setForm({ ...form, habitaciones: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="camas">Camas</Label>
                  <Input
                    id="camas"
                    type="number"
                    min="1"
                    value={form.camas}
                    onChange={(e) => setForm({ ...form, camas: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="banos">Baños</Label>
                  <Input
                    id="banos"
                    type="number"
                    min="1"
                    step="0.5"
                    value={form.banos}
                    onChange={(e) => setForm({ ...form, banos: parseFloat(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Precios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Precios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="precioNoche">Precio por Noche (€) *</Label>
                  <Input
                    id="precioNoche"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precioNoche}
                    onChange={(e) =>
                      setForm({ ...form, precioNoche: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="precioLimpieza">Tarifa de Limpieza (€)</Label>
                  <Input
                    id="precioLimpieza"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precioLimpieza}
                    onChange={(e) =>
                      setForm({ ...form, precioLimpieza: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="minimoNoches">Mínimo Noches</Label>
                  <Input
                    id="minimoNoches"
                    type="number"
                    min="1"
                    value={form.minimoNoches}
                    onChange={(e) =>
                      setForm({ ...form, minimoNoches: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maximoNoches">Máximo Noches</Label>
                  <Input
                    id="maximoNoches"
                    type="number"
                    min="1"
                    value={form.maximoNoches}
                    onChange={(e) =>
                      setForm({ ...form, maximoNoches: parseInt(e.target.value) || 30 })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenidades</CardTitle>
              <CardDescription>
                Selecciona las amenidades disponibles en tu propiedad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenitiesList.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <div key={amenity.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={amenity.id}
                        checked={form.amenities.includes(amenity.id)}
                        onCheckedChange={(checked) =>
                          handleAmenityChange(amenity.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={amenity.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {amenity.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Reservas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="checkInHora">Hora Check-in</Label>
                  <Input
                    id="checkInHora"
                    type="time"
                    value={form.checkInHora}
                    onChange={(e) => setForm({ ...form, checkInHora: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="checkOutHora">Hora Check-out</Label>
                  <Input
                    id="checkOutHora"
                    type="time"
                    value={form.checkOutHora}
                    onChange={(e) => setForm({ ...form, checkOutHora: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Política de Cancelación</Label>
                  <Select
                    value={form.politicaCancelacion}
                    onValueChange={(value) => setForm({ ...form, politicaCancelacion: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">
                        Flexible - Reembolso total hasta 24h antes
                      </SelectItem>
                      <SelectItem value="moderate">
                        Moderada - Reembolso total hasta 5 días antes
                      </SelectItem>
                      <SelectItem value="strict">
                        Estricta - 50% reembolso hasta 1 semana antes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="instantBooking"
                    checked={form.instantBooking}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, instantBooking: checked as boolean })
                    }
                  />
                  <Label htmlFor="instantBooking" className="cursor-pointer">
                    Reserva instantánea (sin aprobación manual)
                  </Label>
                </div>
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
                  Crear Anuncio
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
