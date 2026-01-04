/**
 * Componente: SMSIntegration
 * 
 * Configuración de Twilio (SMS/WhatsApp)
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, AlertCircle, ExternalLink, Eye, EyeOff, Info } from 'lucide-react';

const smsSchema = z.object({
  mode: z.enum(['own', 'shared']),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type SMSFormValues = z.infer<typeof smsSchema>;

interface SMSIntegrationProps {
  companyId: string;
  accountSid: string | null;
  authToken: string | null;
  phoneNumber: string | null;
}

export function SMSIntegration({
  companyId,
  accountSid,
  authToken,
  phoneNumber,
}: SMSIntegrationProps) {
  const [testing, setTesting] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);

  const isConfigured = !!(accountSid && authToken && phoneNumber);

  const form = useForm<SMSFormValues>({
    resolver: zodResolver(smsSchema),
    defaultValues: {
      mode: accountSid ? 'own' : 'shared',
      accountSid: accountSid ? '••••••••••••••••' : '',
      authToken: authToken ? '••••••••••••••••' : '',
      phoneNumber: phoneNumber || '',
    },
  });

  const mode = form.watch('mode');

  const onSubmit = async (data: SMSFormValues) => {
    try {
      const response = await fetch('/api/settings/integrations/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          mode: data.mode,
          accountSid: data.accountSid?.startsWith('••') ? undefined : data.accountSid,
          authToken: data.authToken?.startsWith('••') ? undefined : data.authToken,
          phoneNumber: data.phoneNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error guardando configuración');
      }

      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      console.error('[SMSIntegration] Error:', error);
      toast.error(error.message || 'Error guardando configuración');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/settings/integrations/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en la prueba de conexión');
      }

      toast.success(`Conexión verificada ✓ (Número: ${result.phoneNumber})`);
    } catch (error: any) {
      console.error('[SMSIntegration] Test error:', error);
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
              SMS / WhatsApp (Twilio)
              <Badge variant="secondary" className="ml-2">
                <Info className="h-3 w-3 mr-1" />
                Próximamente
              </Badge>
            </CardTitle>
            <CardDescription>
              Envía SMS y mensajes de WhatsApp a inquilinos y propietarios
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Funcionalidad en desarrollo</AlertTitle>
          <AlertDescription>
            La integración con Twilio estará disponible próximamente. Te permitirá enviar:
            <ul className="mt-2 space-y-1 ml-4 text-sm">
              <li>• Recordatorios de pago por SMS</li>
              <li>• Notificaciones de incidencias</li>
              <li>• Mensajes de WhatsApp automatizados</li>
              <li>• Confirmaciones de citas</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Features List */}
        <div className="rounded-lg border p-4 space-y-2 opacity-50">
          <h4 className="font-semibold text-sm">Próximamente:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• SMS transaccionales (recordatorios, alertas)</li>
            <li>• WhatsApp Business API</li>
            <li>• Plantillas personalizables</li>
            <li>• Programación de envíos</li>
            <li>• Estadísticas de entrega</li>
          </ul>
        </div>

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
                      disabled
                    >
                      <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 opacity-50">
                        <RadioGroupItem value="shared" disabled />
                        <div className="flex-1">
                          <FormLabel className="font-normal">
                            Usar servicio compartido de Inmova
                          </FormLabel>
                          <FormDescription>50 SMS/mes gratis incluidos</FormDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 opacity-50">
                        <RadioGroupItem value="own" disabled />
                        <div className="flex-1">
                          <FormLabel className="font-normal">Usar mi propia cuenta de Twilio</FormLabel>
                          <FormDescription>
                            Sin límites. Tú pagas directamente a Twilio.
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
                {/* Account SID */}
                <FormField
                  control={form.control}
                  name="accountSid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account SID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        <a
                          href="https://console.twilio.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline"
                        >
                          Obtener de Twilio Console <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Auth Token */}
                <FormField
                  control={form.control}
                  name="authToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auth Token</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showAuthToken ? 'text' : 'password'}
                            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            {...field}
                            disabled
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowAuthToken(!showAuthToken)}
                            disabled
                          >
                            {showAuthToken ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>Token de autenticación de Twilio</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+34600123456" {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        Número de Twilio desde el que se enviarán los mensajes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración (Próximamente)
              </Button>

              {(isConfigured || mode === 'shared') && (
                <Button type="button" variant="outline" onClick={testConnection} disabled>
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
