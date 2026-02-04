'use client';

/**
 * Coliving - Nueva Reserva
 * 
 * Formulario para crear una nueva reserva de espacio coliving
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ArrowLeft, Calendar as CalendarIcon, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function NuevaReservaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [espacios, setEspacios] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    espacioId: '',
    nombreHuesped: '',
    emailHuesped: '',
    telefonoHuesped: '',
    fechaInicio: undefined as Date | undefined,
    fechaFin: undefined as Date | undefined,
    notas: '',
  });

  useEffect(() => {
    // Cargar espacios disponibles
    const fetchEspacios = async () => {
      try {
        const response = await fetch('/api/coliving/spaces');
        if (response.ok) {
          const data = await response.json();
          setEspacios(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching spaces:', error);
      }
    };
    fetchEspacios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.espacioId || !formData.nombreHuesped || !formData.fechaInicio) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/coliving/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: formData.espacioId,
          guestName: formData.nombreHuesped,
          guestEmail: formData.emailHuesped,
          guestPhone: formData.telefonoHuesped,
          startDate: formData.fechaInicio?.toISOString(),
          endDate: formData.fechaFin?.toISOString(),
          notes: formData.notas,
        }),
      });

      if (response.ok) {
        toast.success('Reserva creada correctamente');
        router.push('/coliving/reservas');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al crear la reserva');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Reserva</h1>
          <p className="text-muted-foreground">Crear una nueva reserva de espacio coliving</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Reserva</CardTitle>
          <CardDescription>
            Completa la información para crear la reserva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Espacio */}
            <div className="space-y-2">
              <Label htmlFor="espacio">Espacio *</Label>
              <Select
                value={formData.espacioId}
                onValueChange={(value) => setFormData({ ...formData, espacioId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un espacio" />
                </SelectTrigger>
                <SelectContent>
                  {espacios.map((espacio) => (
                    <SelectItem key={espacio.id} value={espacio.id}>
                      {espacio.nombre || espacio.name} - {espacio.tipo || espacio.type}
                    </SelectItem>
                  ))}
                  {espacios.length === 0 && (
                    <SelectItem value="default" disabled>
                      No hay espacios disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Datos del huésped */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Huésped *</Label>
                <Input
                  id="nombre"
                  value={formData.nombreHuesped}
                  onChange={(e) => setFormData({ ...formData, nombreHuesped: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.emailHuesped}
                  onChange={(e) => setFormData({ ...formData, emailHuesped: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefonoHuesped}
                  onChange={(e) => setFormData({ ...formData, telefonoHuesped: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>

            {/* Fechas */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha de Inicio *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.fechaInicio && 'text-muted-foreground'
                      )}
                      onClick={() => undefined}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fechaInicio
                        ? format(formData.fechaInicio, 'PPP', { locale: es })
                        : 'Selecciona fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.fechaInicio}
                      onSelect={(date) => setFormData({ ...formData, fechaInicio: date })}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.fechaFin && 'text-muted-foreground'
                      )}
                      onClick={() => undefined}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fechaFin
                        ? format(formData.fechaFin, 'PPP', { locale: es })
                        : 'Selecciona fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.fechaFin}
                      onSelect={(date) => setFormData({ ...formData, fechaFin: date })}
                      locale={es}
                      disabled={(date) =>
                        formData.fechaInicio ? date < formData.fechaInicio : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Información adicional sobre la reserva..."
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Reserva
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
