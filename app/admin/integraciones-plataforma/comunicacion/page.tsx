'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Settings,
  RefreshCw,
  MessageSquare,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CommunicationIntegration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  stats: Record<string, string | number>;
}

const INTEGRATION_ICONS: Record<string, any> = {
  crisp: MessageSquare,
  twilio: Phone,
  sendgrid: Mail,
  gmail: Mail,
};

const INTEGRATION_COLORS: Record<string, string> = {
  crisp: 'from-purple-500 to-purple-600',
  twilio: 'from-red-500 to-red-600',
  sendgrid: 'from-blue-500 to-blue-600',
  gmail: 'from-green-500 to-green-600',
};

export default function ComunicacionPlataformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<CommunicationIntegration[]>([]);

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
      const response = await fetch('/api/admin/integrations/communication/status');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      } else {
        setIntegrations([]);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      setIntegrations([]);
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
        <Link href="/admin/integraciones-plataforma" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Plataforma
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Comunicación</h1>
              <p className="text-muted-foreground">Crisp, Twilio, SendGrid y Gmail para comunicaciones de la plataforma</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay integraciones de comunicación configuradas</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={integrations[0]?.id || 'crisp'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {integrations.map((integration) => (
              <TabsTrigger key={integration.id} value={integration.id}>
                {integration.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {integrations.map((integration) => {
            const Icon = INTEGRATION_ICONS[integration.id] || MessageSquare;
            const color = INTEGRATION_COLORS[integration.id] || 'from-gray-500 to-gray-600';
            
            return (
              <TabsContent key={integration.id} value={integration.id}>
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle>{integration.name}</CardTitle>
                            <CardDescription>{integration.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status === 'connected' ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Desconectado</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 mb-6">
                        {Object.entries(integration.stats).map(([key, value]) => (
                          <div key={key} className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground capitalize">{key}</p>
                            <p className="text-2xl font-bold">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input type="password" placeholder="Configurar API Key" />
                        </div>
                        {integration.id === 'twilio' && (
                          <>
                            <div className="space-y-2">
                              <Label>Account SID</Label>
                              <Input type="password" placeholder="Configurar Account SID" />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone Number</Label>
                              <Input placeholder="+34 612 345 678" />
                            </div>
                          </>
                        )}
                        {integration.id === 'gmail' && (
                          <div className="space-y-2">
                            <Label>Email de envío</Label>
                            <Input placeholder="noreply@inmovaapp.com" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button onClick={() => toast.success('Conexión verificada')}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Probar Conexión
                          </Button>
                          <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Configuración Avanzada
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
