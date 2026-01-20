'use client';

/**
 * Partners - Integraciones
 * 
 * Herramientas y APIs para integración de partners
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code,
  Key,
  Copy,
  RefreshCw,
  ExternalLink,
  Webhook,
  BookOpen,
  TestTube2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

const API_ENDPOINTS = [
  { method: 'POST', path: '/api/partners/public/leads/create', description: 'Crear nuevo lead' },
  { method: 'GET', path: '/api/partners/dashboard', description: 'Obtener datos del dashboard' },
  { method: 'GET', path: '/api/partners/commissions', description: 'Listar comisiones' },
  { method: 'GET', path: '/api/partners/{id}/clients', description: 'Listar clientes referidos' },
  { method: 'GET', path: '/api/partners/{id}/stats', description: 'Obtener estadísticas' },
];

const WEBHOOKS = [
  { event: 'lead.created', description: 'Cuando se crea un nuevo lead' },
  { event: 'lead.converted', description: 'Cuando un lead se convierte en cliente' },
  { event: 'commission.paid', description: 'Cuando se paga una comisión' },
  { event: 'client.subscription.changed', description: 'Cambio en suscripción de cliente' },
];

export default function PartnersIntegracionesPage() {
  const [apiKey] = useState('pk_partner_live_xxxxxxxxxxxxxxxxxxxxx');
  const [secretKey] = useState('sk_partner_live_xxxxxxxxxxxxxxxxxxxxx');
  const [showSecret, setShowSecret] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Introduce una URL de webhook');
      return;
    }

    setTestingEndpoint(true);
    try {
      // Simular test de webhook
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Webhook enviado correctamente');
    } catch (error) {
      toast.error('Error al enviar webhook de prueba');
    } finally {
      setTestingEndpoint(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Integraciones</h1>
        <p className="text-muted-foreground">
          Herramientas y APIs para integrar Inmova con tus sistemas
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="endpoints">
            <Code className="h-4 w-4 mr-2" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="docs">
            <BookOpen className="h-4 w-4 mr-2" />
            Documentación
          </TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Tus Claves de API
              </CardTitle>
              <CardDescription>
                Usa estas claves para autenticar tus llamadas a la API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Public Key */}
              <div className="space-y-2">
                <Label>API Key (Pública)</Label>
                <div className="flex gap-2">
                  <Input value={apiKey} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKey, 'API Key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usa esta clave en peticiones públicas (creación de leads)
                </p>
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <Label>Secret Key (Privada)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showSecret ? 'text' : 'password'}
                      value={secretKey}
                      readOnly
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(secretKey, 'Secret Key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Nunca compartas esta clave. Úsala solo en el servidor.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="outline" disabled>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar Claves
                </Button>
                <p className="text-sm text-muted-foreground">
                  Regenerar las claves invalidará las anteriores
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de la Integración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">API Activa</p>
                    <p className="text-sm text-muted-foreground">Todas las peticiones funcionando</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">Webhooks Activos</p>
                    <p className="text-sm text-muted-foreground">Notificaciones en tiempo real</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sandbox</p>
                    <p className="text-sm text-muted-foreground">Usar para pruebas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endpoints */}
        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints Disponibles</CardTitle>
              <CardDescription>
                Base URL: <code className="bg-muted px-2 py-0.5 rounded">https://api.inmovaapp.com/v1</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {API_ENDPOINTS.map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                        className="font-mono"
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm">{endpoint.path}</code>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Code Example */}
          <Card>
            <CardHeader>
              <CardTitle>Ejemplo de Uso</CardTitle>
              <CardDescription>
                Crea un nuevo lead desde tu aplicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`// JavaScript/Node.js
const response = await fetch('https://api.inmovaapp.com/v1/partners/public/leads/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Partner-Key': '${apiKey}'
  },
  body: JSON.stringify({
    nombre: 'Juan García',
    email: 'juan@example.com',
    telefono: '+34612345678',
    mensaje: 'Interesado en gestión de propiedades'
  })
});

const data = await response.json();
console.log('Lead creado:', data.id);`}
              </pre>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => copyToClipboard(`curl -X POST https://api.inmovaapp.com/v1/partners/public/leads/create \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Key: ${apiKey}" \\
  -d '{"nombre":"Juan García","email":"juan@example.com"}'`, 'Ejemplo')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar cURL
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Configurar Webhook
              </CardTitle>
              <CardDescription>
                Recibe notificaciones en tiempo real cuando ocurran eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL del Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://tu-servidor.com/webhooks/inmova"
                  />
                  <Button onClick={handleTestWebhook} disabled={testingEndpoint}>
                    <TestTube2 className="h-4 w-4 mr-2" />
                    {testingEndpoint ? 'Enviando...' : 'Probar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos Disponibles</CardTitle>
              <CardDescription>
                Selecciona los eventos para los que quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {WEBHOOKS.map((webhook, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {webhook.event}
                      </code>
                      <span className="text-sm text-muted-foreground">
                        {webhook.description}
                      </span>
                    </div>
                    <Badge variant="outline">Activo</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation */}
        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Documentación de la API
              </CardTitle>
              <CardDescription>
                Guías y referencias para integrar con Inmova
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <a
                  href="/api-docs"
                  target="_blank"
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Code className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">API Reference</h3>
                    <p className="text-sm text-muted-foreground">
                      Documentación completa de todos los endpoints
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </a>

                <a
                  href="/docs/partners/getting-started"
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Guía de Inicio</h3>
                    <p className="text-sm text-muted-foreground">
                      Tutorial paso a paso para comenzar
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </a>

                <a
                  href="/docs/partners/webhooks"
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Webhook className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Webhooks</h3>
                    <p className="text-sm text-muted-foreground">
                      Configuración de notificaciones
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </a>

                <a
                  href="/docs/partners/sandbox"
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <TestTube2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sandbox</h3>
                    <p className="text-sm text-muted-foreground">
                      Entorno de pruebas sin afectar producción
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
