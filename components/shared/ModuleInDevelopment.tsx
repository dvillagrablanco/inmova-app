'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Construction,
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface ModuleInDevelopmentProps {
  title: string;
  description?: string;
  expectedFeatures?: string[];
  progress?: number;
  estimatedDate?: string;
  relatedModules?: Array<{ name: string; href: string }>;
  apiEndpoint?: string;
}

export function ModuleInDevelopment({
  title,
  description,
  expectedFeatures = [],
  progress = 0,
  estimatedDate,
  relatedModules = [],
  apiEndpoint,
}: ModuleInDevelopmentProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (apiEndpoint) {
      checkApiStatus();
    } else {
      setApiStatus('unavailable');
    }
  }, [apiEndpoint]);

  const checkApiStatus = async () => {
    if (!apiEndpoint) return;
    try {
      const res = await fetch(apiEndpoint, { method: 'HEAD' });
      setApiStatus(res.ok ? 'available' : 'unavailable');
    } catch {
      setApiStatus('unavailable');
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
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
                  En Desarrollo
                </span>
                {apiStatus === 'available' && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    API Lista
                  </Badge>
                )}
              </div>
              <CardTitle className="text-3xl">{title}</CardTitle>
              {description && (
                <CardDescription className="text-base mt-2">{description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Progreso */}
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso de desarrollo</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Fecha estimada */}
              {estimatedDate && (
                <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Disponible estimado: <strong>{estimatedDate}</strong></span>
                </div>
              )}

              {/* Features */}
              {expectedFeatures.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-gray-700">
                    Funcionalidades Planificadas:
                  </h3>
                  <ul className="space-y-2">
                    {expectedFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <Zap className="mt-0.5 h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Módulos relacionados */}
              {relatedModules.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-gray-700">
                    Mientras tanto, prueba:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedModules.map((module, index) => (
                      <Button key={index} variant="outline" size="sm" asChild>
                        <Link href={module.href}>{module.name}</Link>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Path */}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 text-center font-mono">
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
                  <Link href="/ayuda">
                    Solicitar Funcionalidad
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default ModuleInDevelopment;
