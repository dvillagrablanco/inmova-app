'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { 
  Mail, 
  AlertCircle, 
  Building2, 
  Loader2, 
  Home, 
  CheckCircle,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, introduce un email válido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const email = watch('email', '');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok && result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Error al procesar la solicitud. Por favor, intenta de nuevo.');
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

      {/* Header minimalista */}
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
          {/* Logo y título */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/50 mb-6 relative group">
              <Building2 className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                INMOVA
              </span>
            </h1>
            <p className="text-indigo-200/70 text-sm font-medium tracking-wide">
              Recuperar Contraseña
            </p>
          </div>

          {/* Card del formulario */}
          <div className="relative group animate-fade-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300" />
            
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
              {success ? (
                // Mensaje de éxito
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    ¡Revisa tu correo!
                  </h2>
                  <p className="text-indigo-200/70 mb-6">
                    Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
                  </p>
                  <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-xl p-4 mb-6">
                    <p className="text-sm text-indigo-200">
                      <Shield className="inline-block w-4 h-4 mr-1" />
                      El enlace expirará en <strong>1 hora</strong> por seguridad.
                    </p>
                  </div>
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver al inicio de sesión
                    </Button>
                  </Link>
                </div>
              ) : (
                // Formulario
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    ¿Olvidaste tu contraseña?
                  </h2>
                  <p className="text-indigo-200/70 mb-6 text-sm">
                    No te preocupes. Introduce tu email y te enviaremos un enlace para restablecerla.
                  </p>

                  {error && (
                    <div
                      role="alert"
                      className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 animate-shake"
                    >
                      <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: '#ffffff' }}
                      >
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-indigo-200" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          {...register('email')}
                          placeholder="tu@correo.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all placeholder-slate-400"
                          style={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            border: '2px solid rgba(129, 140, 248, 0.5)',
                          }}
                          autoComplete="email"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
                      )}
                      <p className="mt-2 text-xs text-indigo-200/50">
                        También puedes usar tu email de recuperación si configuraste uno.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full relative group mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" />
                      )}
                      {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-center text-sm text-indigo-200/70">
                      ¿Recordaste tu contraseña?{' '}
                      <Link 
                        href="/login" 
                        className="font-semibold text-indigo-300 hover:text-white transition-colors underline decoration-indigo-400/30 hover:decoration-white/50"
                      >
                        Volver al inicio de sesión
                      </Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-indigo-200/50 text-xs">
              © 2026 INMOVA. Sistema seguro de recuperación de contraseña.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
