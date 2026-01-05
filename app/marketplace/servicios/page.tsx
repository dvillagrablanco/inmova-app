'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  Star,
  Clock,
  Euro,
  MapPin,
  Phone,
  ShoppingCart,
  Filter,
  Sparkles,
  CheckCircle,
  Wrench,
  Droplets,
  Zap,
  PaintBucket,
  Truck,
  Shield,
  Leaf,
  Home,
  Loader2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceService {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precioBase: number;
  precioMaximo?: number;
  duracionEstimada?: string;
  destacado: boolean;
  imagenUrl?: string;
  provider: {
    id: string;
    nombre: string;
    nombreEmpresa: string;
    telefono: string;
    especialidad: string;
  };
  avgRating: number;
  reviewCount: number;
}

const CATEGORY_ICONS: Record<string, any> = {
  limpieza: Sparkles,
  fontaneria: Droplets,
  electricidad: Zap,
  pintura: PaintBucket,
  mudanzas: Truck,
  seguros: Shield,
  jardineria: Leaf,
  reformas: Home,
  mantenimiento: Wrench,
};

const CATEGORY_COLORS: Record<string, string> = {
  limpieza: 'bg-cyan-100 text-cyan-700',
  fontaneria: 'bg-blue-100 text-blue-700',
  electricidad: 'bg-yellow-100 text-yellow-700',
  pintura: 'bg-purple-100 text-purple-700',
  mudanzas: 'bg-orange-100 text-orange-700',
  seguros: 'bg-green-100 text-green-700',
  jardineria: 'bg-emerald-100 text-emerald-700',
  reformas: 'bg-rose-100 text-rose-700',
  mantenimiento: 'bg-gray-100 text-gray-700',
};

export default function MarketplaceServiciosPage() {
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Booking dialog
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<MarketplaceService | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, searchQuery]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/marketplace/servicios?${params}`);
      const data = await res.json();

      if (data.success) {
        setServices(data.data.services);
        setCategories(data.data.categories);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error cargando servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = async () => {
    if (!selectedService) return;

    try {
      setBooking(true);
      const res = await fetch('/api/marketplace/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          fechaSolicitada: bookingDate,
          notas: bookingNotes,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success(data.message);
      setBookingDialogOpen(false);
      setSelectedService(null);
      setBookingDate('');
      setBookingNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Error al solicitar servicio');
    } finally {
      setBooking(false);
    }
  };

  const openBookingDialog = (service: MarketplaceService) => {
    setSelectedService(service);
    setBookingDialogOpen(true);
  };

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  if (loading && services.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-indigo-500" />
            Marketplace de Servicios
          </h1>
          <p className="text-muted-foreground mt-1">
            Encuentra los mejores profesionales para tu hogar
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          Todos
        </Button>
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.toLowerCase()] || Wrench;
          return (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize"
            >
              <Icon className="h-4 w-4 mr-1" />
              {cat}
            </Button>
          );
        })}
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No hay servicios disponibles</h3>
            <p className="text-muted-foreground mt-1">Intenta con otra búsqueda o categoría</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const CategoryIcon = CATEGORY_ICONS[service.categoria.toLowerCase()] || Wrench;
            const categoryColor =
              CATEGORY_COLORS[service.categoria.toLowerCase()] || CATEGORY_COLORS.mantenimiento;

            return (
              <Card
                key={service.id}
                className={cn(
                  'overflow-hidden hover:shadow-lg transition-shadow',
                  service.destacado && 'ring-2 ring-indigo-500'
                )}
              >
                {service.destacado && (
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-center py-1 text-xs font-medium">
                    ⭐ DESTACADO
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={cn('mb-2 capitalize', categoryColor)}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {service.categoria}
                      </Badge>
                      <CardTitle className="text-lg">{service.nombre}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">{service.descripcion}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Provider Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-gray-100 p-1.5 rounded-full">
                      <Wrench className="h-3 w-3 text-gray-500" />
                    </div>
                    <span className="font-medium">
                      {service.provider.nombreEmpresa || service.provider.nombre}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    {renderStars(service.avgRating)}
                    <span className="text-sm text-muted-foreground">
                      ({service.reviewCount} reseñas)
                    </span>
                  </div>

                  {/* Price and Duration */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 font-semibold text-green-600">
                      <Euro className="h-4 w-4" />
                      <span>
                        {service.precioBase}
                        {service.precioMaximo && ` - ${service.precioMaximo}`}€
                      </span>
                    </div>
                    {service.duracionEstimada && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.duracionEstimada}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button className="w-full" onClick={() => openBookingDialog(service)}>
                    Solicitar Servicio
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Servicio</DialogTitle>
            <DialogDescription>
              {selectedService?.nombre} -{' '}
              {selectedService?.provider.nombreEmpresa || selectedService?.provider.nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Service Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Servicio:</span>
                <span className="font-medium">{selectedService?.nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio estimado:</span>
                <span className="font-medium text-green-600">
                  €{selectedService?.precioBase}
                  {selectedService?.precioMaximo && ` - €${selectedService.precioMaximo}`}
                </span>
              </div>
              {selectedService?.duracionEstimada && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duración:</span>
                  <span className="font-medium">{selectedService.duracionEstimada}</span>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha preferida (opcional)</Label>
              <Input
                id="date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Describe tus necesidades específicas..."
                rows={3}
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
              />
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">El proveedor te contactará</p>
                <p className="text-blue-700">
                  Recibirás una confirmación por email y el proveedor se pondrá en contacto contigo.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBookService} disabled={booking}>
              {booking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Confirmar Solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
