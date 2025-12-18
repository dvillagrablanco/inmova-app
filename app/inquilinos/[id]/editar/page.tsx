'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
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

export default function EditarInquilinoPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    documentoIdentidad: '',
    tipoDocumento: 'dni',
    fechaNacimiento: '',
    nacionalidad: 'Española',
    estadoCivil: 'soltero',
    profesion: '',
    ingresosMensuales: '0',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch tenant data
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          const fechaNacimiento = data.fechaNacimiento
            ? new Date(data.fechaNacimiento).toISOString().split('T')[0]
            : '';
          
          setFormData({
            nombre: data.nombreCompleto || data.nombre || '',
            email: data.email || '',
            telefono: data.telefono || '',
            documentoIdentidad: data.documentoIdentidad || '',
            tipoDocumento: data.tipoDocumento || 'dni',
            fechaNacimiento,
            nacionalidad: data.nacionalidad || 'Española',
            estadoCivil: data.estadoCivil || 'soltero',
            profesion: data.profesion || '',
            ingresosMensuales: data.ingresosMensuales?.toString() || '0',
          });
        } else {
          toast.error('Error al cargar el inquilino');
          router.push('/inquilinos');
        }
      } catch (error) {
        logger.error('Error fetching tenant:', error);
        toast.error('Error al cargar el inquilino');
      } finally {
        setIsFetching(false);
      }
    };

    if (status === 'authenticated' && params?.id) {
      fetchTenant();
    }
  }, [status, params?.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tenants/${params?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          documentoIdentidad: formData.documentoIdentidad,
          tipoDocumento: formData.tipoDocumento,
          fechaNacimiento: formData.fechaNacimiento
            ? new Date(formData.fechaNacimiento).toISOString()
            : undefined,
          nacionalidad: formData.nacionalidad,
          estadoCivil: formData.estadoCivil,
          profesion: formData.profesion,
          ingresosMensuales: parseFloat(formData.ingresosMensuales),
        }),
      });

      if (response.ok) {
        toast.success('Inquilino actualizado exitosamente');
        router.push('/inquilinos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar el inquilino');
      }
    } catch (error) {
      logger.error('Error updating tenant:', error);
      toast.error('Error al actualizar el inquilino');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (status === 'loading' || isFetching) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <p>Cargando...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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
                  <BreadcrumbLink href="/inquilinos">Inquilinos</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Editar Inquilino</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Inquilino</h1>
                <p className="text-muted-foreground">Modifica los datos del inquilino</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Información del Inquilino</CardTitle>
                  <CardDescription>
                    Actualiza los campos necesarios y haz clic en guardar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Nombre Completo */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Tipo de Documento */}
                    <div className="space-y-2">
                      <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                      <Select
                        value={formData.tipoDocumento}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tipoDocumento: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dni">DNI</SelectItem>
                          <SelectItem value="nie">NIE</SelectItem>
                          <SelectItem value="pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Número de Documento */}
                    <div className="space-y-2">
                      <Label htmlFor="documentoIdentidad">Número de Documento *</Label>
                      <Input
                        id="documentoIdentidad"
                        name="documentoIdentidad"
                        value={formData.documentoIdentidad}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Fecha de Nacimiento */}
                    <div className="space-y-2">
                      <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                      <Input
                        id="fechaNacimiento"
                        name="fechaNacimiento"
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Nacionalidad */}
                    <div className="space-y-2">
                      <Label htmlFor="nacionalidad">Nacionalidad</Label>
                      <Input
                        id="nacionalidad"
                        name="nacionalidad"
                        value={formData.nacionalidad}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Estado Civil */}
                    <div className="space-y-2">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <Select
                        value={formData.estadoCivil}
                        onValueChange={(value) =>
                          setFormData({ ...formData, estadoCivil: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soltero">Soltero/a</SelectItem>
                          <SelectItem value="casado">Casado/a</SelectItem>
                          <SelectItem value="divorciado">Divorciado/a</SelectItem>
                          <SelectItem value="viudo">Viudo/a</SelectItem>
                          <SelectItem value="pareja_hecho">Pareja de Hecho</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Profesión */}
                    <div className="space-y-2">
                      <Label htmlFor="profesion">Profesión</Label>
                      <Input
                        id="profesion"
                        name="profesion"
                        value={formData.profesion}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Ingresos Mensuales */}
                    <div className="space-y-2">
                      <Label htmlFor="ingresosMensuales">Ingresos Mensuales (€)</Label>
                      <Input
                        id="ingresosMensuales"
                        name="ingresosMensuales"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.ingresosMensuales}
                        onChange={handleChange}
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
        </main>
      </div>
    </div>
  );
}
