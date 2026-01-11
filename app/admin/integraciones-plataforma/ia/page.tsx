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
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Settings,
  RefreshCw,
  ExternalLink,
  Brain,
  Sparkles,
  MessageSquare,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function IAPlataformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [temperature, setTemperature] = useState([0.7]);

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
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Inteligencia Artificial</h1>
            <p className="text-muted-foreground">Anthropic Claude para asistencia y automatización</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Estado General */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Anthropic Claude</CardTitle>
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Activo
              </Badge>
            </div>
            <CardDescription>
              Motor de IA para valoraciones, descripciones y asistente virtual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Consultas Hoy</p>
                <p className="text-2xl font-bold">234</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Tokens Usados</p>
                <p className="text-2xl font-bold">1.2M</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Costo Estimado</p>
                <p className="text-2xl font-bold">€45.20</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Latencia Media</p>
                <p className="text-2xl font-bold">1.2s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" defaultValue="sk-ant-api03-••••••••••••••••••••" />
              <p className="text-xs text-muted-foreground">Clave de API de Anthropic</p>
            </div>

            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input defaultValue="claude-3-5-sonnet-20241022" readOnly />
              <p className="text-xs text-muted-foreground">Claude 3.5 Sonnet - Mejor balance calidad/costo</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Temperatura: {temperature[0]}</Label>
                <span className="text-sm text-muted-foreground">Creatividad de respuestas</span>
              </div>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                min={0}
                max={1}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">0 = Más determinista, 1 = Más creativo</p>
            </div>

            <div className="flex gap-2">
              <Button>
                <RefreshCw className="h-4 w-4 mr-2" />
                Probar Conexión
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Anthropic Console
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Funcionalidades Activas
            </CardTitle>
            <CardDescription>Módulos que utilizan IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Generación de Descripciones</p>
                  <p className="text-sm text-muted-foreground">Crear descripciones atractivas para propiedades</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold">€</span>
                </div>
                <div>
                  <p className="font-medium">Valoración Automática</p>
                  <p className="text-sm text-muted-foreground">Estimar precio de propiedades con IA</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Asistente Virtual</p>
                  <p className="text-sm text-muted-foreground">Chatbot para soporte a usuarios</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Matching Inquilino-Propiedad</p>
                  <p className="text-sm text-muted-foreground">Sugerir propiedades según perfil</p>
                </div>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Clasificación de Incidencias</p>
                  <p className="text-sm text-muted-foreground">Categorizar y priorizar automáticamente</p>
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Límites y Cuotas */}
        <Card>
          <CardHeader>
            <CardTitle>Límites de Uso</CardTitle>
            <CardDescription>Control de gastos y cuotas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Límite mensual de tokens</Label>
                <Input defaultValue="5000000" type="number" />
              </div>
              <div className="space-y-2">
                <Label>Presupuesto mensual (€)</Label>
                <Input defaultValue="100" type="number" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Alertas de uso</p>
                <p className="text-sm text-muted-foreground">Notificar al alcanzar 80% del límite</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
