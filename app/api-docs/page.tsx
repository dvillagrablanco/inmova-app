'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logger, { logError } from '@/lib/logger';

// Dynamic import with proper TypeScript handling
const SwaggerUI = dynamic<any>(
  () => import('swagger-ui-react').then((mod) => mod.default),
  { ssr: false }
);

export default function ApiDocsPage() {
  const router = useRouter();
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch('/api/docs');
        const data = await response.json();
        setSpec(data);
      } catch (error) {
        logger.error('Error fetching API spec:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, []);

  const downloadSpec = () => {
    if (!spec) return;
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inmova-api-spec.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold">Documentación de API</h1>
              </div>
            </div>
            {spec && (
              <Button variant="outline" size="sm" onClick={downloadSpec} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar OpenAPI Spec
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Versión de API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">v2.0.0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Formato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">OpenAPI 3.0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Autenticación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Session / JWT</p>
            </CardContent>
          </Card>
        </div>

        {/* Description Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Acerca de esta API</CardTitle>
            <CardDescription>
              Documentación interactiva completa de todos los endpoints disponibles en INMOVA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Base URL (Desarrollo):</strong> http://localhost:3000
              </p>
              <p>
                <strong>Base URL (Producción):</strong> https://homming-vidaro-6q1wdi.abacusai.app
              </p>
              <p className="mt-4">
                Esta documentación cubre todos los endpoints de la API REST de INMOVA, incluyendo:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Gestión de Edificios y Unidades</li>
                <li>Gestión de Inquilinos y Contratos</li>
                <li>Sistema de Pagos y Facturación</li>
                <li>Mantenimiento y Servicios</li>
                <li>Documentos y Archivos</li>
                <li>Reportes y Análisis</li>
                <li>Administración y Configuración</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Swagger UI */}
      <div className="container mx-auto px-4 pb-8">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : spec ? (
              <div className="swagger-wrapper">
                <SwaggerUI spec={spec} />
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                Error al cargar la especificación de la API
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        .swagger-wrapper {
          background: white;
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .scheme-container {
          background: #fafafa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}
