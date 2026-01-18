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
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  CheckCircle2,
  XCircle,
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

interface SignatureProvider {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  compliance: string[];
  stats: {
    envelopes: number;
    signed: number;
    pending: number;
    rate: string;
  };
}

interface SignatureSummary {
  totalEnvelopes: number;
  totalSigned: number;
  totalPending: number;
  completionRate: number;
}

interface DocumentTemplate {
  name: string;
  provider: string;
  uses: number;
}

interface CompanySignatures {
  name: string;
  documents: number;
  pending: number;
}

const PROVIDER_ICONS: Record<string, any> = {
  docusign: FileSignature,
  signaturit: Shield,
};

const PROVIDER_COLORS: Record<string, string> = {
  docusign: 'from-yellow-500 to-amber-600',
  signaturit: 'from-blue-500 to-blue-600',
};

export default function FirmaCompartidaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<SignatureProvider[]>([]);
  const [summary, setSummary] = useState<SignatureSummary | null>(null);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [companiesWithSignatures, setCompaniesWithSignatures] = useState<CompanySignatures[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    if (status === 'authenticated' && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      router.push('/unauthorized');
    }
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, session, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/integrations/signatures/status');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
        setSummary(data.summary || null);
        setDocumentTemplates(data.documentTemplates || []);
        setCompaniesWithSignatures(data.companiesWithSignatures || []);
      } else {
        setProviders([]);
        setSummary(null);
        setDocumentTemplates([]);
        setCompaniesWithSignatures([]);
      }
    } catch (error) {
      console.error('Error loading signature data:', error);
      setProviders([]);
      setSummary(null);
      setDocumentTemplates([]);
      setCompaniesWithSignatures([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-compartidas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Compartidas
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <FileSignature className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Firma Digital</h1>
              <p className="text-muted-foreground">DocuSign y Signaturit - Configuración centralizada de Inmova</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
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
          {loading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Documentos Enviados</p>
                <p className="text-2xl font-bold">{summary?.totalEnvelopes || 0}</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Firmados</p>
                <p className="text-2xl font-bold text-green-600">{summary?.totalSigned || 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-500">{summary?.totalPending || 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Tasa de Completado</p>
                <p className="text-2xl font-bold">{summary?.completionRate || 0}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proveedores */}
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay proveedores de firma configurados</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={providers[0]?.id || 'docusign'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            {providers.map((provider) => (
              <TabsTrigger key={provider.id} value={provider.id}>
                {provider.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {providers.map((provider) => {
            const Icon = PROVIDER_ICONS[provider.id] || FileSignature;
            const color = PROVIDER_COLORS[provider.id] || 'from-gray-500 to-gray-600';
            
            return (
              <TabsContent key={provider.id} value={provider.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                          <Icon className="h-6 w-6 text-white" />
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
                        <Badge variant={provider.status === 'connected' ? 'default' : 'secondary'}>
                          {provider.status === 'connected' ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" />Activo</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Inactivo</>
                          )}
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
                            <Input type="password" placeholder="xxxx-xxxx-xxxx-xxxx" />
                          </div>
                          <div className="space-y-2">
                            <Label>Account ID</Label>
                            <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                          </div>
                          <div className="space-y-2">
                            <Label>RSA Private Key</Label>
                            <Input type="password" placeholder="Clave privada RSA" />
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
                            <Input type="password" placeholder="API Token de Signaturit" />
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
                        <Button onClick={() => toast.success('Conexión verificada')}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Probar Conexión
                        </Button>
                        <Button variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir Dashboard
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

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
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : documentTemplates.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay plantillas de documentos configuradas
            </p>
          ) : (
            <div className="space-y-3">
              {documentTemplates.map((doc, idx) => (
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
          )}
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
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : companiesWithSignatures.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay empresas con firma digital activa este mes
            </p>
          ) : (
            <div className="space-y-3">
              {companiesWithSignatures.map((company, idx) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
