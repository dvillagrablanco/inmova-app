/**
 * Página de Ayuda y Contacto
 * Centro de asistencia con acceso a todos los agentes IA
 */

import { Metadata } from 'next';
import { Phone, MessageCircle, Mail, Clock, Bot, Headphones } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Ayuda y Contacto | Inmova',
  description: 'Centro de ayuda y asistencia de Inmova',
};

// Número de teléfono de USA
const USA_PHONE = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER || '';
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
const EMAIL = 'soporte@inmovaapp.com';
const hasPhone = USA_PHONE.length > 0;
const hasWhatsapp = WHATSAPP.length > 0;
const whatsappLink = hasWhatsapp ? `https://wa.me/${WHATSAPP.replace(/\D/g, '')}` : '';

// Agentes disponibles
const AGENTS = [
  {
    name: 'Ana',
    title: 'Recepcionista Virtual',
    description: 'Te conecta con el especialista adecuado',
    emoji: '👩‍💻',
    color: 'bg-indigo-500',
    available: '24/7',
    type: 'receptionist',
  },
  {
    name: 'Elena',
    title: 'Asesora Comercial',
    description: 'Compra, venta e inversión inmobiliaria',
    emoji: '👩‍💼',
    color: 'bg-blue-500',
    available: 'L-V 9-21h, S 10-14h',
    type: 'sales',
  },
  {
    name: 'María',
    title: 'Atención al Cliente',
    description: 'Consultas de inquilinos, pagos, contratos',
    emoji: '👩‍🔧',
    color: 'bg-green-500',
    available: 'L-V 8-20h',
    type: 'customer_service',
  },
  {
    name: 'Carlos',
    title: 'Técnico de Incidencias',
    description: 'Averías, emergencias, reparaciones',
    emoji: '👨‍🔧',
    color: 'bg-orange-500',
    available: '24/7 emergencias',
    type: 'incidents',
  },
  {
    name: 'Patricia',
    title: 'Tasadora Inmobiliaria',
    description: 'Valoraciones, análisis de mercado, ROI',
    emoji: '👩‍💻',
    color: 'bg-purple-500',
    available: 'L-V 9-19h',
    type: 'valuations',
  },
  {
    name: 'Roberto',
    title: 'Captador de Propiedades',
    description: 'Vender o alquilar tu propiedad',
    emoji: '👨‍💼',
    color: 'bg-cyan-500',
    available: 'L-V 9-21h',
    type: 'acquisition',
  },
  {
    name: 'Laura',
    title: 'Especialista Coliving',
    description: 'Espacios compartidos, comunidades',
    emoji: '👩‍🎨',
    color: 'bg-pink-500',
    available: 'L-V 10-20h',
    type: 'coliving',
  },
  {
    name: 'Antonio',
    title: 'Administrador de Fincas',
    description: 'Comunidades de propietarios, juntas',
    emoji: '👨‍⚖️',
    color: 'bg-amber-500',
    available: 'L-V 9-18h',
    type: 'communities',
  },
];

export default function AyudaPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Centro de Ayuda</h1>
        <p className="text-xl text-muted-foreground">
          Estamos aquí para ayudarte. Elige cómo prefieres contactarnos.
        </p>
      </div>

      {/* Contacto principal */}
      <Card className="border-2 border-primary">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
            <Phone className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Llámanos</CardTitle>
          <CardDescription>
            Nuestros asistentes IA te atenderán inmediatamente
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {hasPhone ? (
            <a 
              href={`tel:${USA_PHONE}`}
              className="block text-4xl font-bold font-mono text-primary hover:underline"
            >
              {USA_PHONE}
            </a>
          ) : (
            <span className="block text-2xl font-semibold text-muted-foreground">
              Teléfono no configurado
            </span>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Atención 24/7 con IA | Agentes humanos L-V 9-21h</span>
          </div>
          <div className="flex justify-center gap-4">
            {hasPhone ? (
              <Button size="lg" asChild>
                <a href={`tel:${USA_PHONE}`}>
                  <Phone className="mr-2 h-5 w-5" />
                  Llamar ahora
                </a>
              </Button>
            ) : (
              <Button size="lg" disabled>
                <Phone className="mr-2 h-5 w-5" />
                Llamar ahora
              </Button>
            )}
            {hasWhatsapp ? (
              <Button size="lg" variant="outline" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp
                </a>
              </Button>
            ) : (
              <Button size="lg" variant="outline" disabled>
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid de agentes */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Nuestros Especialistas IA
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent) => (
            <Card key={agent.type} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${agent.color}`}>
                    {agent.emoji}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription className="text-xs">{agent.title}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {agent.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    {agent.available}
                  </Badge>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Bot className="h-4 w-4" />
                    Hablar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Otras formas de contacto */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">WhatsApp</CardTitle>
                <CardDescription>Respuesta inmediata</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasWhatsapp ? (
              <Button variant="outline" className="w-full" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener">
                  Enviar mensaje
                </a>
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                WhatsApp no configurado
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Email</CardTitle>
                <CardDescription>Respuesta en 24h</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <Headphones className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Chat en vivo</CardTitle>
                <CardDescription>Asistente virtual</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Iniciar chat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ rápido */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas Frecuentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">¿Cuánto cuesta la llamada?</h4>
            <p className="text-sm text-muted-foreground">
              Las llamadas a nuestro número USA tienen el coste de una llamada internacional estándar. 
              Te recomendamos usar WhatsApp para consultas rápidas sin coste.
            </p>
          </div>
          <div>
            <h4 className="font-medium">¿Los agentes IA pueden resolver mi problema?</h4>
            <p className="text-sm text-muted-foreground">
              Sí, nuestros agentes IA están entrenados para resolver la mayoría de consultas. 
              Si necesitas hablar con un humano, te transferirán automáticamente.
            </p>
          </div>
          <div>
            <h4 className="font-medium">¿Puedo hablar en otro idioma?</h4>
            <p className="text-sm text-muted-foreground">
              Actualmente atendemos en español e inglés. El agente detectará tu idioma automáticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
