'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginSchema, type LoginFormData } from '@/lib/form-schemas';
import { AccessibleInputField } from '@/components/forms/AccessibleFormField';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useState } from 'react';
import { RateLimitError, isRateLimitError } from '@/components/ui/rate-limit-error';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitRetry, setRateLimitRetry] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const email = watch('email', '');
  const password = watch('password', '');

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setRateLimitRetry(0);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        // Verificar si es un error de rate limit
        const rateLimitCheck = isRateLimitError(result.error);
        if (rateLimitCheck.isRateLimit) {
          setRateLimitRetry(rateLimitCheck.retryAfter);
        } else {
          setError('Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      // Verificar si es un error de rate limit
      const rateLimitCheck = isRateLimitError(err);
      if (rateLimitCheck.isRateLimit) {
        setRateLimitRetry(rateLimitCheck.retryAfter);
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header con navegación */}
      <nav
        className="fixed top-0 w-full bg-black/50 backdrop-blur-md border-b border-gray-800 z-50"
        aria-label="Navegación principal"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/landing"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              aria-label="Ir a la página de inicio de INMOVA"
            >
              <Building2 className="h-6 w-6 text-indigo-500" aria-hidden="true" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>
            <Link href="/landing">
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-gray-800"
                aria-label="Volver a la página de inicio"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in">
            <OptimizedImage
              src="/inmova-logo-cover.jpg"
              alt="INMOVA - Logotipo de la plataforma integral de gestión inmobiliaria profesional"
              width={192}
              height={64}
              className="mx-auto mb-4"
              objectFit="contain"
              priority
            />
            <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
            <p className="text-gray-400 text-sm mt-2">Sistema de Gestión Inmobiliaria</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>

            {rateLimitRetry > 0 && (
              <RateLimitError
                retryAfter={rateLimitRetry}
                onRetryReady={() => setRateLimitRetry(0)}
              />
            )}

            {error && !rateLimitRetry && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
              >
                <AlertCircle size={20} aria-hidden="true" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <AccessibleInputField
                id="email-field"
                name="email"
                label="Correo Electrónico"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(val) => setValue('email', val)}
                error={errors.email?.message}
                required
              />

              <AccessibleInputField
                id="password-field"
                name="password"
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(val) => setValue('password', val)}
                error={errors.password?.message}
                required
              />

              <Button
                type="submit"
                disabled={isLoading || rateLimitRetry > 0}
                className="w-full gradient-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all shadow-primary disabled:opacity-50"
                aria-busy={isLoading}
                aria-live="polite"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {rateLimitRetry > 0
                  ? `Espera ${rateLimitRetry}s`
                  : isLoading
                    ? 'Iniciando sesión...'
                    : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-black font-medium hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
