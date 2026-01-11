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
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Settings,
  RefreshCw,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';

export default function ComunicacionPlataformaPage() {
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

  const integrations = [
    {
      id: 'crisp',
      name: 'Crisp',
      description: 'Chat en vivo y soporte',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      status: 'connected',
      stats: { conversations: 156, satisfaction: '94%' }
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS y llamadas',
      icon: Phone,
      color: 'from-red-500 to-red-600',
      status: 'connected',
      stats: { sms: 1240, calls: 89 }
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Email transaccional',
      icon: Mail,
      color: 'from-blue-500 to-blue-600',
      status: 'connected',
      stats: { sent: 45000, delivered: '99.2%' }
    },
    {
      id: 'gmail',
      name: 'Gmail SMTP',
      description: 'Email de respaldo',
      icon: Mail,
      color: 'from-green-500 to-green-600',
      status: 'connected',
      stats: { daily: 500, available: '100%' }
    },
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-plataforma" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Plataforma
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Comunicación</h1>
            <p className="text-muted-foreground">Crisp, Twilio, SendGrid y Gmail para comunicaciones de la plataforma</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="crisp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="crisp">Crisp</TabsTrigger>
          <TabsTrigger value="twilio">Twilio</TabsTrigger>
          <TabsTrigger value="sendgrid">SendGrid</TabsTrigger>
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
        </TabsList>

        {integrations.map((integration) => (
          <TabsContent key={integration.id} value={integration.id}>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
                        <integration.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conectado
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
                      <Input type="password" defaultValue="••••••••••••••••••••" />
                    </div>
                    {integration.id === 'twilio' && (
                      <>
                        <div className="space-y-2">
                          <Label>Account SID</Label>
                          <Input type="password" defaultValue="••••••••••••••••••••" />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input defaultValue="+34 612 345 678" />
                        </div>
                      </>
                    )}
                    {integration.id === 'gmail' && (
                      <div className="space-y-2">
                        <Label>Email de envío</Label>
                        <Input defaultValue="noreply@inmovaapp.com" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button>
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
        ))}
      </Tabs>
    </div>
  );
}
