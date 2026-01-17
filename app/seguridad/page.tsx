'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  Shield,
  Smartphone,
  Key,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Monitor,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export default function SeguridadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activeSessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Chrome en Windows',
      location: 'Madrid, España',
      lastActive: 'Activo ahora',
      current: true,
    },
    {
      id: '2',
      device: 'Safari en iPhone',
      location: 'Madrid, España',
      lastActive: 'Hace 2 horas',
      current: false,
    },
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    // Simular cambio de contraseña
    toast.success('Contraseña actualizada correctamente');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.success(twoFactorEnabled ? '2FA desactivado' : '2FA activado');
  };

  const handleEndSession = (sessionId: string) => {
    toast.success('Sesión cerrada');
  };

  const handleEndAllSessions = () => {
    toast.success('Todas las sesiones han sido cerradas');
    signOut({ callbackUrl: '/login' });
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6 px-4">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/configuracion">Configuración</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Seguridad</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/configuracion')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Seguridad</h1>
              <p className="text-muted-foreground">Protege tu cuenta</p>
            </div>
          </div>
        </div>

        {/* Estado de seguridad */}
        <Card className={twoFactorEnabled ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {twoFactorEnabled ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">
                  {twoFactorEnabled ? 'Cuenta protegida' : 'Mejora tu seguridad'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled
                    ? 'Tu cuenta está protegida con 2FA'
                    : 'Activa la verificación en dos pasos para mayor seguridad'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cambiar contraseña */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Cambiar Contraseña</CardTitle>
            </div>
            <CardDescription>
              Usa una contraseña fuerte de al menos 8 caracteres
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contraseña actual</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmar nueva contraseña</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <Button onClick={handlePasswordChange}>
              <Lock className="h-4 w-4 mr-2" />
              Cambiar contraseña
            </Button>
          </CardContent>
        </Card>

        {/* Verificación en dos pasos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle>Verificación en Dos Pasos (2FA)</CardTitle>
            </div>
            <CardDescription>
              Añade una capa extra de seguridad a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Autenticador de Google/Authy</p>
                  <p className="text-sm text-muted-foreground">
                    Usa una app de autenticación para generar códigos
                  </p>
                </div>
              </div>
              <Switch checked={twoFactorEnabled} onCheckedChange={handleEnable2FA} />
            </div>

            {!twoFactorEnabled && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Te recomendamos activar 2FA para proteger tu cuenta de accesos no autorizados.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Sesiones activas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                <CardTitle>Sesiones Activas</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={handleEndAllSessions}>
                <LogOut className="h-4 w-4 mr-1" />
                Cerrar todas
              </Button>
            </div>
            <CardDescription>
              Dispositivos donde tu cuenta está conectada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  s.current ? 'border-green-200 bg-green-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{s.device}</p>
                      {s.current && (
                        <Badge variant="outline" className="text-xs">
                          Sesión actual
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.location} · {s.lastActive}
                    </p>
                  </div>
                </div>
                {!s.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEndSession(s.id)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacidad */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <CardTitle>Privacidad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Mostrar actividad online</p>
                <p className="text-xs text-muted-foreground">
                  Otros usuarios verán cuando estés conectado
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Historial de actividad</p>
                <p className="text-xs text-muted-foreground">
                  Guardar registro de tus acciones
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
