'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  Plug,
} from 'lucide-react';
import { toast } from 'sonner';
import { INTEGRATION_PROVIDERS, type IntegrationProvider } from '@/lib/integration-manager';

export default function ProviderSetupPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const providerId = params.provider as string;

  const [provider, setProvider] = useState<IntegrationProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const totalSteps = 3;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const foundProvider = INTEGRATION_PROVIDERS.find(p => p.id === providerId);
    if (foundProvider) {
      setProvider(foundProvider);
      const initialCredentials: Record<string, string> = {};
      foundProvider.credentialFields.forEach(field => {
        initialCredentials[field.key] = '';
      });
      setCredentials(initialCredentials);
    }
    setLoading(false);
  }, [providerId]);

  const handleTest = async () => {
    try {
      setSaving(true);
      setTestResult(null);

      // Simular test de conexión
      await new Promise(resolve => setTimeout(resolve, 1500));

      // En producción, esto sería una llamada a la API
      const allFieldsFilled = provider?.credentialFields
        .filter(f => f.required)
        .every(f => credentials[f.key]);

      if (allFieldsFilled) {
        setTestResult({ success: true, message: 'Conexión verificada correctamente' });
        toast.success('Conexión verificada');
      } else {
        setTestResult({ success: false, message: 'Completa todos los campos obligatorios' });
        toast.error('Campos incompletos');
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error al verificar conexión' });
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!provider) return;

    const missingFields = provider.credentialFields
      .filter(f => f.required && !credentials[f.key])
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`Campos obligatorios: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/integrations/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials, enabled: true }),
      });

      if (response.ok) {
        toast.success('Integración configurada correctamente');
        setStep(3);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const toggleShowPassword = (key: string) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Integración no encontrada: {providerId}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/integrations')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {provider.logo ? (
            <img src={provider.logo} alt={provider.name} className="h-16 w-16 object-contain" />
          ) : (
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Plug className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold">Configurar {provider.name}</h1>
        <p className="text-muted-foreground mt-2">{provider.description}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Paso {step} de {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <Progress value={(step / totalSteps) * 100} />
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Antes de empezar</CardTitle>
            <CardDescription>
              Necesitarás las credenciales de tu cuenta de {provider.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para continuar, necesitarás:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {provider.credentialFields.filter(f => f.required).map(field => (
                    <li key={field.key}>{field.label}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {provider.website && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm mb-2">
                  Puedes obtener estas credenciales en:
                </p>
                <a
                  href={provider.website}
                  target="_blank"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {provider.website}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/integrations')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={() => setStep(2)}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Credentials */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Introduce tus credenciales</CardTitle>
            <CardDescription>
              Estos datos se guardan de forma segura y encriptada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {provider.credentialFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.type === 'select' ? (
                  <select
                    id={field.key}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={credentials[field.key]}
                    onChange={(e) =>
                      setCredentials({ ...credentials, [field.key]: e.target.value })
                    }
                  >
                    <option value="">Selecciona una opción</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id={field.key}
                      type={
                        field.type === 'password' && !showPassword[field.key]
                          ? 'password'
                          : 'text'
                      }
                      placeholder={field.placeholder || `Tu ${field.label}`}
                      value={credentials[field.key]}
                      onChange={(e) =>
                        setCredentials({ ...credentials, [field.key]: e.target.value })
                      }
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleShowPassword(field.key)}
                      >
                        {showPassword[field.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}

            {/* Test Result */}
            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTest} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Probar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Guardar y Activar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold">¡Integración completada!</h2>
            <p className="text-muted-foreground">
              {provider.name} ha sido configurado correctamente y está listo para usar.
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/integrations')}
              >
                Ver todas las integraciones
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/integrations/${providerId}`)}
              >
                Ir a configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
