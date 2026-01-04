/**
 * Componente: StorageIntegration
 * 
 * Configuración de almacenamiento AWS S3
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
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff, Info } from 'lucide-react';

const storageSchema = z.object({
  mode: z.enum(['own', 'shared']),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  bucket: z.string().optional(),
  region: z.string().optional(),
});

type StorageFormValues = z.infer<typeof storageSchema>;

interface StorageIntegrationProps {
  companyId: string;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  bucket: string | null;
  region: string | null;
}

export function StorageIntegration({
  companyId,
  accessKeyId,
  secretAccessKey,
  bucket,
  region,
}: StorageIntegrationProps) {
  const [testing, setTesting] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const isConfigured = !!(accessKeyId && secretAccessKey && bucket);

  const form = useForm<StorageFormValues>({
    resolver: zodResolver(storageSchema),
    defaultValues: {
      mode: accessKeyId ? 'own' : 'shared',
      accessKeyId: accessKeyId ? '••••••••••••••••' : '',
      secretAccessKey: secretAccessKey ? '••••••••••••••••' : '',
      bucket: bucket || '',
      region: region || 'eu-west-1',
    },
  });

  const mode = form.watch('mode');

  const onSubmit = async (data: StorageFormValues) => {
    try {
      const response = await fetch('/api/settings/integrations/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          mode: data.mode,
          accessKeyId: data.accessKeyId?.startsWith('••') ? undefined : data.accessKeyId,
          secretAccessKey: data.secretAccessKey?.startsWith('••') ? undefined : data.secretAccessKey,
          bucket: data.bucket,
          region: data.region,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error guardando configuración');
      }

      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      console.error('[StorageIntegration] Error:', error);
      toast.error(error.message || 'Error guardando configuración');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/settings/integrations/storage/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en la prueba de conexión');
      }

      toast.success(`Conexión verificada ✓ (Bucket: ${result.bucket})`);
    } catch (error: any) {
      console.error('[StorageIntegration] Test error:', error);
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
              Almacenamiento (AWS S3)
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
              Configura AWS S3 para almacenar fotos, documentos y archivos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Opciones de almacenamiento</AlertTitle>
          <AlertDescription>
            <strong>Compartido:</strong> Usa el bucket de Inmova (10GB gratis, luego €0.05/GB/mes)
            <br />
            <strong>Propio:</strong> Usa tu bucket AWS S3 (tú pagas directo a Amazon)
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
                        <RadioGroupItem value="shared" />
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">
                            Usar almacenamiento compartido de Inmova
                          </FormLabel>
                          <FormDescription>
                            Fácil y rápido. 10GB gratis incluidos en tu plan.
                          </FormDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                        <RadioGroupItem value="own" />
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">
                            Usar mi propio bucket AWS S3
                          </FormLabel>
                          <FormDescription>
                            Control total. Tú pagas directamente a Amazon (~€0.023/GB/mes).
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
                {/* Access Key ID */}
                <FormField
                  control={form.control}
                  name="accessKeyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AWS Access Key ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showAccessKey ? 'text' : 'password'}
                            placeholder="AKIAIOSFODNN7EXAMPLE"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowAccessKey(!showAccessKey)}
                          >
                            {showAccessKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        <a
                          href="https://console.aws.amazon.com/iam/home#/security_credentials"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline"
                        >
                          Crear Access Key en AWS <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Secret Access Key */}
                <FormField
                  control={form.control}
                  name="secretAccessKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AWS Secret Access Key</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showSecretKey ? 'text' : 'password'}
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecretKey(!showSecretKey)}
                          >
                            {showSecretKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Clave secreta (solo se muestra una vez al crearla)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bucket */}
                <FormField
                  control={form.control}
                  name="bucket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Bucket</FormLabel>
                      <FormControl>
                        <Input placeholder="mi-empresa-inmova" {...field} />
                      </FormControl>
                      <FormDescription>
                        Debe existir en tu cuenta AWS. Permisos: s3:PutObject, s3:GetObject,
                        s3:DeleteObject
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Region */}
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Región</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona región" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="eu-west-1">eu-west-1 (Irlanda)</SelectItem>
                          <SelectItem value="eu-west-3">eu-west-3 (París)</SelectItem>
                          <SelectItem value="eu-central-1">eu-central-1 (Frankfurt)</SelectItem>
                          <SelectItem value="eu-south-1">eu-south-1 (Milán)</SelectItem>
                          <SelectItem value="us-east-1">us-east-1 (Virginia)</SelectItem>
                          <SelectItem value="us-west-2">us-west-2 (Oregón)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Región donde está tu bucket</FormDescription>
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
