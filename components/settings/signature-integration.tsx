/**
 * Componente: SignatureIntegration
 * 
 * Configuración de firma digital (Signaturit/DocuSign)
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';

const signatureSchema = z.object({
  mode: z.enum(['own', 'shared']),
  provider: z.enum(['signaturit', 'docusign', '']).optional(),
  apiKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  environment: z.enum(['sandbox', 'production']).optional(),
});

type SignatureFormValues = z.infer<typeof signatureSchema>;

interface SignatureIntegrationProps {
  companyId: string;
  provider: string | null;
  apiKey: string | null;
  webhookSecret: string | null;
  environment: string | null;
}

export function SignatureIntegration({
  companyId,
  provider,
  apiKey,
  webhookSecret,
  environment,
}: SignatureIntegrationProps) {
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const isConfigured = !!(provider && apiKey);

  const form = useForm<SignatureFormValues>({
    resolver: zodResolver(signatureSchema),
    defaultValues: {
      mode: apiKey ? 'own' : 'shared',
      provider: (provider as any) || 'signaturit',
      apiKey: apiKey ? '••••••••••••••••' : '',
      webhookSecret: webhookSecret ? '••••••••••••••••' : '',
      environment: (environment as any) || 'sandbox',
    },
  });

  const mode = form.watch('mode');

  const onSubmit = async (data: SignatureFormValues) => {
    try {
      const response = await fetch('/api/settings/integrations/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          mode: data.mode,
          provider: data.provider,
          apiKey: data.apiKey?.startsWith('••') ? undefined : data.apiKey,
          webhookSecret: data.webhookSecret?.startsWith('••') ? undefined : data.webhookSecret,
          environment: data.environment,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error guardando configuración');
      }

      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      console.error('[SignatureIntegration] Error:', error);
      toast.error(error.message || 'Error guardando configuración');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/settings/integrations/signature/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en la prueba de conexión');
      }

      toast.success('Conexión verificada correctamente ✓');
    } catch (error: any) {
      console.error('[SignatureIntegration] Test error:', error);
      toast.error(error.message || 'Error en la prueba de conexión');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Firma Digital
              {isConfigured && (
                <Badge variant="default" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configurado
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configura tu proveedor de firma digital para contratos legales
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Cada empresa debe tener su propia cuenta de Signaturit o DocuSign. Inmova solo integra
            con tu cuenta existente.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Mode Selection */}
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Modo de Configuración</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                        <RadioGroupItem value="own" />
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">
                            Usar mi propia cuenta (Recomendado)
                          </FormLabel>
                          <FormDescription>
                            Configura tu cuenta de Signaturit o DocuSign. Tú pagas directamente al
                            proveedor.
                          </FormDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 opacity-50">
                        <RadioGroupItem value="shared" disabled />
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">
                            Usar cuenta compartida de Inmova
                          </FormLabel>
                          <FormDescription>
                            No disponible. La firma digital debe ser de tu propia cuenta por
                            requisitos legales.
                          </FormDescription>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'own' && (
              <>
                {/* Provider */}
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="signaturit">Signaturit (Recomendado)</SelectItem>
                          <SelectItem value="docusign">DocuSign</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'signaturit' && (
                          <span>
                            Signaturit - Certificado eIDAS{' '}
                            <a
                              href="https://www.signaturit.com/es"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:underline"
                            >
                              Crear cuenta <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </span>
                        )}
                        {field.value === 'docusign' && (
                          <span>
                            DocuSign - Líder mundial{' '}
                            <a
                              href="https://www.docusign.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:underline"
                            >
                              Crear cuenta <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* API Key */}
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showApiKey ? 'text' : 'password'}
                            placeholder="prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Obtén tu API key desde el dashboard de {form.watch('provider') || 'tu proveedor'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Webhook Secret */}
                <FormField
                  control={form.control}
                  name="webhookSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Secret (Opcional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showWebhookSecret ? 'text' : 'password'}
                            placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                          >
                            {showWebhookSecret ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Para verificar eventos de firma. Configura webhook URL:{' '}
                        <code className="bg-muted px-1 py-0.5 rounded">
                          https://inmovaapp.com/api/webhooks/signaturit
                        </code>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Environment */}
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entorno</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona entorno" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sandbox">
                            Sandbox (Pruebas - Sin validez legal)
                          </SelectItem>
                          <SelectItem value="production">Production (Real - Validez legal)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Usa Sandbox para pruebas, Production para contratos reales
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>

              {isConfigured && (
                <Button type="button" variant="outline" onClick={testConnection} disabled={testing}>
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Probar Conexión
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
