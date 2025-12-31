'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Wrench, Home, ArrowLeft, Save } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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

interface Unit {
  id: string;
  numero: string;
  building: { nombre: string };
}

export default function NuevaMantenimientoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    unitId: '',
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    tipo: 'general',
  });

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units');
        if (response.ok) {
          const data = await response.json();
          setUnits(data);
        }
      } catch (error) {
        logger.error('Error fetching units:', error);
      }
    };

    if (status === 'authenticated') {
      fetchUnits();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: formData.unitId,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          prioridad: formData.prioridad,
          tipo: formData.tipo,
          estado: 'pendiente',
        }),
      });

      if (response.ok) {
        toast.success('Solicitud de mantenimiento creada correctamente');
        router.push('/mantenimiento');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear la solicitud');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    <AuthenticatedLayout>
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/mantenimiento')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Mantenimiento
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
                    <BreadcrumbLink href="/mantenimiento">Mantenimiento</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nueva Solicitud</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Nueva Solicitud de Mantenimiento
              </h1>
              <p className="text-muted-foreground">Registra una nueva solicitud de mantenimiento</p>
            </div>

            {/* Formulario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Información de la Solicitud
                </CardTitle>
                <CardDescription>
                  Completa los datos de la solicitud de mantenimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Unidad */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="unitId">Unidad Afectada *</Label>
                      <Select
                        value={formData.unitId}
                        onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.building.nombre} - {unit.numero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Título */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="titulo">Título de la Solicitud *</Label>
                      <Input
                        id="titulo"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                        placeholder="Ej: Fuga de agua en baño"
                      />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Mantenimiento *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="plomeria">Plomería</SelectItem>
                          <SelectItem value="electricidad">Electricidad</SelectItem>
                          <SelectItem value="pintura">Pintura</SelectItem>
                          <SelectItem value="carpinteria">Carpintería</SelectItem>
                          <SelectItem value="electrodomesticos">Electrodomésticos</SelectItem>
                          <SelectItem value="limpieza">Limpieza</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Prioridad */}
                    <div className="space-y-2">
                      <Label htmlFor="prioridad">Prioridad *</Label>
                      <Select
                        value={formData.prioridad}
                        onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="descripcion">Descripción Detallada *</Label>
                      <Textarea
                        id="descripcion"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        required
                        placeholder="Describe el problema de forma detallada..."
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isLoading || !formData.unitId}>
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Crear Solicitud
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/mantenimiento')}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
