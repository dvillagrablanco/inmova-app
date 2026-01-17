'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { INTEGRATION_PROVIDERS, type IntegrationProvider } from '@/lib/integration-manager';

export default function ProviderConfigPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const providerId = params.provider as string;

  const [provider, setProvider] = useState<IntegrationProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isConfigured, setIsConfigured] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Buscar proveedor en el catálogo
    const foundProvider = INTEGRATION_PROVIDERS.find(p => p.id === providerId);
    if (foundProvider) {
      setProvider(foundProvider);
      // Inicializar campos de credenciales vacíos
      const initialCredentials: Record<string, string> = {};
      foundProvider.credentialFields.forEach(field => {
        initialCredentials[field.key] = '';
      });
      setCredentials(initialCredentials);
    }
    setLoading(false);
  }, [providerId]);

  useEffect(() => {
    // Cargar configuración existente
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/integrations/${providerId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.isConfigured) {
            setIsConfigured(true);
            setEnabled(data.enabled);
            // Las credenciales no se devuelven por seguridad, mostrar placeholders
          }
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    if (status === 'authenticated' && providerId) {
      loadConfig();
    }
  }, [status, providerId]);

  const handleSave = async () => {
    if (!provider) return;

    // Validar campos requeridos
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
        body: JSON.stringify({ credentials, enabled }),
      });

      if (response.ok) {
        toast.success('Configuración guardada correctamente');
        setIsConfigured(true);
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

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch(`/api/integrations/${providerId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials }),
      });

      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast.success('Conexión verificada correctamente');
      } else {
        toast.error(result.message || 'Error al verificar conexión');
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error de red' });
      toast.error('Error al probar la conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta integración?')) return;

    try {
      const response = await fetch(`/api/integrations/${providerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Integración eliminada');
        router.push('/dashboard/integrations');
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar la integración');
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
      <div className="p-8 max-w-4xl mx-auto">
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
          Volver a Integraciones
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/integrations">Integraciones</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{provider.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/integrations')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4">
        {provider.logo ? (
          <img src={provider.logo} alt={provider.name} className="h-12 w-12 object-contain" />
        ) : (
          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Settings className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{provider.name}</h1>
            {isConfigured && (
              <Badge className={enabled ? 'bg-green-500' : 'bg-gray-400'}>
                {enabled ? 'Activo' : 'Inactivo'}
              </Badge>
            )}
            {provider.status === 'beta' && <Badge variant="outline">BETA</Badge>}
          </div>
          <p className="text-muted-foreground">{provider.description}</p>
        </div>
      </div>

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

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciales</CardTitle>
          <CardDescription>
            Introduce las credenciales de tu cuenta de {provider.name}
            {provider.website && (
              <>
                . Obtén tus claves en{' '}
                <a
                  href={provider.website}
                  target="_blank"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {provider.website.replace('https://', '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credential Fields */}
          {provider.credentialFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>
                {field.label} {field.required && '*'}
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

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Activar integración</Label>
              <p className="text-xs text-muted-foreground">
                Habilita o deshabilita esta integración
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Probar Conexión
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
            {isConfigured && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Fields (if any) */}
      {provider.settingsFields && provider.settingsFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {provider.settingsFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`setting-${field.key}`}>{field.label}</Label>
                {field.type === 'boolean' ? (
                  <Switch
                    id={`setting-${field.key}`}
                    defaultChecked={field.defaultValue}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={`setting-${field.key}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={field.defaultValue}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`setting-${field.key}`}
                    type={field.type}
                    defaultValue={field.defaultValue}
                  />
                )}
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Documentation Link */}
      {provider.website && (
        <Card>
          <CardContent className="pt-6">
            <a
              href={provider.website}
              target="_blank"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Ver documentación de {provider.name}
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
