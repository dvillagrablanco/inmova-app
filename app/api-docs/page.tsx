/**
 * Swagger UI Page - CDN Version
 * Interfaz interactiva para explorar la API
 */

export const metadata = {
  title: 'API Documentation - Inmova App',
  description: 'Documentación interactiva de la API REST de Inmova'
};

export default function ApiDocsPage() {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css" />
        <style>{`
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin:0; padding:0; }
          #swagger-ui { max-width: 1460px; margin: 0 auto; }
          .swagger-ui .topbar { display: none; }
        `}</style>
      </head>
      <body>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">📚 Inmova App API</h1>
            <p className="text-lg text-blue-100">Documentación interactiva v1.0.0</p>
          </div>
        </div>
        
        <div id="swagger-ui"></div>

        <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js" charSet="UTF-8"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-standalone-preset.js" charSet="UTF-8"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              window.ui = SwaggerUIBundle({
                url: "/api/docs",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                docExpansion: "list",
                defaultModelsExpandDepth: 1,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true
              });
            };
          `
        }} />
      </body>
    </html>
  );
}
