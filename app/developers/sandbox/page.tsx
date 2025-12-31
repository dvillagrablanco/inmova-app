import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export default function SandboxPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Sandbox Environment</h1>
        <p className="text-gray-600 text-lg">
          Entorno de pruebas completo con datos ficticios. Prueba la API sin afectar datos de
          producción.
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          El sandbox usa API keys de test (empiezan con <code className="font-mono">sk_test_</code>
          ). Todos los datos son ficticios y se resetean cada 24 horas.
        </AlertDescription>
      </Alert>

      {/* Getting Started */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Primeros Pasos</CardTitle>
          <CardDescription>Cómo usar el entorno sandbox</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Obtén una API Key de Test</h3>
            <p className="text-sm text-gray-600">
              Ve a{' '}
              <a href="/dashboard/integrations/api-keys" className="text-blue-600 hover:underline">
                Dashboard → API Keys
              </a>{' '}
              y crea una key con prefijo <code>sk_test_</code>
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Usa el Endpoint de Sandbox</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>
                {`curl https://inmovaapp.com/api/v1/sandbox?resource=properties \\
  -H "Authorization: Bearer sk_test_your_key_here"`}
              </code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Experimenta sin Riesgo</h3>
            <p className="text-sm text-gray-600">
              Todos los datos son ficticios. Puedes crear, actualizar y eliminar registros sin
              afectar datos reales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Available Resources */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recursos Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>GET</Badge>
                <code className="text-sm">/api/v1/sandbox?resource=properties</code>
              </div>
              <p className="text-sm text-gray-600">
                2 propiedades de ejemplo (apartamento en Madrid, casa en Barcelona)
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>GET</Badge>
                <code className="text-sm">/api/v1/sandbox?resource=tenants</code>
              </div>
              <p className="text-sm text-gray-600">2 inquilinos de ejemplo con datos ficticios</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>GET</Badge>
                <code className="text-sm">/api/v1/sandbox?resource=contracts</code>
              </div>
              <p className="text-sm text-gray-600">
                1 contrato firmado vinculando propiedad y inquilino
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">POST</Badge>
                <code className="text-sm">/api/v1/sandbox?resource=properties</code>
              </div>
              <p className="text-sm text-gray-600">
                Crear recursos (no se persisten, solo para testing)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ejemplos de Código</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">JavaScript/TypeScript</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import { InmovaClient } from '@inmova/sdk';

const client = new InmovaClient({
  apiKey: 'sk_test_your_key_here',
  baseURL: 'https://inmovaapp.com/api/v1/sandbox',
});

const properties = await client.get('?resource=properties');
console.log(properties);`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Python</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`from inmova import InmovaClient

client = InmovaClient(
    api_key="sk_test_your_key_here",
    base_url="https://inmovaapp.com/api/v1/sandbox"
)

properties = client.get(params={"resource": "properties"})
print(properties)`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">cURL</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`# Listar propiedades
curl "https://inmovaapp.com/api/v1/sandbox?resource=properties" \\
  -H "Authorization: Bearer sk_test_your_key_here"

# Crear propiedad (no se persiste)
curl -X POST "https://inmovaapp.com/api/v1/sandbox?resource=properties" \\
  -H "Authorization: Bearer sk_test_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "Calle Test 789",
    "city": "Valencia",
    "price": 1000,
    "type": "APARTMENT"
  }'`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Características del Sandbox</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Datos ficticios realistas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Reset automático cada 24 horas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Rate limits más altos que producción</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Webhooks de prueba disponibles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Sin riesgo de afectar datos reales</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Mismo formato de respuesta que producción</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-2">¿Listo para Producción?</h3>
        <p className="text-gray-600 mb-4">
          Una vez que hayas probado en sandbox, obtén una API key de producción (
          <code>sk_live_</code>) para trabajar con datos reales.
        </p>
        <a
          href="/dashboard/integrations/api-keys"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Crear API Key de Producción
        </a>
      </div>
    </div>
  );
}
