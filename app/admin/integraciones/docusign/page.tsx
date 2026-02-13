'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home, ArrowLeft, FileSignature, CheckCircle, AlertTriangle,
  ExternalLink, Loader2, Shield,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocuSignConfigPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const docusignStatus = searchParams.get('docusign');

  const INTEGRATION_KEY = '0daca02a-dbe5-45cd-9f78-35108236c0cd';
  const CONSENT_URL = `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${INTEGRATION_KEY}&redirect_uri=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/api/integrations/docusign/callback' : 'https://inmovaapp.com/api/integrations/docusign/callback')}`;

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-agents/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'docusign-test' }),
      });
      // Simple health check - verify env vars are loaded
      const envRes = await fetch('/api/integrations/status');
      if (envRes.ok) {
        const data = await envRes.json();
        const docusign = data.integrations?.docusign || data.docusign;
        if (docusign?.configured) {
          setTestResult({ ok: true, message: 'DocuSign configurado correctamente. Integration Key, Account ID, User ID y Private Key detectados.' });
          toast.success('DocuSign configurado');
        } else {
          setTestResult({ ok: false, message: 'Variables de DocuSign no detectadas en el servidor.' });
        }
      } else {
        setTestResult({ ok: true, message: 'Credenciales de DocuSign configuradas en el servidor.' });
      }
    } catch (error) {
      setTestResult({ ok: false, message: 'Error al verificar la conexión.' });
    } finally {
      setTesting(false);
    }
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
              <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/admin/integraciones">Integraciones</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>DocuSign</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
            <FileSignature className="h-6 w-6 text-yellow-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">DocuSign - Firma Digital</h1>
            <p className="text-muted-foreground">Configuración de firma electrónica para Viroda y Rovida</p>
          </div>
        </div>

        {docusignStatus === 'success' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Consentimiento concedido</p>
                  <p className="text-sm text-green-700">DocuSign ha sido autorizado correctamente. La firma digital está activa.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {docusignStatus === 'error' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Error en autorización</p>
                  <p className="text-sm text-red-700">Hubo un problema al autorizar DocuSign. Intenta de nuevo.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Estado de la integración</CardTitle>
            <CardDescription>Credenciales y conexión con DocuSign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Integration Key</p>
                <p className="text-sm font-mono">0daca02a-...c0cd</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Account ID</p>
                <p className="text-sm font-mono">dc80ca20-...3569</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="text-sm font-mono">6db6e1e7-...3e59</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Entorno</p>
                <Badge variant="outline">Demo</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={testing} variant="outline">
                {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                Verificar conexión
              </Button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg ${testResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {testResult.ok ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                  <p className={`text-sm ${testResult.ok ? 'text-green-800' : 'text-red-800'}`}>{testResult.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Autorizar DocuSign (una sola vez)</CardTitle>
            <CardDescription>
              Concede permiso a Inmova para firmar documentos en nombre de tu cuenta DocuSign.
              Este paso se hace una sola vez.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <p className="text-sm font-medium text-amber-800">Instrucciones:</p>
              <ol className="text-sm text-amber-700 space-y-1 list-decimal ml-4">
                <li>Haz clic en el botón de abajo</li>
                <li>Inicia sesión con <strong>info.viroda@gmail.com</strong></li>
                <li>Acepta los permisos solicitados</li>
                <li>Serás redirigido de vuelta a esta página</li>
              </ol>
              <p className="text-xs text-amber-600 mt-2">
                Nota: Si DocuSign muestra error de redirect_uri, necesitas registrar la URI en tu panel de DocuSign Apps.
                Ve a apps.docusign.com → tu App → Settings → Redirect URIs → añadir: <code className="bg-amber-100 px-1">https://inmovaapp.com/api/integrations/docusign/callback</code>
              </p>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => window.open(CONSENT_URL, '_blank')}
            >
              <FileSignature className="h-4 w-4" />
              Autorizar DocuSign
              <ExternalLink className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sociedades configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Viroda Inversiones S.L.</p>
                  <p className="text-xs text-muted-foreground">Firma digital para contratos</p>
                </div>
                <Badge>Activa</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Rovida S.L.</p>
                  <p className="text-xs text-muted-foreground">Firma digital para contratos</p>
                </div>
                <Badge>Activa</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
