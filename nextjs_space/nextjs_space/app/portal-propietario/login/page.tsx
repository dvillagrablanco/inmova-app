'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import logger from '@/lib/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PropietarioLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIntentosRestantes(null);

    try {
      const res = await fetch('/api/auth-propietario/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include', // Importante para incluir cookies
      });

      const data = await res.json();

      if (res.ok) {
        // La autenticación ahora se maneja con cookies httpOnly
        toast.success(data.message || 'Inicio de sesión exitoso');
        router.push('/portal-propietario');
        router.refresh(); // Forzar recarga para obtener datos actualizados
      } else {
        setError(data.error || 'Error al iniciar sesión');
        if (data.intentosRestantes !== undefined) {
          setIntentosRestantes(data.intentosRestantes);
        }
        toast.error(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      logger.error('Error:', error);
      setError('Error de conexión. Por favor, intenta de nuevo.');
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Portal del Propietario</CardTitle>
            <CardDescription className="text-base mt-2">
              Accede a la información de tus propiedades
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {intentosRestantes !== null && intentosRestantes > 0 && (
                  <span className="block mt-1 text-xs">
                    Intentos restantes: {intentosRestantes}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="propietario@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/portal-propietario/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Si no tienes acceso al portal, contacta con tu gestor inmobiliario.
            </p>
          </div>

          <div className="pt-4 border-t text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
