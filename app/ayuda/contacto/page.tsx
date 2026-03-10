import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { BreadcrumbNav } from '@/components/help-center/BreadcrumbNav';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Contacto | Centro de Ayuda',
  description:
    '¿Necesitas ayuda? Contacta con el equipo de soporte de Inmova por email, WhatsApp o teléfono. También puedes hablar con nuestros agentes IA.',
};

export default function ContactoPage() {
  return (
    <div className="container px-4 py-8">
      <BreadcrumbNav
        items={[
          { label: 'Centro de Ayuda', href: '/ayuda' },
          { label: 'Contacto' },
        ]}
      />

      <h1 className="mt-6 text-3xl font-bold tracking-tight mb-10">
        ¿Necesitas ayuda?
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="font-semibold">Email</h2>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href="mailto:soporte@inmovaapp.com"
              className="text-primary hover:underline"
            >
              soporte@inmovaapp.com
            </a>
            <p className="mt-2 text-sm text-muted-foreground">
              Respuesta en menos de 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h2 className="font-semibold">WhatsApp</h2>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href="https://wa.me/34900000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Enviar mensaje
            </a>
            <p className="mt-2 text-sm text-muted-foreground">
              Atención en tiempo real
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="font-semibold">Teléfono</h2>
            </div>
          </CardHeader>
          <CardContent>
            <a href="tel:+34900000000" className="text-primary hover:underline">
              +34 900 000 000
            </a>
            <p className="mt-2 text-sm text-muted-foreground">
              Lun-Vie 9:00-18:00
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Link
          href="/dashboard/ayuda"
          className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <h3 className="font-semibold">Hablar con nuestros agentes IA</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Accede al dashboard y chatea con asistentes inteligentes para resolver
            dudas al instante.
          </p>
        </Link>

        <Link
          href="/soporte"
          className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <h3 className="font-semibold">Crear ticket de soporte</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Abre un ticket para incidencias técnicas o solicitudes específicas.
          </p>
        </Link>
      </div>
    </div>
  );
}
