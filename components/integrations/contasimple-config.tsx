/**
 * Componente: Configuración de Contasimple
 * 
 * Permite a los clientes conectar su cuenta de Contasimple para:
 * - Sincronizar su contabilidad automáticamente
 * - Crear facturas, gastos y registrar pagos
 * - Gestionar clientes y proveedores
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ContasimpleConfig {
  enabled: boolean;
  configured: boolean;
  authKeyMasked: string | null;
}

export function ContasimpleConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<ContasimpleConfig | null>(null);
  
  const [authKey, setAuthKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Cargar configuración actual
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/contasimple/config');
      
      if (!response.ok) {
        throw new Error('Error cargando configuración');
      }

      const data = await response.json();
      setConfig(data);
      setEnabled(data.enabled);
    } catch (error: any) {
      toast.error('Error cargando configuración de Contasimple');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Probar credenciales
  const testConnection = async () => {
    if (!authKey || authKey.length < 10) {
      toast.error('Introduce una Auth Key válida');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/integrations/contasimple/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult('success');
        toast.success('✅ Credenciales válidas');
      } else {
        setTestResult('error');
        toast.error(data.error || 'Credenciales inválidas');
      }
    } catch (error: any) {
      setTestResult('error');
      toast.error('Error probando conexión');
      console.error(error);
    } finally {
      setTesting(false);
    }
  };

  // Guardar configuración
  const saveConfig = async () => {
    if (!authKey || authKey.length < 10) {
      toast.error('Introduce una Auth Key válida');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/integrations/contasimple/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authKey,
          enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Error guardando configuración');
      }

      toast.success('✅ Configuración guardada correctamente');
      
      // Recargar configuración
      await loadConfig();
      setAuthKey(''); // Limpiar campo por seguridad
      setTestResult(null);
    } catch (error: any) {
      toast.error('Error guardando configuración');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar integración
  const deleteConfig = async () => {
    if (!confirm('¿Seguro que quieres eliminar la integración de Contasimple?')) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/integrations/contasimple/config', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error eliminando integración');
      }

      toast.success('Integración eliminada');
      await loadConfig();
      setAuthKey('');
      setEnabled(false);
      setTestResult(null);
    } catch (error: any) {
      toast.error('Error eliminando integración');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contasimple</CardTitle>
            <CardDescription>
              Sincroniza tu contabilidad automáticamente con Contasimple
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="contasimple-enabled">Activado</Label>
            <Switch
              id="contasimple-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estado actual */}
        {config?.configured && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Contasimple está configurado. Auth Key: {config.authKeyMasked}
            </AlertDescription>
          </Alert>
        )}

        {/* Información */}
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>¿Cómo obtener tu Auth Key?</strong>
            <ol className="mt-2 ml-4 list-decimal text-sm space-y-1">
              <li>Inicia sesión en tu cuenta de Contasimple</li>
              <li>Ve a Configuración → API</li>
              <li>Genera una nueva Auth Key</li>
              <li>Copia y pega la clave aquí</li>
            </ol>
            <a
              href="https://www.contasimple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
            >
              Ir a Contasimple
              <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        {/* Formulario */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="auth-key">Auth Key de Contasimple</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="auth-key"
                type="password"
                placeholder="Pega aquí tu Auth Key"
                value={authKey}
                onChange={(e) => setAuthKey(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={testing || !authKey}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Probando...
                  </>
                ) : (
                  'Probar'
                )}
              </Button>
            </div>
            
            {/* Resultado del test */}
            {testResult === 'success' && (
              <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                <Check className="h-4 w-4" />
                Credenciales válidas
              </p>
            )}
            {testResult === 'error' && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                <X className="h-4 w-4" />
                Credenciales inválidas
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Funcionalidades</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Sincronización automática de facturas</li>
            <li>Registro de gastos e ingresos</li>
            <li>Gestión de clientes y proveedores</li>
            <li>Informes contables en tiempo real</li>
            <li>Cumplimiento fiscal automático</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>
          {config?.configured && (
            <Button
              variant="destructive"
              onClick={deleteConfig}
              disabled={saving}
            >
              Eliminar integración
            </Button>
          )}
        </div>
        <Button
          onClick={saveConfig}
          disabled={saving || !authKey || testResult !== 'success'}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar configuración'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
