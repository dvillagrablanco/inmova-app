'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, ArrowLeft, Building2, Loader2, Users, Home, Briefcase, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginSchema, type LoginFormData } from '@/lib/form-schemas';
import { AccessibleInputField } from '@/components/forms/AccessibleFormField';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useState, Suspense } from 'react';

type UserRole = 'admin' | 'inquilino' | 'propietario' | 'proveedor' | 'comercial' | null;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams?.get('role') as UserRole;
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(roleFromUrl || null);

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
        // Redirect based on selected role
        let redirectPath = '/dashboard';
        if (selectedRole === 'inquilino') {
          redirectPath = '/portal-inquilino';
        } else if (selectedRole === 'propietario') {
          redirectPath = '/portal-propietario';
        } else if (selectedRole === 'proveedor') {
          redirectPath = '/portal-proveedor';
        } else if (selectedRole === 'comercial') {
          redirectPath = '/portal-comercial';
        }
        router.push(redirectPath);
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'admin' as UserRole,
      title: 'Administrador / Gestor',
      description: 'Acceso completo a la plataforma de gestión',
      icon: Users,
      color: 'from-indigo-500 to-violet-500',
    },
    {
      id: 'inquilino' as UserRole,
      title: 'Inquilino',
      description: 'Portal de inquilino con gestión de pagos y solicitudes',
      icon: Home,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'propietario' as UserRole,
      title: 'Propietario',
      description: 'Portal de propietario con visión de sus propiedades',
      icon: Building2,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'proveedor' as UserRole,
      title: 'Proveedor',
      description: 'Portal de proveedores para gestión de servicios',
      icon: Wrench,
      color: 'from-orange-500 to-amber-500',
    },
    {
      id: 'comercial' as UserRole,
      title: 'Red Comercial Externa',
      description: 'Portal para representantes comerciales y partners',
      icon: Briefcase,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  // Role selection view
  if (!selectedRole) {
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
          <div className="w-full max-w-4xl">
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
              <h1 className="text-3xl font-bold text-white mb-2">Selecciona tu Perfil</h1>
              <p className="text-gray-400 text-sm">¿Cómo deseas acceder a INMOVA?</p>
            </div>

            {/* Role Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {roles.map((role) => (
                <Card
                  key={role.id}
                  className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gray-800/50 border-gray-700 hover:border-gray-600"
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader>
                    <div className={`p-3 bg-gradient-to-br ${role.color} rounded-xl w-fit mb-3`}>
                      <role.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white">{role.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                      onClick={() => setSelectedRole(role.id)}
                    >
                      Continuar como {role.title}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-gray-400 text-sm mt-2">
              {selectedRole === 'admin' && 'Administrador / Gestor'}
              {selectedRole === 'inquilino' && 'Portal de Inquilino'}
              {selectedRole === 'propietario' && 'Portal de Propietario'}
              {selectedRole === 'proveedor' && 'Portal de Proveedor'}
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRole(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cambiar perfil
              </Button>
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
                disabled={isLoading}
                className="w-full gradient-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all shadow-primary disabled:opacity-50"
                aria-busy={isLoading}
                aria-live="polite"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
