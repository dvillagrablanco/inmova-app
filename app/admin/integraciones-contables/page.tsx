'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  X,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger, { logError } from '@/lib/logger';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  logo?: string;
  configFields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password' | 'url';
    required: boolean;
    placeholder?: string;
  }>;
  features: string[];
  documentation: string;
}

const integrations: Integration[] = [
  {
    id: 'sage',
    name: 'Sage 50cloud / Sage 200cloud',
    description:
      'Sistema ERP y contable líder en UK y Europa. Gestión completa de clientes, facturas y pagos.',
    status: 'disconnected',
    configFields: [
      {
        name: 'SAGE_CLIENT_ID',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Tu Client ID de Sage',
      },
      {
        name: 'SAGE_CLIENT_SECRET',
        label: 'Client Secret',
        type: 'password',
        required: true,
        placeholder: 'Tu Client Secret de Sage',
      },
      {
        name: 'SAGE_API_URL',
        label: 'API URL',
        type: 'url',
        required: false,
        placeholder: 'https://api.accounting.sage.com/v3.1',
      },
      {
        name: 'SAGE_DEFAULT_TAX_RATE_ID',
        label: 'Tax Rate ID por defecto',
        type: 'text',
        required: false,
        placeholder: 'ID de la tasa de impuesto',
      },
      {
        name: 'SAGE_DEFAULT_BANK_ACCOUNT_ID',
        label: 'Bank Account ID por defecto',
        type: 'text',
        required: false,
        placeholder: 'ID de la cuenta bancaria',
      },
    ],
    features: [
      'Sincronización de clientes',
      'Emisión de facturas',
      'Registro de pagos',
      'Contabilidad completa',
    ],
    documentation: 'https://developer.sage.com/api/',
  },
  {
    id: 'holded',
    name: 'Holded',
    description:
      'Sistema de gestión empresarial todo-en-uno (ERP, CRM, Contabilidad). Popular en España y Latinoamérica.',
    status: 'disconnected',
    configFields: [
      {
        name: 'HOLDED_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de Holded',
      },
    ],
    features: [
      'Gestión de contactos',
      'Facturación completa',
      'Registro de pagos',
      'Control de gastos',
    ],
    documentation: 'https://developers.holded.com/reference',
  },
  {
    id: 'a3',
    name: 'A3 Software (Wolters Kluwer)',
    description:
      'Sistema ERP y de gestión empresarial líder en España. Contabilidad analítica completa.',
    status: 'disconnected',
    configFields: [
      {
        name: 'A3_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de A3',
      },
      {
        name: 'A3_USERNAME',
        label: 'Usuario',
        type: 'text',
        required: true,
        placeholder: 'Tu usuario de A3',
      },
      {
        name: 'A3_PASSWORD',
        label: 'Contraseña',
        type: 'password',
        required: true,
        placeholder: 'Tu contraseña de A3',
      },
      {
        name: 'A3_COMPANY_ID',
        label: 'Company ID',
        type: 'text',
        required: true,
        placeholder: 'ID de tu empresa en A3',
      },
      {
        name: 'A3_API_URL',
        label: 'API URL',
        type: 'url',
        required: false,
        placeholder: 'https://api.a3software.com/v1',
      },
    ],
    features: [
      'Gestión de clientes',
      'Facturación por series',
      'Registro de cobros',
      'Contabilidad analítica',
    ],
    documentation: 'https://www.wolterskluwer.com/es-es/solutions/a3software',
  },
  {
    id: 'alegra',
    name: 'Alegra',
    description:
      'Software de contabilidad y facturación en la nube. Líder en Colombia y Latinoamérica.',
    status: 'disconnected',
    configFields: [
      {
        name: 'ALEGRA_USERNAME',
        label: 'Email / Username',
        type: 'text',
        required: true,
        placeholder: 'Tu email de Alegra',
      },
      {
        name: 'ALEGRA_API_TOKEN',
        label: 'API Token',
        type: 'password',
        required: true,
        placeholder: 'Tu API Token de Alegra',
      },
    ],
    features: [
      'Facturación electrónica',
      'Gestión de contactos',
      'Registro de pagos',
      'Control de compras y gastos',
    ],
    documentation: 'https://developer.alegra.com/docs/',
  },
  {
    id: 'zucchetti',
    name: 'Zucchetti',
    description:
      'Sistema de gestión empresarial italiano. Ideal para gestión de nóminas y recursos humanos.',
    status: 'disconnected',
    configFields: [
      {
        name: 'ZUCCHETTI_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de Zucchetti',
      },
      {
        name: 'ZUCCHETTI_COMPANY_ID',
        label: 'Company ID',
        type: 'text',
        required: true,
        placeholder: 'ID de tu empresa',
      },
      {
        name: 'ZUCCHETTI_API_URL',
        label: 'API URL',
        type: 'url',
        required: false,
        placeholder: 'https://api.zucchetti.it/v1',
      },
    ],
    features: [
      'Sincronización de empleados',
      'Gestión de nóminas',
      'Control de gastos',
      'Facturación',
    ],
    documentation: 'https://developer.zucchetti.com/',
  },
  {
    id: 'contasimple',
    name: 'ContaSimple',
    description: 'Contabilidad en la nube para autónomos y pymes en España. Fácil e intuitivo.',
    status: 'disconnected',
    configFields: [
      {
        name: 'CONTASIMPLE_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de ContaSimple',
      },
      {
        name: 'CONTASIMPLE_COMPANY_ID',
        label: 'Company ID',
        type: 'text',
        required: true,
        placeholder: 'ID de tu empresa',
      },
    ],
    features: [
      'Facturación simplificada',
      'Gestión de gastos',
      'Declaración de impuestos',
      'Sincronización bancaria',
    ],
    documentation: 'https://api.contasimple.com/docs',
  },
];

export default function IntegracionesContablesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, any>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchIntegrationStatus();
    }
  }, [status, router]);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounting/status');
      if (response.ok) {
        const data = await response.json();
        setIntegrationStatus(data);
      }
    } catch (error) {
      logger.error('Error fetching integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      setTestingConnection(integrationId);
      const response = await fetch(`/api/accounting/${integrationId}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Conexión exitosa');
        await fetchIntegrationStatus();
      } else {
        toast.error(data.message || 'Error al conectar');
      }
    } catch (error) {
      logger.error('Error testing connection:', error);
      toast.error('Error al probar la conexión');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSaveConfig = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/accounting/${integrationId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configValues),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        setSelectedIntegration(null);
        setConfigValues({});
        await fetchIntegrationStatus();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error al guardar configuración');
      }
    } catch (error) {
      logger.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('¿Estás seguro de que quieres desconectar esta integración?')) {
      return;
    }

    try {
      const response = await fetch(`/api/accounting/${integrationId}/disconnect`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Integración desconectada');
        await fetchIntegrationStatus();
      } else {
        toast.error('Error al desconectar');
      }
    } catch (error) {
      logger.error('Error disconnecting:', error);
      toast.error('Error al desconectar');
    }
  };

  const getIntegrationStatus = (integrationId: string): 'connected' | 'disconnected' => {
    return integrationStatus[integrationId]?.connected ? 'connected' : 'disconnected';
  };

  const getStatusBadge = (integrationId: string) => {
    const status = getIntegrationStatus(integrationId);

    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Conectado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Unlink className="w-3 h-3 mr-1" /> Desconectado
          </Badge>
        );
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Skeleton className="h-10 w-96" />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Integraciones Contables</h1>
              <p className="text-muted-foreground mt-2">
                Conecta INMOVA con tu software contable para sincronizar automáticamente facturas,
                pagos y gastos.
              </p>
            </div>

            {selectedIntegration ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedIntegration.name}</CardTitle>
                      <CardDescription>{selectedIntegration.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedIntegration(null);
                        setConfigValues({});
                      }}
                    >
                      Volver
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Las credenciales se almacenan de forma segura. Nunca compartimos tu
                      información con terceros.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {selectedIntegration.configFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={configValues[field.name] || ''}
                          onChange={(e) =>
                            setConfigValues((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                          required={field.required}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <a
                      href={selectedIntegration.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver documentación
                    </a>
                    <Button onClick={() => handleSaveConfig(selectedIntegration.id)}>
                      Guardar configuración
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => {
                  const isConnected = getIntegrationStatus(integration.id) === 'connected';

                  return (
                    <Card key={integration.id} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {integration.description}
                            </CardDescription>
                          </div>
                          {getStatusBadge(integration.id)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Funcionalidades:</h4>
                          <ul className="text-sm space-y-1">
                            {integration.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex gap-2">
                          {isConnected ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleTestConnection(integration.id)}
                                disabled={testingConnection === integration.id}
                              >
                                {testingConnection === integration.id ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Probando...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" /> Probar
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDisconnect(integration.id)}
                              >
                                <Unlink className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => setSelectedIntegration(integration)}
                            >
                              <LinkIcon className="w-4 h-4 mr-2" />
                              Conectar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(integration.documentation, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Guía de Integración</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3>Cómo configurar las integraciones:</h3>
                <ol>
                  <li>Haz clic en "Conectar" en la integración que desees activar</li>
                  <li>Completa los campos requeridos con las credenciales de tu cuenta</li>
                  <li>Haz clic en "Guardar configuración"</li>
                  <li>
                    Usa el botón "Probar" para verificar que la conexión funciona correctamente
                  </li>
                </ol>

                <h3>Funcionalidades automáticas:</h3>
                <p>Una vez conectado, INMOVA sincronizará automáticamente:</p>
                <ul>
                  <li>
                    <strong>Inquilinos como clientes:</strong> Cada inquilino se creará
                    automáticamente como cliente en tu sistema contable
                  </li>
                  <li>
                    <strong>Facturas de alquiler:</strong> Las rentas mensuales generarán facturas
                    automáticamente
                  </li>
                  <li>
                    <strong>Pagos recibidos:</strong> Los pagos de inquilinos se registrarán como
                    cobros
                  </li>
                  <li>
                    <strong>Gastos y proveedores:</strong> Los gastos de mantenimiento se
                    sincronizarán como compras
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
