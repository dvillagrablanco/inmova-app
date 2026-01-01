'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ComingSoonPageProps {
  title: string;
  description?: string;
  expectedFeatures?: string[];
}

export function ComingSoonPage({ title, description, expectedFeatures }: ComingSoonPageProps) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 blur-3xl opacity-20 animate-pulse" />
          <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-2xl">
            <Construction className="h-16 w-16 text-white" />
          </div>
        </div>

        {/* Content Card */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium text-indigo-600 uppercase tracking-wide">
                Próximamente
              </span>
            </div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {description && (
              <CardDescription className="text-base mt-2">{description}</CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info */}
            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <p className="text-sm text-center text-gray-700 dark:text-gray-300">
                Esta funcionalidad está en desarrollo activo y estará disponible próximamente.
                Estamos trabajando para ofrecerte la mejor experiencia posible.
              </p>
            </div>

            {/* Expected Features */}
            {expectedFeatures && expectedFeatures.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">
                  Funcionalidades Planificadas:
                </h3>
                <ul className="space-y-2">
                  {expectedFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Current Path */}
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center font-mono">
                Ruta: {pathname}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild variant="default" className="flex-1">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/configuracion">
                  Ver Configuración
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <p className="text-xs text-gray-500 text-center max-w-md">
          Si necesitas esta funcionalidad con urgencia, por favor contacta con el equipo de soporte
          o administración.
        </p>
      </div>
    </div>
  );
}
