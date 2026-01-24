'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Página de Propiedades Coliving - FUSIONADA
 * 
 * Esta página ahora redirige a la página de Unidades con el filtro de modo coliving.
 * La gestión de propiedades/unidades se ha unificado para simplificar la experiencia.
 * 
 * El campo "modoAlquiler" en cada unidad determina si es para alquiler tradicional o coliving.
 */
export default function ColivingPropertiesPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        {/* Info de Fusión */}
        <Alert className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
          <Users className="h-5 w-5 text-purple-600" />
          <AlertTitle className="text-purple-800 dark:text-purple-200">
            Gestión Unificada de Unidades
          </AlertTitle>
          <AlertDescription className="text-purple-700 dark:text-purple-300">
            Las propiedades de coliving ahora se gestionan desde la página de <strong>Unidades</strong>.
            Cada unidad puede configurarse como &quot;Alquiler Tradicional&quot; o &quot;Coliving&quot; según tu necesidad.
          </AlertDescription>
        </Alert>

        {/* Card Principal */}
        <Card className="border-2">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Propiedades Coliving</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                La gestión de propiedades coliving se ha fusionado con la página de Unidades 
                para una experiencia más simple y unificada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => router.push('/unidades?modoAlquiler=coliving')}
              >
                Ver Unidades Coliving
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => router.push('/unidades/nuevo')}
              >
                Crear Nueva Unidad
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Info className="h-4 w-4" />
                Al crear una unidad, selecciona &quot;Coliving&quot; en el campo &quot;Modo de Alquiler&quot;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Beneficios de la Fusión */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">✅ Gestión Centralizada</h3>
            <p className="text-sm text-muted-foreground">
              Todas tus propiedades en un solo lugar, sin duplicidades.
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">🔄 Flexibilidad</h3>
            <p className="text-sm text-muted-foreground">
              Cambia el modo de alquiler de una unidad en cualquier momento.
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">📊 Reportes Unificados</h3>
            <p className="text-sm text-muted-foreground">
              Estadísticas consolidadas de todas tus propiedades.
            </p>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
