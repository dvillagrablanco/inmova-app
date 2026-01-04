/**
 * Componente: IntegrationsSettings
 * 
 * Formulario para configurar integraciones de la empresa
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignatureIntegration } from './signature-integration';
import { StorageIntegration } from './storage-integration';
import { AIIntegration } from './ai-integration';
import { SMSIntegration } from './sms-integration';
import { FileSignature, Database, Brain, MessageSquare } from 'lucide-react';

interface IntegrationsSettingsProps {
  company: {
    id: string;
    nombre: string;
    // Signaturit
    signatureProvider: string | null;
    signatureApiKey: string | null;
    signatureWebhookSecret: string | null;
    signatureEnvironment: string | null;
    // AWS S3
    awsAccessKeyId: string | null;
    awsSecretAccessKey: string | null;
    awsBucket: string | null;
    awsRegion: string | null;
    // Claude IA
    anthropicApiKey: string | null;
    // Twilio
    twilioAccountSid: string | null;
    twilioAuthToken: string | null;
    twilioPhoneNumber: string | null;
  };
}

export function IntegrationsSettings({ company }: IntegrationsSettingsProps) {
  const [activeTab, setActiveTab] = useState('signature');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="signature" className="flex items-center gap-2">
          <FileSignature className="h-4 w-4" />
          <span className="hidden sm:inline">Firma Digital</span>
        </TabsTrigger>
        <TabsTrigger value="storage" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">Almacenamiento</span>
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Inteligencia IA</span>
        </TabsTrigger>
        <TabsTrigger value="sms" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">SMS/WhatsApp</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="signature">
        <SignatureIntegration
          companyId={company.id}
          provider={company.signatureProvider}
          apiKey={company.signatureApiKey}
          webhookSecret={company.signatureWebhookSecret}
          environment={company.signatureEnvironment}
        />
      </TabsContent>

      <TabsContent value="storage">
        <StorageIntegration
          companyId={company.id}
          accessKeyId={company.awsAccessKeyId}
          secretAccessKey={company.awsSecretAccessKey}
          bucket={company.awsBucket}
          region={company.awsRegion}
        />
      </TabsContent>

      <TabsContent value="ai">
        <AIIntegration
          companyId={company.id}
          apiKey={company.anthropicApiKey}
        />
      </TabsContent>

      <TabsContent value="sms">
        <SMSIntegration
          companyId={company.id}
          accountSid={company.twilioAccountSid}
          authToken={company.twilioAuthToken}
          phoneNumber={company.twilioPhoneNumber}
        />
      </TabsContent>
    </Tabs>
  );
}
