'use client';

/**
 * COMPONENTE: Baja de Cuenta
 * Permite a los usuarios darse de baja de la aplicación
 */

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  UserX, 
  Info,
  ShieldAlert,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const DEACTIVATION_REASONS = [
  { value: 'not_using', label: 'Ya no uso la aplicación' },
  { value: 'too_expensive', label: 'Es muy caro para mí' },
  { value: 'found_alternative', label: 'Encontré otra alternativa' },
  { value: 'missing_features', label: 'Le faltan funciones que necesito' },
  { value: 'too_complicated', label: 'Es muy complicada de usar' },
  { value: 'temporary', label: 'Es temporal, volveré pronto' },
  { value: 'other', label: 'Otro motivo' },
];

interface DeactivationStatus {
  canDeactivate: boolean;
  isLastAdmin: boolean;
  isSuperAdmin: boolean;
  message: string | null;
}

export function AccountDeletion() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [status, setStatus] = useState<DeactivationStatus | null>(null);
  const [step, setStep] = useState<'info' | 'confirm' | 'password'>('info');

  useEffect(() => {
    checkDeactivationStatus();
  }, []);

  const checkDeactivationStatus = async () => {
    try {
      const response = await fetch('/api/user/deactivate');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Error al verificar el estado de la cuenta');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleDeactivate = async () => {
    if (!password) {
      toast.error('Introduce tu contraseña para confirmar');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          reason,
          feedback,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'LAST_ADMIN') {
          toast.error(data.error, {
            duration: 8000,
          });
        } else {
          toast.error(data.error || 'Error al procesar la baja');
        }
        return;
      }

      toast.success('Cuenta desactivada correctamente');
      
      // Cerrar sesión después de 2 segundos
      setTimeout(() => {
        signOut({ callbackUrl: '/login?deactivated=true' });
      }, 2000);
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error('Error al procesar la baja. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card className="border-gray-200">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
            <span className="ml-3 text-gray-600">Verificando estado de la cuenta...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información sobre la baja */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Info className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-orange-900">Información importante</CardTitle>
              <CardDescription className="text-orange-700">
                Antes de darte de baja, ten en cuenta lo siguiente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-orange-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Tu cuenta quedará desactivada pero tus datos se conservarán por seguridad</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Podrás reactivar tu cuenta contactando con soporte si cambias de opinión</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>Perderás acceso inmediato a todas las funciones de la plataforma</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>Las notificaciones y alertas se desactivarán</span>
          </div>
        </CardContent>
      </Card>

      {/* Estado de la cuenta */}
      {status && !status.canDeactivate && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">No puedes darte de baja en este momento</h3>
                <p className="text-sm text-red-700 mt-1">
                  {status.message || 'Contacta con soporte para más información.'}
                </p>
                {status.isLastAdmin && (
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Solución:</strong> Ve a Gestión de Usuarios y asigna el rol de administrador a otro usuario antes de darte de baja.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de baja */}
      {status?.canDeactivate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Darme de baja</CardTitle>
                  <CardDescription>
                    Esta acción desactivará tu cuenta de forma inmediata
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Motivo de baja */}
              <div className="space-y-2">
                <Label htmlFor="reason">¿Por qué te vas? (opcional)</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEACTIVATION_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Feedback adicional */}
              <div className="space-y-2">
                <Label htmlFor="feedback">¿Algo que podamos mejorar? (opcional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tu opinión nos ayuda a mejorar..."
                  rows={3}
                />
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowConfirmDialog(true)}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Solicitar baja de cuenta
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar baja de cuenta
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Esta acción <strong>desactivará tu cuenta inmediatamente</strong>. 
                  Serás desconectado y no podrás acceder hasta que contactes con soporte.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Introduce tu contraseña para confirmar
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setPassword('');
                setShowConfirmDialog(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeactivate();
              }}
              disabled={loading || !password}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Confirmar baja
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
