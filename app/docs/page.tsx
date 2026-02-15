/**
 * API Documentation Page
 * Página pública con Swagger UI
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation | Inmova',
  description: 'Documentación completa de la API de Inmova para desarrolladores',
  openGraph: {
    title: 'API Documentation | Inmova',
    description: 'Documentación completa de la API de Inmova',
    type: 'website',
  },
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="https://inmovaapp.com" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">Inmova</span>
                <span className="ml-2 text-sm text-gray-500">API Docs</span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://inmovaapp.com/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </a>
              <a
                href="https://inmovaapp.com/support"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Soporte
              </a>
              <a
                href="https://inmovaapp.com/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Iniciar sesión
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                ¿Primera vez usando la API?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Para obtener una API Key, inicia sesión en tu{' '}
                  <a
                    href="https://inmovaapp.com/dashboard/settings/api-keys"
                    className="font-medium underline hover:text-blue-600"
                  >
                    Dashboard
                  </a>{' '}
                  y ve a Configuración → API Keys.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div id="swagger-ui" />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/docs" className="text-sm text-gray-600 hover:text-gray-900">
                    Documentación
                  </a>
                </li>
                <li>
                  <a href="/docs/guides" className="text-sm text-gray-600 hover:text-gray-900">
                    Guías
                  </a>
                </li>
                <li>
                  <a href="/docs/examples" className="text-sm text-gray-600 hover:text-gray-900">
                    Ejemplos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Soporte</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="mailto:support@inmovaapp.com"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    support@inmovaapp.com
                  </a>
                </li>
                <li>
                  <a href="https://status.inmovaapp.com" className="text-sm text-gray-600 hover:text-gray-900">
                    Estado del servicio
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                    Términos de servicio
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                    Política de privacidad
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-400 text-center">
              © 2026 Inmova. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Swagger UI Script - loaded async */}
      <script
        src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"
        crossOrigin="anonymous"
        async
      />
      <script
        src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"
        crossOrigin="anonymous"
        async
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css"
      />

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              window.ui = SwaggerUIBundle({
                url: '/api/docs',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                tryItOutEnabled: true,
              });
            };
          `,
        }}
      />
    </div>
  );
}
