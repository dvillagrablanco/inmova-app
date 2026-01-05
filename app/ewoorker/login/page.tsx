'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HardHat, Mail, Lock, AlertCircle, Loader2, Building2, Hammer, User } from 'lucide-react';
import { toast } from 'sonner';

export default function EwoorkerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/ewoorker/panel';
  const error = searchParams.get('error');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        toast.error('Credenciales incorrectas');
      } else if (result?.ok) {
        toast.success('¡Bienvenido a eWoorker!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex flex-col">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-orange-200 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/ewoorker/landing" className="flex items-center space-x-2">
            <HardHat className="h-8 w-8 text-orange-600" />
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                eWoorker
              </span>
              <p className="text-xs text-gray-600">by Inmova</p>
            </div>
          </Link>
          <Link href="/ewoorker/registro">
            <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
              Registrarse
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl border-orange-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
              <HardHat className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Acceder a eWoorker</CardTitle>
            <CardDescription>
              Plataforma de subcontratación para construcción
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error === 'CredentialsSignin' 
                    ? 'Email o contraseña incorrectos'
                    : 'Error al iniciar sesión'}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@empresa.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link href="/forgot-password" className="text-orange-600 hover:text-orange-700">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accediendo...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Tipos de cuenta</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
                <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
                  <Building2 className="h-5 w-5 mx-auto text-orange-600 mb-1" />
                  <span>Contratista</span>
                </div>
                <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Hammer className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
                  <span>Subcontratista</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <User className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                  <span>Socio</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <p className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/ewoorker/registro" className="text-orange-600 hover:text-orange-700 font-medium">
                Regístrate gratis
              </Link>
            </p>
            <p className="text-center text-xs text-gray-500">
              <Link href="/landing" className="hover:text-gray-700">
                ← Volver a Inmova
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} eWoorker by Inmova. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
