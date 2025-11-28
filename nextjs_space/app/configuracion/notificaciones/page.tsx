'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Bell, Home, Mail } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { PushNotificationManager } from '@/components/pwa/PushNotificationManager';

interface NotificationPreferences {
  emailPagoAtrasado: boolean;
  emailContratoVencimiento: boolean;
  emailMantenimiento: boolean;
  emailDocumento: boolean;
  pushPagoAtrasado: boolean;
  pushContratoVencimiento: boolean;
  pushMantenimiento: boolean;
  pushDocumento: boolean;
  frecuenciaResumen: string;
}

export default function NotificacionesConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailPagoAtrasado: true,
    emailContratoVencimiento: true,
    emailMantenimiento: true,
    emailDocumento: true,
    pushPagoAtrasado: true,
    pushContratoVencimiento: true,
    pushMantenimiento: true,
    pushDocumento: false,
    frecuenciaResumen: 'semanal',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPreferences();
    }
  }, [status, router]);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notification-preferences');
      if (!res.ok) throw new Error('Error al cargar preferencias');
      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) throw new Error('Error al guardar preferencias');

      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setIsSaving(false);
    }
  };



  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 lg:p-8">
          {/* Header con Breadcrumbs */}
          <div className="mb-6 space-y-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Inicio
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Configuración de Notificaciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Configuración de Notificaciones
                </h1>
                <p className="text-muted-foreground mt-2">
                  Personaliza cómo y cuándo recibes notificaciones
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Notificaciones por Email */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <CardTitle>Notificaciones por Email</CardTitle>
                </div>
                <CardDescription>
                  Recibe alertas importantes en tu correo electrónico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailPagoAtrasado">
                    Pagos atrasados
                  </Label>
                  <Switch
                    id="emailPagoAtrasado"
                    checked={preferences.emailPagoAtrasado}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        emailPagoAtrasado: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailContratoVencimiento">
                    Vencimiento de contratos
                  </Label>
                  <Switch
                    id="emailContratoVencimiento"
                    checked={preferences.emailContratoVencimiento}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        emailContratoVencimiento: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailMantenimiento">
                    Mantenimiento programado
                  </Label>
                  <Switch
                    id="emailMantenimiento"
                    checked={preferences.emailMantenimiento}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        emailMantenimiento: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailDocumento">
                    Vencimiento de documentos
                  </Label>
                  <Switch
                    id="emailDocumento"
                    checked={preferences.emailDocumento}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        emailDocumento: checked,
                      })
                    }
                  />
                </div>
                <div className="pt-4 border-t">
                  <Label htmlFor="frecuenciaResumen" className="mb-2 block">
                    Frecuencia de resumen por email
                  </Label>
                  <Select
                    value={preferences.frecuenciaResumen}
                    onValueChange={(value) =>
                      setPreferences({
                        ...preferences,
                        frecuenciaResumen: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diario</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="nunca">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notificaciones Push */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <CardTitle>Notificaciones Push</CardTitle>
                </div>
                <CardDescription>
                  Recibe notificaciones en tiempo real en tu navegador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushPagoAtrasado">
                    Pagos atrasados
                  </Label>
                  <Switch
                    id="pushPagoAtrasado"
                    checked={preferences.pushPagoAtrasado}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        pushPagoAtrasado: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushContratoVencimiento">
                    Vencimiento de contratos
                  </Label>
                  <Switch
                    id="pushContratoVencimiento"
                    checked={preferences.pushContratoVencimiento}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        pushContratoVencimiento: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushMantenimiento">
                    Mantenimiento programado
                  </Label>
                  <Switch
                    id="pushMantenimiento"
                    checked={preferences.pushMantenimiento}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        pushMantenimiento: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushDocumento">
                    Vencimiento de documentos
                  </Label>
                  <Switch
                    id="pushDocumento"
                    checked={preferences.pushDocumento}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        pushDocumento: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuración de Notificaciones Push del Navegador */}
          <div className="mt-6">
            <PushNotificationManager />
          </div>

          {/* Botón Guardar */}
          <div className="mt-6">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
