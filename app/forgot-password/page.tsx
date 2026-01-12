'use client';

/**
 * Página de Recuperación de Contraseña
 * 
 * Permite al usuario solicitar un enlace de recuperación
 * enviado a su email principal o de recuperación.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, ArrowLeft, Building2, Loader2, CheckCircle, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const email = watch('email', '');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-md border-b border-white/10 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/landing"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
            >
              <Home className="h-6 w-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              <span className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors">
                Inicio
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-screen p-4 pt-20 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/50 mb-6">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Recuperar Contraseña
            </h1>
            <p className="text-gray-400">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {/* Card */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardContent className="p-6">
              {isSuccess ? (
                // Estado de éxito
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    ¡Revisa tu email!
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Si <span className="font-medium text-white">{email}</span> está registrado,
                    recibirás un enlace para restablecer tu contraseña.
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    También hemos enviado el enlace a tu email de recuperación si lo configuraste.
                  </p>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        setIsSuccess(false);
                        setError('');
                      }}
                    >
                      Enviar de nuevo
                    </Button>
                    <Link href="/login">
                      <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                        Volver al Login
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                // Formulario
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Error general */}
                  {error && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

                  {/* Campo Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-200">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('email')}
                        type="email"
                        id="email"
                        placeholder="tu@email.com"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-400">{errors.email.message}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Puedes usar tu email principal o el email de recuperación que configuraste.
                    </p>
                  </div>

                  {/* Botón Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar enlace de recuperación'
                    )}
                  </Button>

                  {/* Volver al login */}
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio de sesión
                  </Link>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Info adicional */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
