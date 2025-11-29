'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, ArrowLeft } from 'lucide-react';

export default function TenantChatbotPage() {
  const router = useRouter();

  useEffect(() => {
    const tenantData = localStorage.getItem('tenant');
    if (!tenantData) {
      router.push('/portal-inquilino/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/portal-inquilino/dashboard')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Chatbot de Asistencia</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Para comunicarte con el equipo de gestión, utiliza el sistema de chat disponible en el menú principal.
              </p>
              <Button
                onClick={() => router.push('/portal-inquilino/chat')}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Ir al Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
