/**
 * Swagger UI Page
 * Interfaz interactiva para explorar la API
 */

'use client';

import { useEffect, useRef } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Inmova App - API Documentation</h1>
          <p className="text-gray-600 mt-2">
            Documentación interactiva de la API REST
          </p>
        </div>
        
        <SwaggerUI
          url="/api/docs"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          displayRequestDuration={true}
        />
      </div>
    </div>
  );
}
