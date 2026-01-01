'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <h1 className="sr-only">Acceso No Autorizado</h1>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder a esta página. Por favor, contacta con tu administrador
            si crees que es un error.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
          <Button variant="outline" onClick={() => router.back()} className="w-full">
            Página Anterior
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
