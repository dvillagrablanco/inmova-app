'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/portal-inquilino/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al enviar la solicitud');
        return;
      }

      setSuccess(true);
      toast.success('Solicitud enviada');
    } catch (error) {
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  <p className="font-semibold mb-2">¡Solicitud enviada!</p>
                  <p className="text-sm">
                    Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu
                    contraseña.
                  </p>
                  <p className="text-sm mt-2">Revisa tu bandeja de entrada y la carpeta de spam.</p>
                </AlertDescription>
              </Alert>

              <Link href="/portal-inquilino/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </Button>

              <Link href="/portal-inquilino/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
