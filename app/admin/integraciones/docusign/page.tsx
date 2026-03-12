'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  FileSignature,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Shield,
  XCircle,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DocuSignStatus {
  configured: boolean;
  status: string;
  environment: string;
  hasIntegrationKey?: boolean;
  hasUserId?: boolean;
  hasAccountId?: boolean;
  hasPrivateKey?: boolean;
}

export default function DocuSignConfigPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [testing, setTesting] = useState(false);
  const [docusignStatus, setDocusignStatus] = useState<DocuSignStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const callbackStatus = searchParams?.get('docusign');

  // Producción: account.docusign.com (no account-d)
  const CONSENT_BASE =
    docusignStatus?.environment === 'demo'
      ? 'https://account-d.docusign.com'
      : 'https://account.docusign.com';

  const REDIRECT_URI =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/integrations/docusign/callback`
      : 'https://inmovaapp.com/api/integrations/docusign/callback';

  // Cargar estado real desde API
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch('/api/admin/integraciones/status');
        if (res.ok) {
          const data = await res.json();
          const ds = data.firma?.docusign || data.integrations?.firma?.docusign;
          if (ds) {
            setDocusignStatus(ds);
          }
        }
      } catch (err) {
        console.error('Error loading DocuSign status:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStatus();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/integraciones/docusign/test');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success(
            `DocuSign conectado (${data.environment}). Cuenta: ${data.accountName || data.accountId}`
          );
        } else if (data.error === 'consent_required') {
          toast.error('Falta conceder consentimiento. Haz click en "Autorizar DocuSign".');
        } else {
          toast.error(`Error: ${data.error}`);
        }
      } else {
        const statusRes = await fetch('/api/admin/integraciones/status');
        if (statusRes.ok) {
          const data = await statusRes.json();
          const ds = data.firma?.docusign || data.integrations?.firma?.docusign;
          setDocusignStatus(ds);
          toast.error('DocuSign no está completamente configurado');
        }
      }
    } catch {
      toast.error('Error verificando conexión');
    } finally {
      setTesting(false);
    }
  };

  const openConsent = () => {
    if (!docusignStatus?.hasIntegrationKey) {
      toast.error('Integration Key no configurada en el servidor');
      return;
    }
    // We don't expose the integration key in the client. Build consent URL server-side or use a known one.
    // For now, redirect to a server endpoint that builds the consent URL
    window.open(`/api/integrations/docusign/consent`, '_blank');
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/integraciones')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/integraciones">Integraciones</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>DocuSign</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
            <FileSignature className="h-6 w-6 text-yellow-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">DocuSign — Grupo Vidaro</h1>
            <p className="text-muted-foreground">
              Firma digital de contratos para todas las sociedades del grupo
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              App ID: cf89d1eb-8df4-4714-a3a5-15bb98ca873f
            </p>
          </div>
          {!loading && (
            <Badge variant={docusignStatus?.configured ? 'default' : 'outline'} className="ml-auto">
              {docusignStatus?.configured
                ? docusignStatus.environment === 'demo'
                  ? '🟡 Demo (sandbox)'
                  : '✅ Producción'
                : '⚠️ No configurado'}
            </Badge>
          )}
        </div>

        {/* Callback status messages */}
        {callbackStatus === 'success' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Consentimiento concedido</p>
                  <p className="text-sm text-green-700">
                    DocuSign ha sido autorizado correctamente. La firma digital está activa.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {callbackStatus === 'error' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Error en autorización</p>
                  <p className="text-sm text-red-700">
                    Hubo un problema al autorizar DocuSign. Intenta de nuevo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado de configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de la integración</CardTitle>
            <CardDescription>Credenciales y conexión con DocuSign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando estado...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Integration Key</p>
                    <div className="flex items-center gap-2 mt-1">
                      {docusignStatus?.hasIntegrationKey ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <p className="text-sm font-mono">
                        {docusignStatus?.hasIntegrationKey ? 'Configurada' : 'No configurada'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Account ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      {docusignStatus?.hasAccountId ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <p className="text-sm font-mono">
                        {docusignStatus?.hasAccountId ? 'Configurado' : 'No configurado'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      {docusignStatus?.hasUserId ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <p className="text-sm font-mono">
                        {docusignStatus?.hasUserId ? 'Configurado' : 'No configurado'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Private Key RSA</p>
                    <div className="flex items-center gap-2 mt-1">
                      {docusignStatus?.hasPrivateKey ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <p className="text-sm font-mono">
                        {docusignStatus?.hasPrivateKey ? 'Configurada' : 'No configurada'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Entorno:</p>
                  <Badge
                    variant={docusignStatus?.environment === 'production' ? 'default' : 'secondary'}
                  >
                    {docusignStatus?.environment === 'production' ? '🟢 Producción' : '🟡 Demo'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button onClick={testConnection} disabled={testing} variant="outline">
                    {testing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    Verificar conexión
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Consent grant */}
        <Card>
          <CardHeader>
            <CardTitle>Autorización JWT (una sola vez)</CardTitle>
            <CardDescription>
              Concede permiso a Inmova para firmar documentos en nombre de la cuenta DocuSign del
              Grupo Vidaro. Este paso se hace una sola vez por cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <p className="text-sm font-medium text-amber-800">Instrucciones:</p>
              <ol className="text-sm text-amber-700 space-y-1 list-decimal ml-4">
                <li>Haz clic en el botón de abajo</li>
                <li>
                  Inicia sesión con la <strong>cuenta DocuSign de Vidaro</strong>
                </li>
                <li>Acepta los permisos solicitados</li>
                <li>Serás redirigido de vuelta a esta página</li>
              </ol>
            </div>

            <Button
              className="w-full gap-2"
              onClick={openConsent}
              disabled={!docusignStatus?.hasIntegrationKey}
            >
              <FileSignature className="h-4 w-4" />
              Autorizar DocuSign
              <ExternalLink className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Sociedades del grupo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Sociedades del Grupo Vidaro
            </CardTitle>
            <CardDescription>
              Todas las sociedades del grupo usan la misma cuenta DocuSign para firma digital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Viroda Inversiones S.L.</p>
                  <p className="text-xs text-muted-foreground">
                    Firma de contratos de arrendamiento y media estancia
                  </p>
                </div>
                <Badge variant={docusignStatus?.configured ? 'default' : 'outline'}>
                  {docusignStatus?.configured ? 'Activa' : 'Pendiente'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Rovida S.L.</p>
                  <p className="text-xs text-muted-foreground">
                    Firma de contratos de arrendamiento y media estancia
                  </p>
                </div>
                <Badge variant={docusignStatus?.configured ? 'default' : 'outline'}>
                  {docusignStatus?.configured ? 'Activa' : 'Pendiente'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operadores de media estancia */}
        <Card>
          <CardHeader>
            <CardTitle>Operadores de media estancia</CardTitle>
            <CardDescription>
              Contratos recibidos de operadores como Álamo se firman a través de la misma cuenta
              DocuSign del grupo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 space-y-2">
              <p>
                <strong>Flujo de firma con operadores:</strong>
              </p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>El operador (ej: Álamo) envía el contrato a firmar</li>
                <li>Se sube el PDF del contrato al sistema</li>
                <li>Se envía a DocuSign con los firmantes correspondientes</li>
                <li>Los firmantes reciben email de DocuSign para firmar</li>
                <li>El estado se actualiza automáticamente via webhook</li>
              </ol>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Álamo</p>
                  <p className="text-xs text-muted-foreground">Operador de media estancia</p>
                </div>
                <Badge variant="secondary">Integrado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup rápido */}
        {!loading && !docusignStatus?.configured && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-blue-800">Setup rápido</CardTitle>
              <CardDescription className="text-blue-700">
                Ejecuta este comando en el servidor para configurar DocuSign automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-white/80 rounded-lg border border-blue-200">
                <code className="text-sm font-mono text-blue-900 break-all">
                  node scripts/setup-docusign.mjs
                </code>
              </div>
              <p className="text-xs text-blue-600 mt-3">
                El script genera las RSA keys, te guía para subir la public key a DocuSign, y
                configura las variables de entorno automáticamente.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Webhook config */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook de notificaciones</CardTitle>
            <CardDescription>
              Configurar en DocuSign Admin → Connect para recibir actualizaciones automáticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">URL del Webhook:</p>
              <code className="text-sm font-mono break-all">
                https://inmovaapp.com/api/webhooks/docusign
              </code>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Eventos recomendados: Envelope Completed, Envelope Declined, Envelope Voided
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
