/**
 * Página: Configuración de Integraciones
 * 
 * Permite a cada empresa configurar sus propias credenciales:
 * - Signaturit/DocuSign (firma digital)
 * - AWS S3 (almacenamiento)
 * - Claude IA (inteligencia artificial)
 * - Twilio (SMS/WhatsApp)
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { IntegrationsSettings } from '@/components/settings/integrations-settings';

export const metadata: Metadata = {
  title: 'Integraciones | Inmova',
  description: 'Configura tus integraciones con servicios externos',
};

export default async function IntegrationsPage() {
  // Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  // Solo admins pueden configurar integraciones
  if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
    redirect('/dashboard');
  }

  // Obtener configuración actual de la empresa
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: {
      id: true,
      nombre: true,
      // Signaturit
      signatureProvider: true,
      signatureApiKey: true,
      signatureWebhookSecret: true,
      signatureEnvironment: true,
      // AWS S3
      awsAccessKeyId: true,
      awsSecretAccessKey: true,
      awsBucket: true,
      awsRegion: true,
      // Claude IA
      anthropicApiKey: true,
      // Twilio
      twilioAccountSid: true,
      twilioAuthToken: true,
      twilioPhoneNumber: true,
    },
  });

  if (!company) {
    redirect('/dashboard');
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integraciones</h1>
        <p className="text-muted-foreground mt-2">
          Configura tus integraciones con servicios externos. Todas las credenciales se almacenan de forma segura y encriptada.
        </p>
      </div>

      <IntegrationsSettings company={company} />
    </div>
  );
}
