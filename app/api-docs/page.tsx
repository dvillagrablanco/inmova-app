/**
 * Documentación de API - Swagger UI
 */

'use client';

import dynamic from 'next/dynamic';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando documentación...</div>,
});

import 'swagger-ui-react/swagger-ui.css';

export default function APIDocsPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground">Documentación interactiva de la API de Inmova</p>
        </div>
        <div className="bg-white rounded-lg shadow">
          <SwaggerUI url="/api-docs.json" />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
