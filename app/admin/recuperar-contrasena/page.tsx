'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, Key, Mail } from 'lucide-react';
import logger from '@/lib/logger';
import { toast } from 'sonner';

function RecuperarContrasenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/password-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success('Se ha enviado un enlace de recuperación a tu email');

        // En desarrollo, mostrar el token
        if (data.token && process.env.NODE_ENV === 'development') {
          logger.info(`Token de desarrollo: ${data.token}`);
          // Redirigir automáticamente en desarrollo
          setTimeout(() => {
            router.push(`/admin/recuperar-contrasena?token=${data.token}`);
          }, 2000);
        }
      } else {
        setError(data.error || 'Error al solicitar recuperación');
      }
    } catch (error) {
      logger.error('Error al solicitar recuperación:', error);
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/password-recovery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success('Contraseña restablecida exitosamente');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Error al restablecer contraseña');
      }
    } catch (error) {
      logger.error('Error al restablecer contraseña:', error);
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                {token ? '¡Contraseña Restablecida!' : '¡Solicitud Enviada!'}
              </h2>
              <p className="text-muted-foreground">
                {token
                  ? 'Tu contraseña ha sido restablecida exitosamente. Serás redirigido al login...'
                  : 'Si el email existe, recibirás un enlace de recuperación en breve.'}
              </p>
              <Button onClick={() => router.push('/login')} className="mt-6">
                Ir al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-indigo-100 rounded-full p-3 w-fit mb-4">
            {token ? (
              <Key className="h-8 w-8 text-indigo-600" />
            ) : (
              <Mail className="h-8 w-8 text-indigo-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {token ? 'Restablecer Contraseña' : 'Recuperar Contraseña'}
          </CardTitle>
          <CardDescription>
            {token
              ? 'Ingresa tu nueva contraseña de super administrador'
              : 'Ingresa tu email de super administrador para recibir un enlace de recuperación'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {token ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email de Super Admin</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Seguridad</AlertTitle>
                <AlertDescription>
                  Solo se pueden recuperar cuentas de super administrador. Recibirás un email con
                  instrucciones si la cuenta existe.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => router.push('/login')} className="text-sm">
              Volver al Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RecuperarContrasenaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <RecuperarContrasenaContent />
    </Suspense>
  );
}
