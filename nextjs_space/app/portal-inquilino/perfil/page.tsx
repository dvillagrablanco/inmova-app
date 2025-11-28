'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowLeft, Home, Mail, Phone, User, Lock, MapPin, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface TenantData {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  dni: string;
  cuentaBancaria?: string | null;
  direccionActual?: string | null;
  profesion?: string | null;
  empresaTrabajo?: string | null;
  telefonoTrabajo?: string | null;
  ingresosMensuales?: number | null;
  contactoEmergencia?: string | null;
  telefonoEmergencia?: string | null;
}

export default function PerfilInquilinoPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [formData, setFormData] = useState<Partial<TenantData>>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/portal-inquilino/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTenantData();
    }
  }, [session]);

  const fetchTenantData = async () => {
    try {
      const res = await fetch('/api/portal-inquilino/perfil');
      if (!res.ok) throw new Error('Error al cargar datos');
      const data = await res.json();
      setTenantData(data);
      setFormData(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/portal-inquilino/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al actualizar perfil');
      
      toast.success('Perfil actualizado correctamente');
      fetchTenantData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/portal-inquilino/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al cambiar contraseña');
      }
      
      toast.success('Contraseña actualizada correctamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">No se encontraron datos del inquilino</div>
          <Button onClick={() => router.push('/portal-inquilino/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const initials = tenantData.nombreCompleto
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background shadow-sm">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Portal del Inquilino</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/portal-inquilino/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl p-4 md:p-6">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/portal-inquilino/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Mi Perfil</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Mi Perfil</h1>
        </div>

        {/* Avatar y Info Básica */}
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">{tenantData.nombreCompleto}</h2>
              <p className="text-sm text-muted-foreground">{tenantData.email}</p>
              <p className="text-sm text-muted-foreground">{tenantData.telefono}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Datos Personales</TabsTrigger>
            <TabsTrigger value="contacto">Contacto</TabsTrigger>
            <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          </TabsList>

          {/* Datos Personales */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tus datos personales y de empleo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombreCompleto">Nombre Completo</Label>
                    <Input
                      id="nombreCompleto"
                      value={formData.nombreCompleto || ''}
                      onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI/NIE</Label>
                    <Input
                      id="dni"
                      value={formData.dni || ''}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profesion">Profesión</Label>
                    <Input
                      id="profesion"
                      value={formData.profesion || ''}
                      onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresaTrabajo">Empresa</Label>
                    <Input
                      id="empresaTrabajo"
                      value={formData.empresaTrabajo || ''}
                      onChange={(e) => setFormData({ ...formData, empresaTrabajo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefonoTrabajo">Teléfono Trabajo</Label>
                    <Input
                      id="telefonoTrabajo"
                      value={formData.telefonoTrabajo || ''}
                      onChange={(e) => setFormData({ ...formData, telefonoTrabajo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ingresosMensuales">Ingresos Mensuales (€)</Label>
                    <Input
                      id="ingresosMensuales"
                      type="number"
                      value={formData.ingresosMensuales || ''}
                      onChange={(e) => setFormData({ ...formData, ingresosMensuales: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="direccionActual">Dirección</Label>
                    <Input
                      id="direccionActual"
                      value={formData.direccionActual || ''}
                      onChange={(e) => setFormData({ ...formData, direccionActual: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="cuentaBancaria">Cuenta Bancaria (IBAN)</Label>
                    <Input
                      id="cuentaBancaria"
                      value={formData.cuentaBancaria || ''}
                      onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacto */}
          <TabsContent value="contacto">
            <Card>
              <CardHeader>
                <CardTitle>Datos de Contacto</CardTitle>
                <CardDescription>
                  Actualiza tu información de contacto y emergencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono || ''}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 font-semibold">Contacto de Emergencia</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactoEmergencia">Nombre</Label>
                      <Input
                        id="contactoEmergencia"
                        value={formData.contactoEmergencia || ''}
                        onChange={(e) => setFormData({ ...formData, contactoEmergencia: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefonoEmergencia">Teléfono</Label>
                      <Input
                        id="telefonoEmergencia"
                        value={formData.telefonoEmergencia || ''}
                        onChange={(e) => setFormData({ ...formData, telefonoEmergencia: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Seguridad */}
          <TabsContent value="seguridad">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Actualiza tu contraseña de acceso al portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isSaving}>
                  {isSaving ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
