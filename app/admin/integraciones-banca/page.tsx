'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Unlink,
  Building,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface BankIntegration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected';
  features: string[];
  banks?: string[];
  configFields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    required: boolean;
  }>;
  docsUrl?: string;
}

const bankIntegrations: BankIntegration[] = [
  {
    id: 'openbanking',
    name: 'Open Banking (PSD2)',
    description: 'Conexión directa con bancos españoles vía APIs reguladas. Acceso a saldos, movimientos y pagos iniciados.',
    icon: '🏦',
    status: 'disconnected',
    features: [
      'Saldos en tiempo real',
      'Historial de movimientos',
      'Conciliación automática',
      'Iniciación de pagos (PIS)',
    ],
    banks: ['Santander', 'BBVA', 'CaixaBank', 'Sabadell', 'Bankinter', 'ING', 'Openbank'],
    configFields: [
      { name: 'OB_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: 'Tu Client ID', required: true },
      { name: 'OB_CLIENT_SECRET', label: 'Client Secret', type: 'password', placeholder: 'Tu Client Secret', required: true },
      { name: 'OB_CERTIFICATE', label: 'Certificado eIDAS', type: 'password', placeholder: 'Certificado PEM', required: true },
    ],
    docsUrl: 'https://www.berlin-group.org/',
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Agregador bancario internacional. Conecta cuentas de más de 11.000 instituciones financieras.',
    icon: '🌐',
    status: 'disconnected',
    features: [
      'Multi-banco internacional',
      'Verificación de cuentas',
      'Historial financiero',
      'Categorización automática',
    ],
    banks: ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One', '+11.000 más'],
    configFields: [
      { name: 'PLAID_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: 'Tu Client ID de Plaid', required: true },
      { name: 'PLAID_SECRET', label: 'Secret', type: 'password', placeholder: 'Tu Secret de Plaid', required: true },
      { name: 'PLAID_ENV', label: 'Entorno', type: 'text', placeholder: 'sandbox, development, production', required: true },
    ],
    docsUrl: 'https://plaid.com/docs/',
  },
];

export default function IntegracionesBancaPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [selectedIntegration, setSelectedIntegration] = useState<BankIntegration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [connectedBanks, setConnectedBanks] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSaveConfig = async () => {
    toast.success('Configuración guardada. Ahora puedes conectar tus cuentas bancarias.');
    setSelectedIntegration(null);
    setConfigValues({});
  };

  const handleConnectBank = () => {
    toast.info('Iniciando conexión bancaria...');
    // Aquí iría la lógica de OAuth para conectar con el banco
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Integraciones Bancarias</h1>
          <p className="text-muted-foreground mt-2">
            Conecta tus cuentas bancarias para automatizar la conciliación de pagos y cobros
          </p>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Conexión segura:</strong> Usamos protocolos bancarios regulados (PSD2/Open Banking). 
            Nunca almacenamos tus credenciales bancarias. La conexión se realiza directamente con tu banco.
          </AlertDescription>
        </Alert>

        {selectedIntegration ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{selectedIntegration.icon}</span>
                  <div>
                    <CardTitle>{selectedIntegration.name}</CardTitle>
                    <CardDescription>{selectedIntegration.description}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                  Volver
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bancos soportados */}
              {selectedIntegration.banks && (
                <div>
                  <Label className="text-base font-semibold">Bancos soportados</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedIntegration.banks.map((bank) => (
                      <Badge key={bank} variant="outline">{bank}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Configuración API */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Configuración API</Label>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Necesitas registrarte como TPP (Third Party Provider) para obtener las credenciales.
                    {selectedIntegration.docsUrl && (
                      <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline">
                        Ver documentación
                      </a>
                    )}
                  </AlertDescription>
                </Alert>
                
                {selectedIntegration.configFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={configValues[field.name] || ''}
                      onChange={(e) => setConfigValues(prev => ({
                        ...prev,
                        [field.name]: e.target.value
                      }))}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig}>
                  Guardar configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Cards de integraciones */}
            <div className="grid md:grid-cols-2 gap-6">
              {bankIntegrations.map((integration) => (
                <Card key={integration.id} className={integration.status === 'connected' ? 'border-green-200' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{integration.icon}</span>
                        <div>
                          <CardTitle>{integration.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      {integration.status === 'connected' ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Conectado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No configurado</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2">
                      {integration.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bancos preview */}
                    {integration.banks && (
                      <div className="flex flex-wrap gap-1">
                        {integration.banks.slice(0, 5).map((bank) => (
                          <Badge key={bank} variant="outline" className="text-xs">{bank}</Badge>
                        ))}
                        {integration.banks.length > 5 && (
                          <Badge variant="outline" className="text-xs">+{integration.banks.length - 5} más</Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1"
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                        onClick={() => setSelectedIntegration(integration)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                      {integration.status === 'connected' && (
                        <Button variant="outline" onClick={handleConnectBank}>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Añadir cuenta
                        </Button>
                      )}
                      {integration.docsUrl && (
                        <Button
                          variant="ghost"
                          onClick={() => window.open(integration.docsUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cuentas conectadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Cuentas Bancarias Conectadas
                </CardTitle>
                <CardDescription>
                  Cuentas sincronizadas para conciliación automática
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectedBanks.length > 0 ? (
                  <div className="space-y-4">
                    {/* Aquí irían las cuentas conectadas */}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay cuentas bancarias conectadas</p>
                    <p className="text-sm">Configura una integración para empezar</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Beneficios */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
              <CardContent className="py-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">Conciliación automática</h3>
                    <p className="text-sm text-muted-foreground">
                      Identifica pagos de inquilinos automáticamente
                    </p>
                  </div>
                  <div>
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">Sync en tiempo real</h3>
                    <p className="text-sm text-muted-foreground">
                      Saldos y movimientos actualizados al instante
                    </p>
                  </div>
                  <div>
                    <Lock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">100% seguro</h3>
                    <p className="text-sm text-muted-foreground">
                      Regulado por PSD2 y normativa bancaria
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
