'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Settings,
  RefreshCw,
  ExternalLink,
  FileText,
  Euro
} from 'lucide-react';
import Link from 'next/link';

export default function ContabilidadPlataformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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

  const handleTestConnection = async () => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnected(true);
    setIsTesting(false);
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
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Euro className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Contabilidad - Contasimple</h1>
            <p className="text-muted-foreground">Integración contable de la plataforma Inmova</p>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"} className="ml-auto">
            {isConnected ? "Conectado" : "No conectado"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Estado de Conexión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
              Estado de la Integración
            </CardTitle>
            <CardDescription>
              Contasimple es el proveedor de contabilidad de Inmova para gestionar ingresos, gastos y facturación de la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Facturas Emitidas</p>
                <p className="text-2xl font-bold">247</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Ingresos Sincronizados</p>
                <p className="text-2xl font-bold text-green-600">€45,320</p>
                <p className="text-xs text-muted-foreground">Último período</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Última Sincronización</p>
                <p className="text-2xl font-bold">Hace 2h</p>
                <p className="text-xs text-muted-foreground">Automática</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de API
            </CardTitle>
            <CardDescription>
              Credenciales para conectar con Contasimple
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" placeholder="cs_live_xxxxxxxxxxxx" defaultValue="cs_live_••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Company ID</Label>
                <Input placeholder="Identificador de empresa" defaultValue="inmova-2024" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input readOnly value="https://inmovaapp.com/api/webhooks/contasimple" />
              <p className="text-xs text-muted-foreground">Configura esta URL en el panel de Contasimple para recibir notificaciones</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTestConnection} disabled={isTesting}>
                {isTesting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {isTesting ? 'Probando...' : 'Probar Conexión'}
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Contasimple
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Funcionalidades Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { name: 'Sincronización de facturas emitidas', active: true },
                { name: 'Sincronización de gastos', active: true },
                { name: 'Generación automática de asientos', active: true },
                { name: 'Exportación para modelo 303 (IVA)', active: true },
                { name: 'Exportación para modelo 347', active: false },
                { name: 'Conciliación bancaria automática', active: false },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">{feature.name}</span>
                  <Badge variant={feature.active ? "default" : "outline"}>
                    {feature.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
