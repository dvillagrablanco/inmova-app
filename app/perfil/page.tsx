'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Building2, Shield, Save, ArrowLeft, Home, Lock } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { MFASetup } from '@/components/security/mfa-setup';
import logger, { logError } from '@/lib/logger';


export default function PerfilPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [status, session, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        name: formData.name,
      };

      // Si se está cambiando la contraseña
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('Perfil actualizado correctamente');

        // Actualizar la sesión
        await update();

        // Limpiar campos de contraseña
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; variant: any }> = {
      super_admin: { label: 'Super Administrador', variant: 'destructive' },
      administrador: { label: 'Administrador', variant: 'destructive' },
      gestor: { label: 'Gestor', variant: 'default' },
      operador: { label: 'Operador', variant: 'secondary' },
    };
    return roles[role] || roles.gestor;
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as any;
  const roleBadge = getRoleBadge(user?.role || 'gestor');

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Mi Perfil</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona tu información personal y configuración de cuenta
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </div>

            {/* Información de Usuario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información de Usuario
                </CardTitle>
                <CardDescription>Tu información de cuenta y rol en el sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Correo Electrónico
                    </Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{user?.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Rol</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                    </div>
                  </div>
                  {user?.companyName && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Empresa</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{user.companyName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Editar Perfil */}
            <Card>
              <CardHeader>
                <CardTitle>Editar Perfil</CardTitle>
                <CardDescription>Actualiza tu nombre y configuración de la cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-muted-foreground">
                      Email (no editable)
                    </Label>
                    <Input id="email" value={formData.email} disabled className="bg-muted" />
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Cambiar Contraseña
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, currentPassword: e.target.value })
                          }
                          placeholder="Ingresa tu contraseña actual"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="newPassword">Nueva Contraseña</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) =>
                              setFormData({ ...formData, newPassword: e.target.value })
                            }
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            placeholder="Repite la nueva contraseña"
                          />
                        </div>
                      </div>

                      {formData.newPassword && formData.confirmPassword && (
                        <div className="text-sm">
                          {formData.newPassword === formData.confirmPassword ? (
                            <p className="text-green-600">✓ Las contraseñas coinciden</p>
                          ) : (
                            <p className="text-red-600">✗ Las contraseñas no coinciden</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección de MFA */}
                  <div className="pt-6 mt-6 border-t">
                    <MFASetup />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="gradient-primary shadow-primary"
                    >
                      {loading ? (
                        <>Guardando...</>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
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
