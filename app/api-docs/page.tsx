/**
 * Documentación de API - Swagger UI
 */

'use client';

import dynamic from 'next/dynamic';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando documentación...</div>,
});

import 'swagger-ui-react/swagger-ui.css';

export default function APIDocsPage() {
  return (
    <div>
      <SwaggerUI url="/api-docs.json" />
    </div>
  );
}
