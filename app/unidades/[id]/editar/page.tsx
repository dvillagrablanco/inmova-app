'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Home as HomeIcon, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import logger, { logError } from '@/lib/logger';

interface Building {
  id: string;
  nombre: string;
}

export default function EditarUnidadPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    edificioId: '',
    tipo: 'apartamento',
    superficie: '0',
    habitaciones: '1',
    banos: '1',
    precio: '0',
    estado: 'disponible',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch unit data
  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const response = await fetch(`/api/units/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            numero: data.numero || '',
            edificioId: data.buildingId || '',
            tipo: data.tipo || 'apartamento',
            superficie: data.superficie?.toString() || '0',
            habitaciones: data.habitaciones?.toString() || '1',
            banos: data.banos?.toString() || '1',
            precio: data.rentaMensual?.toString() || '0',
            estado: data.estado || 'disponible',
          });
        } else {
          toast.error('Error al cargar la unidad');
          router.push('/unidades');
        }
      } catch (error) {
        logger.error('Error fetching unit:', error);
        toast.error('Error al cargar la unidad');
      } finally {
        setIsFetching(false);
      }
    };

    if (status === 'authenticated' && params?.id) {
      fetchUnit();
    }
  }, [status, params?.id, router]);

  // Fetch buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch('/api/buildings');
        if (response.ok) {
          const data = await response.json();
          setBuildings(data);
        }
      } catch (error) {
        logger.error('Error fetching buildings:', error);
      }
    };

    if (status === 'authenticated') {
      fetchBuildings();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/units/${params?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: formData.numero,
          buildingId: formData.edificioId,
          tipo: formData.tipo,
          superficie: parseFloat(formData.superficie),
          habitaciones: parseInt(formData.habitaciones),
          banos: parseInt(formData.banos),
          rentaMensual: parseFloat(formData.precio),
          estado: formData.estado,
        }),
      });

      if (response.ok) {
        toast.success('Unidad actualizada exitosamente');
        router.push('/unidades');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar la unidad');
      }
    } catch (error) {
      logger.error('Error updating unit:', error);
      toast.error('Error al actualizar la unidad');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isFetching) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto">
          <p>Cargando...</p>
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
              <BreadcrumbLink href="/home">
                <HomeIcon className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/unidades">Unidades</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editar Unidad</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Unidad</h1>
            <p className="text-muted-foreground">Modifica los datos de la unidad</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Información de la Unidad</CardTitle>
              <CardDescription>
                Actualiza los campos necesarios y haz clic en guardar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Número */}
                <div className="space-y-2">
                  <Label htmlFor="numero">Número de Unidad *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ej: 101, A1, etc."
                    required
                  />
                </div>

                {/* Edificio */}
                <div className="space-y-2">
                  <Label htmlFor="edificioId">Edificio *</Label>
                  <Select
                    value={formData.edificioId}
                    onValueChange={(value) => setFormData({ ...formData, edificioId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Unidad *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="local">Local Comercial</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="bodega">Bodega</SelectItem>
                      <SelectItem value="parqueadero">Parqueadero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="reservada">Reservada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Superficie */}
                <div className="space-y-2">
                  <Label htmlFor="superficie">Superficie (m²) *</Label>
                  <Input
                    id="superficie"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.superficie}
                    onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                    required
                  />
                </div>

                {/* Habitaciones */}
                <div className="space-y-2">
                  <Label htmlFor="habitaciones">Habitaciones</Label>
                  <Input
                    id="habitaciones"
                    type="number"
                    min="0"
                    value={formData.habitaciones}
                    onChange={(e) => setFormData({ ...formData, habitaciones: e.target.value })}
                  />
                </div>

                {/* Baños */}
                <div className="space-y-2">
                  <Label htmlFor="banos">Baños</Label>
                  <Input
                    id="banos"
                    type="number"
                    min="0"
                    value={formData.banos}
                    onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                  />
                </div>

                {/* Renta Mensual */}
                <div className="space-y-2">
                  <Label htmlFor="precio">Renta Mensual (€) *</Label>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
