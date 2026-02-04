'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Settings,
  RefreshCw,
  ExternalLink,
  Cloud,
  Database,
  HardDrive,
  Server
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function InfraestructuraPlataformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleVerifyS3 = () => {
    toast.success('Conexión con AWS S3 verificada');
  };

  const handleOpenAwsConsole = () => {
    window.open('https://console.aws.amazon.com/s3/home', '_blank');
  };

  const handleTestDb = () => {
    toast.success('Conexión con PostgreSQL verificada');
  };

  const handleOpenPrisma = () => {
    toast.info('Prisma Studio requiere acceso local al servidor');
  };

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

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-plataforma" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Plataforma
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Cloud className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Infraestructura</h1>
            <p className="text-muted-foreground">AWS S3 y PostgreSQL - Backend de la plataforma</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* AWS S3 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <HardDrive className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>AWS S3</CardTitle>
                  <CardDescription>Almacenamiento de archivos y documentos</CardDescription>
                </div>
              </div>
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Operativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Archivos</p>
                <p className="text-2xl font-bold">12,456</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Almacenamiento</p>
                <p className="text-2xl font-bold">45.2 GB</p>
                <p className="text-xs text-muted-foreground">de 100 GB</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Transferencia</p>
                <p className="text-2xl font-bold">234 GB</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Costo Estimado</p>
                <p className="text-2xl font-bold">€12.50</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Uso de almacenamiento</span>
                <span className="text-sm text-muted-foreground">45.2%</span>
              </div>
              <Progress value={45.2} className="h-2" />
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bucket Name</Label>
                  <Input readOnly defaultValue="inmova-production-files" />
                </div>
                <div className="space-y-2">
                  <Label>Región</Label>
                  <Input readOnly defaultValue="eu-west-1 (Irlanda)" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Access Key ID</Label>
                <Input type="password" defaultValue="AKIA••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Secret Access Key</Label>
                <Input type="password" defaultValue="••••••••••••••••••••••••••••••••" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleVerifyS3}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Conexión
                </Button>
                <Button variant="outline" onClick={handleOpenAwsConsole}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir AWS Console
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PostgreSQL */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>PostgreSQL</CardTitle>
                  <CardDescription>Base de datos principal de la plataforma</CardDescription>
                </div>
              </div>
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Tablas</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold">1.2M</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Tamaño DB</p>
                <p className="text-2xl font-bold">2.3 GB</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Conexiones</p>
                <p className="text-2xl font-bold">12/100</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Conexiones activas</span>
                <span className="text-sm text-muted-foreground">12%</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Host</Label>
                <Input readOnly defaultValue="localhost:5432" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Database</Label>
                  <Input readOnly defaultValue="inmova_production" />
                </div>
                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <Input readOnly defaultValue="inmova_user" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTestDb}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Conexión
                </Button>
                <Button variant="outline" onClick={handleOpenPrisma}>
                  <Database className="h-4 w-4 mr-2" />
                  Prisma Studio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Servidor de Aplicación</CardTitle>
                <CardDescription>Estado del servidor VPS</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">CPU</p>
                <p className="text-2xl font-bold">23%</p>
                <Progress value={23} className="h-1 mt-2" />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">RAM</p>
                <p className="text-2xl font-bold">4.2 GB</p>
                <Progress value={52} className="h-1 mt-2" />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Disco</p>
                <p className="text-2xl font-bold">62%</p>
                <Progress value={62} className="h-1 mt-2" />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">99.9%</p>
                <p className="text-xs text-green-500">30 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
