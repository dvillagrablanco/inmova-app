'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Home as HomeIcon, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function NuevaUnidadPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    edificioId: '',
    tipo: 'apartamento',
    superficie: '0',
    habitaciones: '1',
    banos: '1',
    precio: '0',
  });

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
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: formData.numero,
          buildingId: formData.edificioId,
          tipo: formData.tipo,
          superficie: parseFloat(formData.superficie),
          habitaciones: parseInt(formData.habitaciones),
          banos: parseInt(formData.banos),
          precioAlquiler: parseFloat(formData.precio),
          estado: 'disponible',
        }),
      });

      if (response.ok) {
        toast.success('Unidad creada correctamente');
        router.push('/unidades');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear la unidad');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear la unidad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/unidades')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Unidades
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <HomeIcon className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/unidades">Unidades</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nueva Unidad</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nueva Unidad</h1>
              <p className="text-muted-foreground">Registra una nueva unidad en un edificio</p>
            </div>

            {/* Formulario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HomeIcon className="h-5 w-5" />
                  Información de la Unidad
                </CardTitle>
                <CardDescription>
                  Completa los datos básicos de la unidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Edificio */}
                    <div className="space-y-2 md:col-span-2">
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

                    {/* Número */}
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número/Identificador *</Label>
                      <Input
                        id="numero"
                        name="numero"
                        value={formData.numero}
                        onChange={handleChange}
                        required
                        placeholder="Ej: 101, A1, Planta 3"
                      />
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
                          <SelectItem value="local">Local Comercial</SelectItem>
                          <SelectItem value="oficina">Oficina</SelectItem>
                          <SelectItem value="estudio">Estudio</SelectItem>
                          <SelectItem value="duplex">Dúplex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Superficie */}
                    <div className="space-y-2">
                      <Label htmlFor="superficie">Superficie (m²) *</Label>
                      <Input
                        id="superficie"
                        name="superficie"
                        type="number"
                        step="0.01"
                        value={formData.superficie}
                        onChange={handleChange}
                        required
                        min="0"
                      />
                    </div>

                    {/* Habitaciones */}
                    <div className="space-y-2">
                      <Label htmlFor="habitaciones">Habitaciones *</Label>
                      <Input
                        id="habitaciones"
                        name="habitaciones"
                        type="number"
                        value={formData.habitaciones}
                        onChange={handleChange}
                        required
                        min="0"
                      />
                    </div>

                    {/* Baños */}
                    <div className="space-y-2">
                      <Label htmlFor="banos">Baños *</Label>
                      <Input
                        id="banos"
                        name="banos"
                        type="number"
                        value={formData.banos}
                        onChange={handleChange}
                        required
                        min="0"
                      />
                    </div>

                    {/* Precio */}
                    <div className="space-y-2">
                      <Label htmlFor="precio">Precio de Alquiler (€/mes) *</Label>
                      <Input
                        id="precio"
                        name="precio"
                        type="number"
                        step="0.01"
                        value={formData.precio}
                        onChange={handleChange}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isLoading || !formData.edificioId}>
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Crear Unidad
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/unidades')}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
