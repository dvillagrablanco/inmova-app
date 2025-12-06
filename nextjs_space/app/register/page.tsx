'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Mail, Lock, User, AlertCircle, ArrowLeft, Building2, Briefcase, CheckCircle, Star, Shield, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type BusinessVertical = 'alquiler_tradicional' | 'str_vacacional' | 'coliving' | 'construccion' | 'flipping' | 'servicios_profesionales' | 'mixto';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessVertical, setBusinessVertical] = useState<BusinessVertical>('alquiler_tradicional');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'gestor', businessVertical }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear cuenta');
        return;
      }

      // Auto-login after signup
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Cuenta creada pero error al iniciar sesión');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header con navegación */}
      <nav className="fixed top-0 w-full bg-black/50 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Building2 className="h-6 w-6 text-indigo-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>
            <Link href="/landing">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
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
              <div className="relative w-48 h-16 mb-6">
                <Image
                  src="/inmova-logo-cover.jpg"
                  alt="INMOVA"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              
              <Badge className="mb-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-base px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                PRUEBA GRATIS 30 DÍAS
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Comienza Tu Transformación Digital
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Únete a más de <span className="font-bold text-indigo-300">500 empresas</span> que ya confían en INMOVA
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
                    <h3 className="text-white font-semibold mb-1">30 Días Gratis - Sin Tarjeta</h3>
                    <p className="text-gray-300 text-sm">Acceso completo a los 56 módulos profesionales</p>
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
                    <p className="text-gray-300 text-sm">Certificación ISO 27001 y cifrado extremo-a-extremo</p>
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
                    <p className="text-gray-300 text-sm">Consolida 5-8 herramientas en una sola plataforma</p>
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
              <div className="relative w-48 h-16 mx-auto mb-4">
                <Image
                  src="/inmova-logo-cover.jpg"
                  alt="INMOVA"
                  fill
                  className="object-contain"
                  priority
                />
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
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Negocio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase size={20} className="text-gray-400" />
                </div>
                <select
                  value={businessVertical}
                  onChange={(e) => setBusinessVertical(e.target.value as BusinessVertical)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option value="alquiler_tradicional">Alquiler Tradicional (Residencial/Comercial)</option>
                  <option value="str_vacacional">STR / Alquiler Vacacional (Airbnb, Booking)</option>
                  <option value="coliving">Coliving / Alquiler por Habitaciones</option>
                  <option value="flipping">Inversión Inmobiliaria (Flipping)</option>
                  <option value="construccion">Construcción / Promoción</option>
                  <option value="servicios_profesionales">Servicios Profesionales (Arquitectura, Asesoría)</option>
                  <option value="mixto">Mixto / Varios Tipos</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all shadow-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
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
                  <Link href="/landing/legal/terminos" className="text-indigo-600 hover:underline">
                    Términos y Condiciones
                  </Link>{' '}
                  y{' '}
                  <Link href="/landing/legal/privacidad" className="text-indigo-600 hover:underline">
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
