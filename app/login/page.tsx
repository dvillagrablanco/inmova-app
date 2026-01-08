'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, ArrowLeft, Building2, Loader2, Home, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginSchema, type LoginFormData } from '@/lib/form-schemas';
import { AccessibleInputField } from '@/components/forms/AccessibleFormField';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError('Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
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
      <nav
        className="fixed top-0 w-full bg-black/20 backdrop-blur-md border-b border-white/10 z-50"
        aria-label="Navegación principal"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/landing"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
              aria-label="Ir a la página de inicio de INMOVA"
            >
              <div className="relative">
                <Home className="h-6 w-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" aria-hidden="true" />
                <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-lg group-hover:bg-indigo-300/30 transition-all" />
              </div>
              <span className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors">
                Inicio
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-screen p-4 pt-20 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo y título mejorado */}
          <div className="text-center mb-8 animate-fade-in">
            {/* Logo con diseño moderno */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/50 mb-6 relative group">
              <Building2 className="w-10 h-10 text-white" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            </div>

            {/* Título mejorado */}
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                INMOVA
              </span>
            </h1>
            <p className="text-indigo-200/70 text-sm font-medium tracking-wide">
              Plataforma de Gestión Inmobiliaria
            </p>
          </div>

          {/* Card del formulario con glassmorphism */}
          <div className="relative group animate-fade-in">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300" />
            
            {/* Formulario */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">
                Iniciar Sesión
              </h2>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 animate-shake"
                >
                  <div className="flex-shrink-0">
                    <AlertCircle size={20} className="text-red-400" aria-hidden="true" />
                  </div>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Email field con mejor estilo */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-indigo-100 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setValue('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:bg-white/15 transition-all"
                      required
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
                  )}
                </div>

                {/* Password field con toggle de visibilidad */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-indigo-100 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setValue('password', e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:bg-white/15 transition-all"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-300 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
                  )}
                </div>

                {/* Botón mejorado */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-busy={isLoading}
                  aria-live="polite"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" aria-hidden="true" />
                  )}
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  
                  {!isLoading && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </Button>
              </form>

              {/* Footer del formulario */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-center text-sm text-indigo-200/70">
                  ¿No tienes cuenta?{' '}
                  <Link 
                    href="/register" 
                    className="font-semibold text-indigo-300 hover:text-white transition-colors underline decoration-indigo-400/30 hover:decoration-white/50"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer informativo */}
          <div className="mt-8 text-center">
            <p className="text-indigo-200/50 text-xs">
              © 2026 INMOVA. Plataforma segura para gestión inmobiliaria profesional.
            </p>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
