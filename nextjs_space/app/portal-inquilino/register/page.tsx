'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, UserCheck, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [invitationCode, setInvitationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validar código de invitación
  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/portal-inquilino/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: invitationCode })
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Código de invitación no válido');
        return;
      }

      setTenantInfo(data);
      setStep('password');
      toast.success('¡Código válido!');
    } catch (error) {
      setError('Error al validar el código de invitación');
    } finally {
      setLoading(false);
    }
  };

  // Completar registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/portal-inquilino/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationCode,
          password,
          confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al completar el registro');
        return;
      }

      toast.success('¡Registro completado exitosamente!');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push('/portal-inquilino/login');
      }, 2000);
    } catch (error) {
      setError('Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
            {step === 'code' ? (
              <KeyRound className="w-8 h-8 text-white" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'code' ? 'Registro de Inquilino' : 'Crear Contraseña'}
          </CardTitle>
          <CardDescription>
            {step === 'code'
              ? 'Ingresa el código de invitación que recibiste'
              : 'Configura tu contraseña para acceder al portal'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'code' ? (
            <form onSubmit={handleValidateCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invitationCode">Código de Invitación</Label>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="Ej: ABC12345"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono text-center text-lg tracking-wider"
                  maxLength={8}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Ingresa el código de 8 caracteres que recibiste
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || invitationCode.length !== 8}
              >
                {loading ? 'Validando...' : 'Validar Código'}
              </Button>
            </form>
          ) : (
            <>
              {tenantInfo && (
                <Alert className="border-green-200 bg-green-50">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-semibold">{tenantInfo.tenantName}</div>
                    <div className="text-sm">{tenantInfo.email}</div>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                      placeholder="Repite tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Indicador de fortaleza de contraseña */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle
                        className={`w-3 h-3 ${
                          password.length >= 8 ? 'text-green-500' : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}
                      >
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle
                        className={`w-3 h-3 ${
                          password === confirmPassword && confirmPassword
                            ? 'text-green-500'
                            : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={
                          password === confirmPassword && confirmPassword
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }
                      >
                        Las contraseñas coinciden
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('code')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || password.length < 8 || password !== confirmPassword}
                    className="flex-1"
                  >
                    {loading ? 'Registrando...' : 'Completar Registro'}
                  </Button>
                </div>
              </form>
            </>
          )}

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/portal-inquilino/login"
                className="text-primary hover:underline font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
