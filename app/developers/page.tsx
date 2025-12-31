import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Code2, PlayCircle, Zap, Shield, Cloud } from 'lucide-react';

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Construye con Inmova PropTech API</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            API REST moderna, SDKs en múltiples lenguajes, webhooks en tiempo real y documentación
            completa para desarrollar aplicaciones inmobiliarias de clase mundial.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/api-docs">Ver Documentación →</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white" asChild>
              <Link href="/dashboard/integrations/api-keys">Obtener API Key</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div>
              <div className="text-4xl font-bold">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold">&lt;100ms</div>
              <div className="text-blue-100">Avg Response</div>
            </div>
            <div>
              <div className="text-4xl font-bold">50+</div>
              <div className="text-blue-100">Endpoints</div>
            </div>
            <div>
              <div className="text-4xl font-bold">3</div>
              <div className="text-blue-100">SDKs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Quick Start</h2>

          <Tabs defaultValue="javascript" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>

            <TabsContent value="javascript" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Instalación</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>npm install @inmova/sdk</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ejemplo de Uso</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`import { InmovaClient } from '@inmova/sdk';

const client = new InmovaClient({
  apiKey: 'sk_live_your_key_here',
});

// Listar propiedades
const properties = await client.properties.list({
  city: 'Madrid',
  status: 'AVAILABLE',
});

console.log(\`Found \${properties.data.length} properties\`);`}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="python" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Instalación</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>pip install inmova</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ejemplo de Uso</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`from inmova import InmovaClient

client = InmovaClient(api_key="sk_live_your_key_here")

# Listar propiedades
properties = client.properties.list(
    city="Madrid",
    status="AVAILABLE"
)

print(f"Found {len(properties.data)} properties")`}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="php" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Instalación</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>composer require inmova/sdk</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ejemplo de Uso</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`use Inmova\\InmovaClient;

$client = new InmovaClient('sk_live_your_key_here');

// Listar propiedades
$properties = $client->properties->list([
    'city' => 'Madrid',
    'status' => 'AVAILABLE',
]);

echo "Found " . count($properties['data']) . " properties";`}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">¿Por Qué Inmova API?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Desarrollo Rápido</CardTitle>
                <CardDescription>
                  SDKs oficiales, documentación completa y ejemplos de código para empezar en
                  minutos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Seguro y Confiable</CardTitle>
                <CardDescription>
                  Autenticación OAuth 2.0, rate limiting, webhooks firmados y 99.9% uptime
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Escalable</CardTitle>
                <CardDescription>
                  Arquitectura serverless, CDN global y infraestructura diseñada para crecer contigo
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Casos de Uso</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Portal de Propiedades</CardTitle>
                <CardDescription>
                  Crea un marketplace de propiedades con búsqueda avanzada, filtros y
                  geolocalización
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Listado de propiedades en tiempo real</li>
                  <li>✓ Búsqueda y filtros avanzados</li>
                  <li>✓ Integración con mapas</li>
                  <li>✓ Sistema de favoritos</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automatización de Pagos</CardTitle>
                <CardDescription>
                  Automatiza recordatorios, cobros y conciliación bancaria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Webhooks de pagos recibidos</li>
                  <li>✓ Recordatorios automáticos</li>
                  <li>✓ Integración con Stripe/QuickBooks</li>
                  <li>✓ Reportes de conciliación</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CRM Inmobiliario</CardTitle>
                <CardDescription>
                  Gestiona leads, visitas y contratos desde tu CRM favorito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Sincronización con HubSpot/Salesforce</li>
                  <li>✓ Automatización de seguimiento</li>
                  <li>✓ Pipeline de ventas</li>
                  <li>✓ Notificaciones en tiempo real</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comunicación Multicanal</CardTitle>
                <CardDescription>
                  Envía notificaciones por email, SMS, WhatsApp y push
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Templates personalizables</li>
                  <li>✓ Integración con WhatsApp Business</li>
                  <li>✓ Notificaciones push</li>
                  <li>✓ Tracking de aperturas/clics</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Recursos para Desarrolladores</h2>

          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/api-docs">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Book className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>API Docs</CardTitle>
                  <CardDescription>Referencia completa de la API</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/developers/samples">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Code2 className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Code Samples</CardTitle>
                  <CardDescription>Ejemplos listos para usar</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/developers/tutorials">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <PlayCircle className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Tutoriales</CardTitle>
                  <CardDescription>Guías paso a paso</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/developers/status">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Shield className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>API Status</CardTitle>
                  <CardDescription>Uptime y incidentes</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para Empezar?</h2>
          <p className="text-xl mb-8">Obtén tu API key y comienza a integrar en minutos</p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/dashboard/integrations/api-keys">Obtener API Key →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
