'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Users, Home, ArrowLeft, Save } from 'lucide-react';
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

export default function NuevoInquilinoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
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
        toast.success('Inquilino creado correctamente');
        router.push('/inquilinos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear el inquilino');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear el inquilino');
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
                onClick={() => router.push('/inquilinos')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Inquilinos
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
                    <BreadcrumbLink href="/inquilinos">Inquilinos</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nuevo Inquilino</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nuevo Inquilino</h1>
              <p className="text-muted-foreground">Registra un nuevo inquilino en el sistema</p>
            </div>

            {/* Formulario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Información del Inquilino
                </CardTitle>
                <CardDescription>Completa los datos personales del inquilino</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Nombre */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Juan Pérez García"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="juan.perez@email.com"
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        required
                        placeholder="+34 600 123 456"
                      />
                    </div>

                    {/* Tipo de Documento */}
                    <div className="space-y-2">
                      <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
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
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Documento de Identidad */}
                    <div className="space-y-2">
                      <Label htmlFor="documentoIdentidad">Número de Documento *</Label>
                      <Input
                        id="documentoIdentidad"
                        name="documentoIdentidad"
                        value={formData.documentoIdentidad}
                        onChange={handleChange}
                        required
                        placeholder="12345678A"
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
                        placeholder="Española"
                      />
                    </div>

                    {/* Estado Civil */}
                    <div className="space-y-2">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <Select
                        value={formData.estadoCivil}
                        onValueChange={(value) => setFormData({ ...formData, estadoCivil: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soltero">Soltero/a</SelectItem>
                          <SelectItem value="casado">Casado/a</SelectItem>
                          <SelectItem value="divorciado">Divorciado/a</SelectItem>
                          <SelectItem value="viudo">Viudo/a</SelectItem>
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
                        placeholder="Ingeniero de Software"
                      />
                    </div>

                    {/* Ingresos Mensuales */}
                    <div className="space-y-2">
                      <Label htmlFor="ingresosMensuales">Ingresos Mensuales (€)</Label>
                      <Input
                        id="ingresosMensuales"
                        name="ingresosMensuales"
                        type="number"
                        step="0.01"
                        value={formData.ingresosMensuales}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Crear Inquilino
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/inquilinos')}
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
