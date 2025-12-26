/**
 * Componente de Configuración de MFA (Multi-Factor Authentication)
 * Permite a los usuarios habilitar, deshabilitar y gestionar MFA
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, CheckCircle2, Copy, Download, AlertTriangle, RefreshCw, X } from 'lucide-react';
import Image from 'next/image';

interface MFAStatus {
  enabled: boolean;
  verifiedAt: Date | null;
  recoveryCodesRemaining: number;
}

interface MFASetupData {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export function MFASetup() {
  const [loading, setLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      const response = await fetch('/api/auth/mfa/status');
      if (response.ok) {
        const data = await response.json();
        setMfaStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error);
    }
  };

  const startSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data.data);
        setShowSetup(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al iniciar configuración MFA');
      }
    } catch (error) {
      toast.error('Error al iniciar configuración MFA');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || !setupData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode,
          secret: setupData.secret,
          backupCodes: setupData.backupCodes,
        }),
      });

      if (response.ok) {
        toast.success('MFA activado correctamente');
        setShowSetup(false);
        setShowBackupCodes(true);
        await fetchMFAStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Código inválido');
      }
    } catch (error) {
      toast.error('Error al verificar código');
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!disableCode) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      });

      if (response.ok) {
        toast.success('MFA deshabilitado');
        setShowDisable(false);
        setDisableCode('');
        await fetchMFAStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Código inválido');
      }
    } catch (error) {
      toast.error('Error al deshabilitar MFA');
    } finally {
      setLoading(false);
    }
  };

  const regenerateCodes = async () => {
    const code = prompt('Ingresa tu código MFA actual para regenerar los códigos de respaldo:');
    if (!code) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/regenerate-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData((prev) => (prev ? { ...prev, backupCodes: data.data.backupCodes } : null));
        setShowBackupCodes(true);
        toast.success('Códigos regenerados correctamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al regenerar códigos');
      }
    } catch (error) {
      toast.error('Error al regenerar códigos');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const text = `INMOVA - Códigos de Respaldo MFA\n\nGuarda estos códigos en un lugar seguro.\nCada código sólo puede usarse una vez.\n\n${setupData.backupCodes.join('\n')}\n\nFecha de generación: ${new Date().toLocaleString()}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inmova-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Códigos descargados');
  };

  if (!mfaStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticación de Dos Factores (MFA)
          </CardTitle>
          <CardDescription>Cargando estado de seguridad...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Autenticación de Dos Factores (MFA)
              </CardTitle>
              <CardDescription className="mt-2">
                Agrega una capa adicional de seguridad a tu cuenta
              </CardDescription>
            </div>
            {mfaStatus.enabled && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Activado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mfaStatus.enabled ? (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Tu cuenta no tiene MFA habilitado. Habilita la autenticación de dos factores para
                  proteger mejor tu cuenta.
                </AlertDescription>
              </Alert>
              <Button onClick={startSetup} disabled={loading}>
                <Shield className="h-4 w-4 mr-2" />
                Habilitar MFA
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  MFA está activo desde{' '}
                  {mfaStatus.verifiedAt
                    ? new Date(mfaStatus.verifiedAt).toLocaleDateString()
                    : 'fecha desconocida'}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={regenerateCodes} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar Códigos ({mfaStatus.recoveryCodesRemaining} restantes)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisable(true)}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Deshabilitar MFA
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Configuración MFA */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Autenticación de Dos Factores</DialogTitle>
            <DialogDescription>Sigue estos pasos para habilitar MFA en tu cuenta</DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-6">
              {/* Paso 1: Escanear QR */}
              <div className="space-y-3">
                <h3 className="font-semibold">Paso 1: Escanea el código QR</h3>
                <p className="text-sm text-muted-foreground">
                  Usa una aplicación autenticadora como Google Authenticator, Authy, o Microsoft
                  Authenticator
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <Image
                    src={setupData.qrCode}
                    alt="QR Code MFA"
                    width={200}
                    height={200}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded">
                  <code className="flex-1 text-xs">{setupData.secret}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Paso 2: Verificar */}
              <div className="space-y-3">
                <h3 className="font-semibold">Paso 2: Ingresa el código de verificación</h3>
                <p className="text-sm text-muted-foreground">
                  Introduce el código de 6 dígitos que aparece en tu aplicación
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                  <Button
                    onClick={verifyAndEnable}
                    disabled={loading || verificationCode.length !== 6}
                  >
                    Verificar
                  </Button>
                </div>
              </div>

              {/* Códigos de Respaldo */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Después de activar MFA, recibirás 10 códigos de respaldo. Guárdalos en un lugar
                  seguro.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Códigos de Respaldo */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Códigos de Respaldo Generados!</DialogTitle>
            <DialogDescription>
              Guarda estos códigos en un lugar seguro. Cada código sólo puede usarse una vez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Si pierdes el acceso a tu aplicación autenticadora, usa estos códigos para iniciar
                sesión.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {setupData?.backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="font-mono text-sm p-2 bg-background rounded text-center"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setupData && copyToClipboard(setupData.backupCodes.join('\n'))}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Todos
              </Button>
              <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Deshabilitar MFA */}
      <Dialog open={showDisable} onOpenChange={setShowDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deshabilitar Autenticación de Dos Factores</DialogTitle>
            <DialogDescription>Ingresa tu código MFA actual para confirmar</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Deshabilitar MFA reducirá la seguridad de tu cuenta. Solo hazlo si es absolutamente
                necesario.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Código de verificación</Label>
              <Input
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDisable(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={disableMFA}
                disabled={loading || disableCode.length !== 6}
                className="flex-1"
              >
                Deshabilitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
