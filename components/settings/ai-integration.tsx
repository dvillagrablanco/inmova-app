/**
 * Componente: AIIntegration
 * 
 * Configuración de Claude IA (Anthropic)
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
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff, Info } from 'lucide-react';

const aiSchema = z.object({
  mode: z.enum(['own', 'shared']),
  apiKey: z.string().optional(),
});

type AIFormValues = z.infer<typeof aiSchema>;

interface AIIntegrationProps {
  companyId: string;
  apiKey: string | null;
}

export function AIIntegration({ companyId, apiKey }: AIIntegrationProps) {
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const isConfigured = !!apiKey;

  const form = useForm<AIFormValues>({
    resolver: zodResolver(aiSchema),
    defaultValues: {
      mode: apiKey ? 'own' : 'shared',
      apiKey: apiKey ? '••••••••••••••••' : '',
    },
  });

  const mode = form.watch('mode');

  const onSubmit = async (data: AIFormValues) => {
    try {
      const response = await fetch('/api/settings/integrations/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          mode: data.mode,
          apiKey: data.apiKey?.startsWith('••') ? undefined : data.apiKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error guardando configuración');
      }

      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      console.error('[AIIntegration] Error:', error);
      toast.error(error.message || 'Error guardando configuración');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/settings/integrations/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en la prueba de conexión');
      }

      toast.success(`Conexión verificada ✓ (Modelo: ${result.model})`);
    } catch (error: any) {
      console.error('[AIIntegration] Test error:', error);
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
              Inteligencia Artificial (Claude)
              {isConfigured && (
                <Badge variant="default" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configurado
                </Badge>
              )}
              {!isConfigured && (
                <Badge variant="secondary" className="ml-2">
                  <Info className="h-3 w-3 mr-1" />
                  Usando compartido
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configura Claude IA para valoraciones, chatbot y generación de descripciones
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Opciones de IA</AlertTitle>
          <AlertDescription>
            <strong>Compartido:</strong> Usa la API de Inmova (5,000 tokens/mes gratis, luego
            €0.10/1000 tokens)
            <br />
            <strong>Propio:</strong> Usa tu API de Anthropic (tú pagas directo, ~€3/1M tokens)
          </AlertDescription>
        </Alert>

        {/* Features List */}
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-semibold text-sm">Funcionalidades incluidas:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Valoración automática de propiedades</li>
            <li>• Chatbot inteligente para inquilinos</li>
            <li>• Generación de descripciones atractivas</li>
            <li>• Análisis de documentos (contratos, extractos)</li>
            <li>• Clasificación de incidencias</li>
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
                    >
                      <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                        <RadioGroupItem value="shared" />
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">
                            Usar IA compartida de Inmova
                          </FormLabel>
                          <FormDescription>
                            Fácil y rápido. 5,000 tokens/mes gratis incluidos.
                          </FormDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                        <RadioGroupItem value="own" />
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">
                            Usar mi propia API de Anthropic Claude
                          </FormLabel>
                          <FormDescription>
                            Sin límites. Ideal para uso intensivo (>100 valoraciones/mes).
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
                {/* API Key */}
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anthropic API Key</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showApiKey ? 'text' : 'password'}
                            placeholder="sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline"
                        >
                          Crear API Key en Anthropic <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pricing Info */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Precios de Anthropic (tu cuenta)</AlertTitle>
                  <AlertDescription className="text-xs space-y-1">
                    <div>Claude 3.5 Sonnet (recomendado):</div>
                    <div>• Input: $3 por 1M tokens (~750,000 palabras)</div>
                    <div>• Output: $15 por 1M tokens</div>
                    <div className="pt-2">
                      Ejemplo: 100 valoraciones/mes ≈ 500K tokens ≈ <strong>$2-3/mes</strong>
                    </div>
                  </AlertDescription>
                </Alert>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>

              {(isConfigured || mode === 'shared') && (
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
