'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowLeft,
  Building2,
  Briefcase,
  CheckCircle,
  Star,
  Shield,
  TrendingUp,
  Zap,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  registerSchema,
  type RegisterFormData,
  type BusinessVertical,
  businessVerticalLabels,
} from '@/lib/form-schemas-auth';
import {
  AccessibleInputField,
  AccessibleSelectField,
} from '@/components/forms/AccessibleFormField';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      businessVertical: 'alquiler_tradicional',
      password: '',
      confirmPassword: '',
    },
  });

  const name = watch('name', '');
  const email = watch('email', '');
  const businessVertical = watch('businessVertical', 'alquiler_tradicional');
  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'gestor',
          businessVertical: data.businessVertical,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.error || 'Error al crear cuenta. Por favor, intenta de nuevo.');
        return;
      }

      // Auto-login after signup
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError(
          'Cuenta creada pero error al iniciar sesión. Por favor, intenta iniciar sesión manualmente.'
        );
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Error al crear cuenta. Por favor, intenta de nuevo.');
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
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Benefits & Trust Indicators */}
            <div className="hidden lg:block space-y-6 animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Building2 className="h-10 w-10 text-indigo-400" />
                  </div>
                  <span className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    INMOVA
                  </span>
                </div>

                <Badge className="mb-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-base px-4 py-2">
                  <Star className="h-4 w-4 mr-2" />
                  PRUEBA GRATIS 30 DÍAS
                </Badge>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Comienza Tu Transformación Digital
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Únete a más de <span className="font-bold text-indigo-300">500 empresas</span> que
                  ya confían en INMOVA
                </p>
              </div>

              {/* Benefits Cards */}
              <div className="space-y-4">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-2">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        30 Días Gratis - Sin Tarjeta
                      </h3>
                      <p className="text-gray-300 text-sm">
                        Acceso completo a los 56 módulos profesionales
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg p-2">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Configuración en 5 Minutos</h3>
                      <p className="text-gray-300 text-sm">Onboarding guiado paso a paso</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg p-2">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Seguridad Bancaria</h3>
                      <p className="text-gray-300 text-sm">
                        Certificación ISO 27001 y cifrado extremo-a-extremo
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-2">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Ahorra hasta 70%</h3>
                      <p className="text-gray-300 text-sm">
                        Consolida 5-8 herramientas en una sola plataforma
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trust Badges */}
              <div className="pt-6">
                <p className="text-gray-400 text-sm mb-4">Empresas que confían en nosotros:</p>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-semibold">4.9/5</span>
                    <span>(200+ opiniones)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full max-w-md mx-auto">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8 animate-fade-in">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Building2 className="h-8 w-8 text-indigo-600" />
                  </div>
                  <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    INMOVA
                  </span>
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-2">
                  <Star className="h-4 w-4 mr-2" />
                  PRUEBA GRATIS 30 DÍAS
                </Badge>
              </div>

              {/* Register Form */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2>
                  <p className="text-gray-600">Comienza tu prueba gratuita de 30 días hoy mismo</p>
                </div>

                {error && (
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
                    id="name-field"
                    name="name"
                    label="Nombre Completo"
                    type="text"
                    placeholder="Juan Pérez"
                    value={name}
                    onChange={(val) => setValue('name', val)}
                    error={errors.name?.message}
                    required
                  />

                  <AccessibleSelectField
                    id="businessVertical-field"
                    name="businessVertical"
                    label="Tipo de Negocio"
                    placeholder="Selecciona tu tipo de negocio"
                    value={businessVertical}
                    onChange={(val) => setValue('businessVertical', val as BusinessVertical)}
                    options={Object.entries(businessVerticalLabels).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    error={errors.businessVertical?.message}
                    required
                    helpText="Selecciona el tipo de negocio que mejor describa tu actividad"
                  />

                  <AccessibleInputField
                    id="email-field"
                    name="email"
                    label="Correo Electrónico"
                    type="email"
                    placeholder="tu@email.com"
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
                    helpText="Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas, números y caracteres especiales"
                  />

                  <AccessibleInputField
                    id="confirmPassword-field"
                    name="confirmPassword"
                    label="Confirmar Contraseña"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(val) => setValue('confirmPassword', val)}
                    error={errors.confirmPassword?.message}
                    required
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full gradient-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all shadow-primary disabled:opacity-50"
                    aria-busy={isLoading}
                    aria-live="polite"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    {isLoading ? 'Registrando...' : 'Registrarse'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" className="text-black font-medium hover:underline">
                      Inicia sesión aquí
                    </Link>
                  </p>
                </div>

                {/* Trust Footer in Form */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Al crear una cuenta, aceptas nuestros{' '}
                    <Link
                      href="/landing/legal/terminos"
                      className="text-indigo-600 hover:underline"
                    >
                      Términos y Condiciones
                    </Link>{' '}
                    y{' '}
                    <Link
                      href="/landing/legal/privacidad"
                      className="text-indigo-600 hover:underline"
                    >
                      Política de Privacidad
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
