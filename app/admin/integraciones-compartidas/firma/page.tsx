'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Settings,
  RefreshCw,
  ExternalLink,
  FileSignature,
  Shield,
  FileText,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function FirmaCompartidaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    if (status === 'authenticated' && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const signatureProviders = [
    {
      id: 'docusign',
      name: 'DocuSign',
      description: 'Firma electrónica avanzada internacional',
      icon: FileSignature,
      color: 'from-yellow-500 to-amber-600',
      status: 'connected',
      compliance: ['eIDAS', 'ESIGN', 'UETA'],
      stats: {
        envelopes: 567,
        signed: 523,
        pending: 44,
        rate: '92%'
      }
    },
    {
      id: 'signaturit',
      name: 'Signaturit',
      description: 'Firma electrónica cualificada España/UE',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      status: 'connected',
      compliance: ['eIDAS QES', 'LOPD'],
      stats: {
        envelopes: 234,
        signed: 210,
        pending: 24,
        rate: '90%'
      }
    },
  ];

  const handleTestConnection = (providerId: string) => {
    const label = providerId === 'docusign' ? 'DocuSign' : 'Signaturit';
    toast.success(`Conexión con ${label} verificada`);
  };

  const handleOpenDashboard = (providerId: string) => {
    const urls: Record<string, string> = {
      docusign: 'https://app.docusign.com/',
      signaturit: 'https://app.signaturit.com/',
    };
    const url = urls[providerId] || 'https://www.signaturit.com/';
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-compartidas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Compartidas
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <FileSignature className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Firma Digital</h1>
            <p className="text-muted-foreground">DocuSign y Signaturit - Configuración centralizada de Inmova</p>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ℹ️ Nota:</strong> La firma digital es configurada por Inmova. Las empresas clientes 
            pueden enviar documentos a firmar a sus inquilinos/propietarios usando las credenciales 
            de Inmova, lo que simplifica la gestión y reduce costos para ellos.
          </p>
        </CardContent>
      </Card>

      {/* Resumen Global */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumen de Firmas (Plataforma)</CardTitle>
          <CardDescription>Totales agregados de todos los proveedores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Documentos Enviados</p>
              <p className="text-2xl font-bold">801</p>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Firmados</p>
              <p className="text-2xl font-bold text-green-600">733</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-500">68</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Tasa de Completado</p>
              <p className="text-2xl font-bold">91.5%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proveedores */}
      <Tabs defaultValue="docusign" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="docusign">DocuSign</TabsTrigger>
          <TabsTrigger value="signaturit">Signaturit</TabsTrigger>
        </TabsList>

        {signatureProviders.map((provider) => (
          <TabsContent key={provider.id} value={provider.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center`}>
                      <provider.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.compliance.map((cert) => (
                      <Badge key={cert} variant="outline" className="text-xs">{cert}</Badge>
                    ))}
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Activo
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Enviados</p>
                    <p className="text-2xl font-bold">{provider.stats.envelopes}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Firmados</p>
                    <p className="text-2xl font-bold text-green-600">{provider.stats.signed}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-500">{provider.stats.pending}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Tasa Completado</p>
                    <p className="text-2xl font-bold">{provider.stats.rate}</p>
                  </div>
                </div>

                {/* Configuración */}
                <div className="space-y-4">
                  {provider.id === 'docusign' && (
                    <>
                      <div className="space-y-2">
                        <Label>Integration Key</Label>
                        <Input type="password" defaultValue="xxxx-xxxx-xxxx-xxxx" />
                      </div>
                      <div className="space-y-2">
                        <Label>Account ID</Label>
                        <Input defaultValue="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                      </div>
                      <div className="space-y-2">
                        <Label>RSA Private Key</Label>
                        <Input type="password" defaultValue="••••••••••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Base Path</Label>
                        <Input defaultValue="https://eu.docusign.net" readOnly />
                      </div>
                    </>
                  )}
                  {provider.id === 'signaturit' && (
                    <>
                      <div className="space-y-2">
                        <Label>API Token</Label>
                        <Input type="password" defaultValue="••••••••••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Environment</Label>
                        <Input defaultValue="production" readOnly />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Proveedor Principal</p>
                      <p className="text-sm text-muted-foreground">Usar como primera opción para firmas</p>
                    </div>
                    <Switch defaultChecked={provider.id === 'docusign'} />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleTestConnection(provider.id)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Probar Conexión
                    </Button>
                    <Button variant="outline" onClick={() => handleOpenDashboard(provider.id)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Tipos de documentos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Plantillas de Documentos
          </CardTitle>
          <CardDescription>Documentos disponibles para firma digital</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Contrato de Arrendamiento', provider: 'DocuSign', uses: 234 },
              { name: 'Anexo de Inventario', provider: 'DocuSign', uses: 189 },
              { name: 'Fianza y Depósito', provider: 'Signaturit', uses: 156 },
              { name: 'Acta de Entrega de Llaves', provider: 'Signaturit', uses: 123 },
              { name: 'Rescisión de Contrato', provider: 'DocuSign', uses: 45 },
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.provider}</p>
                  </div>
                </div>
                <Badge variant="outline">{doc.uses} usos</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empresas que usan firma */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Empresas con Firma Digital Activa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Inmobiliaria García', documents: 156, pending: 12 },
              { name: 'Gestiones López', documents: 89, pending: 5 },
              { name: 'Alquileres Madrid', documents: 67, pending: 8 },
            ].map((company, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {company.documents} documentos firmados
                  </p>
                </div>
                <Badge variant={company.pending > 10 ? "destructive" : "outline"}>
                  {company.pending} pendientes
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
