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
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home, ArrowLeft, Coffee, Wifi, Car, Shirt, UtensilsCrossed,
  Dumbbell, Waves, Baby, Dog, Briefcase, Plus, Edit, Euro,
  Package, Clock, Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface GuestService {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  activo: boolean;
  icono: string;
}

const CATEGORIAS = [
  { id: 'alimentacion', label: 'Alimentación', icon: UtensilsCrossed },
  { id: 'transporte', label: 'Transporte', icon: Car },
  { id: 'lavanderia', label: 'Lavandería', icon: Shirt },
  { id: 'bienestar', label: 'Bienestar', icon: Dumbbell },
  { id: 'infantil', label: 'Infantil', icon: Baby },
  { id: 'mascotas', label: 'Mascotas', icon: Dog },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'extras', label: 'Extras', icon: Package },
];

const DEFAULT_SERVICES: GuestService[] = [
  { id: '1', nombre: 'Desayuno', descripcion: 'Desayuno buffet continental', categoria: 'alimentacion', precio: 15, activo: true, icono: 'coffee' },
  { id: '2', nombre: 'Late Check-out', descripcion: 'Salida hasta las 14:00h', categoria: 'extras', precio: 30, activo: true, icono: 'clock' },
  { id: '3', nombre: 'Early Check-in', descripcion: 'Entrada desde las 10:00h', categoria: 'extras', precio: 25, activo: true, icono: 'clock' },
  { id: '4', nombre: 'Transfer Aeropuerto', descripcion: 'Traslado aeropuerto-alojamiento', categoria: 'transporte', precio: 45, activo: true, icono: 'car' },
  { id: '5', nombre: 'Lavandería Express', descripcion: 'Servicio de lavandería en 4h', categoria: 'lavanderia', precio: 20, activo: true, icono: 'shirt' },
  { id: '6', nombre: 'Pack Bienvenida Premium', descripcion: 'Cava, fruta, chocolates artesanales', categoria: 'extras', precio: 35, activo: true, icono: 'star' },
  { id: '7', nombre: 'Cuna Bebé', descripcion: 'Cuna y kit infantil', categoria: 'infantil', precio: 0, activo: true, icono: 'baby' },
  { id: '8', nombre: 'Kit Mascota', descripcion: 'Comedero, cama y bolsas', categoria: 'mascotas', precio: 10, activo: false, icono: 'dog' },
  { id: '9', nombre: 'Parking', descripcion: 'Plaza de garaje por noche', categoria: 'transporte', precio: 18, activo: true, icono: 'car' },
  { id: '10', nombre: 'Acceso Gym/Spa', descripcion: 'Acceso diario a zona wellness', categoria: 'bienestar', precio: 12, activo: true, icono: 'dumbbell' },
];

export default function ServiciosHospitalityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<GuestService[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editingService, setEditingService] = useState<GuestService | null>(null);
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      fetchServices();
    }
  }, [status]);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/hospitality/servicios');
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          setServices(data.data);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, activo: !s.activo } : s));
    toast.success('Servicio actualizado');
  };

  const handleEdit = (service: GuestService) => {
    setEditingService({ ...service });
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!editingService) return;
    setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
    setEditDialog(false);
    toast.success('Servicio actualizado');
  };

  const filtered = services.filter(s => filterCat === 'all' || s.categoria === filterCat);

  const getIconComponent = (icono: string) => {
    const map: Record<string, any> = {
      coffee: Coffee, car: Car, shirt: Shirt, clock: Clock,
      star: Star, baby: Baby, dog: Dog, dumbbell: Dumbbell,
      package: Package, briefcase: Briefcase,
    };
    const Icon = map[icono] || Package;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
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
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/hospitality">Hospitality</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Servicios al Huésped</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Coffee className="h-6 w-6 text-primary" />
              Servicios al Huésped
            </h1>
            <p className="text-muted-foreground">Configura los servicios adicionales que ofreces a tus huéspedes</p>
          </div>
        </div>

        {/* Filtro por categoría */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={filterCat === 'all' ? 'default' : 'outline'} onClick={() => setFilterCat('all')}>
            Todos ({services.length})
          </Button>
          {CATEGORIAS.map((cat) => {
            const count = services.filter(s => s.categoria === cat.id).length;
            if (count === 0) return null;
            const Icon = cat.icon;
            return (
              <Button key={cat.id} size="sm" variant={filterCat === cat.id ? 'default' : 'outline'} onClick={() => setFilterCat(cat.id)} className="gap-1">
                <Icon className="h-3 w-3" /> {cat.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Grid de servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service) => (
            <Card key={service.id} className={`transition-all ${!service.activo ? 'opacity-60' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${service.activo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getIconComponent(service.icono)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{service.nombre}</h3>
                      <p className="text-sm text-muted-foreground">{service.descripcion}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORIAS.find(c => c.id === service.categoria)?.label || service.categoria}
                        </Badge>
                        <Badge variant={service.precio === 0 ? 'secondary' : 'default'} className="text-xs">
                          {service.precio === 0 ? 'Gratis' : `${service.precio}€`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch checked={service.activo} onCheckedChange={() => toggleService(service.id)} />
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(service)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog edición */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Servicio</DialogTitle>
            </DialogHeader>
            {editingService && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={editingService.nombre} onChange={e => setEditingService({ ...editingService, nombre: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={editingService.descripcion} onChange={e => setEditingService({ ...editingService, descripcion: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Precio (€)</Label>
                  <Input type="number" min="0" step="0.01" value={editingService.precio} onChange={e => setEditingService({ ...editingService, precio: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
