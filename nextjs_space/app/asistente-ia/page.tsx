'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Bot, MessageSquare, Mic, Zap, TrendingUp } from 'lucide-react';

export default function AIAssistantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="text-center">Cargando...</div></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbLink href="/"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>Asistente IA</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="mt-2 text-3xl font-bold">Asistente IA Conversacional</h1>
              <p className="text-muted-foreground">Automatización con IA y comandos de voz</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conversaciones</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Comandos Ejecutados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tasa Éxito</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0%</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tiempo Ahorrado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0h</div></CardContent></Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Chatbot GPT-4 Turbo</CardTitle><CardDescription>Conversaciones naturales con memoria de contexto</CardDescription></CardHeader>
              <CardContent><Button className="w-full">Abrir Chat</Button></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5" />Comandos de Voz</CardTitle><CardDescription>Control por voz con Whisper AI</CardDescription></CardHeader>
              <CardContent><Button className="w-full" variant="outline">Activar Micrófono</Button></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Automatización Tareas</CardTitle><CardDescription>Ejecución automática de comandos</CardDescription></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground mb-4">"Crear contrato para Juan en 3B" → lo hace automáticamente</p><Button className="w-full" variant="outline" disabled>Ver Ejemplos</Button></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />WhatsApp Business</CardTitle><CardDescription>Canal oficial verificado</CardDescription></CardHeader>
              <CardContent><Badge>PRÓXIMAMENTE</Badge><p className="text-sm text-muted-foreground mt-2">Integración con Twilio WhatsApp API</p></CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
