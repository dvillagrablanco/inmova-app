/**
 * Componente de Configuración de MFA
 * Multi-Factor Authentication para Super Admins
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Check, X, AlertTriangle, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface MFAStatus {
  mfaEnabled: boolean;
  mfaVerifiedAt: string | null;
  backupCodesRemaining: number;
  canEnableMFA: boolean;
}

interface MFASetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export default function MFASettings() {
  const { data: session } = useSession() || {};
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<MFASetup | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [password, setPassword] = useState('');
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  // Fetch MFA status
  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/mfa/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error);
      toast.error('Error al cargar configuración MFA');
    } finally {
      setLoading(false);
    }
  }

  // Habilitar MFA - Paso 1: Generar QR y backup codes
  async function handleEnableMFA() {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Error al generar códigos MFA');
        return;
      }

      setSetupData(data);
      setShowEnableDialog(true);
      toast.success('Códigos generados. Escanea el QR con tu aplicación');
    } catch (error) {
      console.error('Error enabling MFA:', error);
      toast.error('Error al habilitar MFA');
    } finally {
      setLoading(false);
    }
  }

  // Verificar código y activar MFA - Paso 2
  async function handleVerifyAndActivate() {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Ingresa un código de 6 dígitos');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Código incorrecto');
        return;
      }

      toast.success('¡MFA activado correctamente!');
      setShowEnableDialog(false);
      setVerifyCode('');
      setSetupData(null);
      fetchStatus();
    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast.error('Error al verificar código');
    } finally {
      setLoading(false);
    }
  }

  // Desactivar MFA
  async function handleDisableMFA() {
    if (!password) {
      toast.error('Ingresa tu password para confirmar');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Error al desactivar MFA');
        return;
      }

      toast.success('MFA desactivado');
      setShowDisableDialog(false);
      setPassword('');
      fetchStatus();
    } catch (error) {
      console.error('Error disabling MFA:', error);
      toast.error('Error al desactivar MFA');
    } finally {
      setLoading(false);
    }
  }

  // Regenerar backup codes
  async function handleRegenerateBackupCodes() {
    if (!password) {
      toast.error('Ingresa tu password para confirmar');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/mfa/regenerate-backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Error al regenerar códigos');
        return;
      }

      setNewBackupCodes(data.backupCodes);
      setShowBackupCodesDialog(false);
      setPassword('');
      toast.success('Códigos regenerados. Guárdalos en un lugar seguro');
      fetchStatus();
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      toast.error('Error al regenerar códigos');
    } finally {
      setLoading(false);
    }
  }

  // Copiar códigos al clipboard
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  }

  // Descargar backup codes como TXT
  function downloadBackupCodes(codes: string[]) {
    const content = `INMOVA - Códigos de Backup MFA\n\nFecha: ${new Date().toLocaleString()}\nUsuario: ${session?.user?.email}\n\nCÓDIGOS (usar solo una vez cada uno):\n${codes.join('\n')}\n\n¡IMPORTANTE!\n- Guarda estos códigos en un lugar seguro\n- Cada código solo se puede usar una vez\n- Genera nuevos códigos si los pierdes\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inmova-mfa-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Códigos descargados');
  }

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autenticación de Dos Factores (MFA)</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!status?.canEnableMFA) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autenticación de Dos Factores (MFA)</CardTitle>
          <CardDescription>
            Esta funcionalidad solo está disponible para Super Administradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tu rol actual no tiene permisos para configurar MFA.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticación de Dos Factores (MFA)
          </CardTitle>
          <CardDescription>
            Añade una capa extra de seguridad a tu cuenta con códigos temporales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado actual */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">
                Estado:{' '}
                {status?.mfaEnabled ? (
                  <span className="text-green-600 inline-flex items-center gap-1">
                    <Check className="h-4 w-4" /> Habilitado
                  </span>
                ) : (
                  <span className="text-gray-500 inline-flex items-center gap-1">
                    <X className="h-4 w-4" /> Deshabilitado
                  </span>
                )}
              </p>
              {status?.mfaEnabled && (
                <p className="text-sm text-gray-500 mt-1">
                  Códigos de backup restantes: {status.backupCodesRemaining}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!status?.mfaEnabled ? (
                <Button onClick={handleEnableMFA} disabled={loading}>
                  Habilitar MFA
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowBackupCodesDialog(true)}
                    disabled={loading}
                  >
                    Regenerar Códigos
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDisableDialog(true)}
                    disabled={loading}
                  >
                    Desactivar MFA
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Información */}
          <Alert>
            <AlertDescription>
              <strong>Aplicaciones recomendadas:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Google Authenticator (iOS/Android)</li>
                <li>Microsoft Authenticator (iOS/Android)</li>
                <li>Authy (iOS/Android/Desktop)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Dialog: Habilitar MFA */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Autenticación de Dos Factores</DialogTitle>
            <DialogDescription>Sigue los pasos para habilitar MFA en tu cuenta</DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-6">
              {/* Paso 1: Escanear QR */}
              <div>
                <h4 className="font-medium mb-2">Paso 1: Escanea el código QR</h4>
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <div className="relative w-64 h-64">
                    <Image
                      src={setupData.qrCode}
                      alt="QR Code MFA"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Abre tu aplicación de autenticación y escanea este código
                </p>
              </div>

              {/* Clave manual */}
              <div>
                <Label>O ingresa la clave manualmente:</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={setupData.secret} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Paso 2: Verificar */}
              <div>
                <h4 className="font-medium mb-2">Paso 2: Verifica el código</h4>
                <Label htmlFor="verify-code">Código de 6 dígitos</Label>
                <Input
                  id="verify-code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  placeholder="123456"
                  className="font-mono text-lg text-center mt-1"
                />
              </div>

              {/* Backup Codes */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Códigos de Backup
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Guarda estos códigos en un lugar seguro. Los necesitarás si pierdes acceso a tu
                  aplicación de autenticación.
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded font-mono text-sm">
                  {setupData.backupCodes.map((code, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span>{code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadBackupCodes(setupData.backupCodes)}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Códigos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Todos
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEnableDialog(false);
                setVerifyCode('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleVerifyAndActivate} disabled={loading || verifyCode.length !== 6}>
              Activar MFA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Desactivar MFA */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar MFA</DialogTitle>
            <DialogDescription>
              Ingresa tu password para confirmar la desactivación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Tu cuenta será menos segura sin MFA</AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="password-disable">Password</Label>
              <Input
                id="password-disable"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu password"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false);
                setPassword('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMFA}
              disabled={loading || !password}
            >
              Desactivar MFA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Regenerar Backup Codes */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerar Códigos de Backup</DialogTitle>
            <DialogDescription>Los códigos anteriores dejarán de funcionar</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Al regenerar los códigos, todos los códigos anteriores quedarán inválidos.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="password-regenerate">Password</Label>
              <Input
                id="password-regenerate"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu password"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBackupCodesDialog(false);
                setPassword('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleRegenerateBackupCodes} disabled={loading || !password}>
              Regenerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Mostrar nuevos backup codes */}
      {newBackupCodes.length > 0 && (
        <Dialog open={true} onOpenChange={() => setNewBackupCodes([])}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevos Códigos de Backup</DialogTitle>
              <DialogDescription>
                Guárdalos en un lugar seguro. No se mostrarán de nuevo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 p-3 bg-gray-50 rounded font-mono text-sm">
                {newBackupCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{code}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadBackupCodes(newBackupCodes)}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newBackupCodes.join('\n'))}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Todos
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setNewBackupCodes([])}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
