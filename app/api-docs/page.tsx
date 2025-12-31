/**
 * Swagger UI Page - Client Component
 * Interfaz interactiva para explorar la API
 */
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function ApiDocsPage() {
  useEffect(() => {
    // Asegurar que el script se ejecute después de cargar
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).SwaggerUIBundle) {
        (window as any).ui = (window as any).SwaggerUIBundle({
          url: "/api/docs",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            (window as any).SwaggerUIBundle.presets.apis,
            (window as any).SwaggerUIStandalonePreset
          ],
          plugins: [
            (window as any).SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          docExpansion: "list",
          defaultModelsExpandDepth: 1,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css" />
      <style jsx>{`
        #swagger-ui { max-width: 1460px; margin: 0 auto; padding: 20px; }
        :global(.swagger-ui .topbar) { display: none; }
      `}</style>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">📚 Inmova App API</h1>
          <p className="text-lg text-blue-100">Documentación interactiva v1.0.0</p>
        </div>
      </div>
      
      <div id="swagger-ui"></div>

      <Script 
        src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js" 
        strategy="lazyOnload"
      />
      <Script 
        src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-standalone-preset.js" 
        strategy="lazyOnload"
      />
    </>
  );
}
