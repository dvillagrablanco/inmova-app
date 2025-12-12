'use client';
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Lock, User, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';


interface OwnerSettings {
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
  notificarPagos: boolean;
  notificarOcupacion: boolean;
  notificarMantenimiento: boolean;
  notificarVencimientos: boolean;
  idioma: string;
  zona: string;
}

export default function ConfiguracionOwnerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<OwnerSettings | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const ownerId = localStorage.getItem('ownerId');
      const response = await fetch('/api/portal-propietario/settings', {
        headers: {
          'x-owner-id': ownerId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error('Error al cargar la configuración');
      }
    } catch (error) {
      logger.error('Error fetching settings:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (newPassword && newPassword !== confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      if (newPassword && !currentPassword) {
        toast.error('Debes ingresar tu contraseña actual');
        return;
      }

      const ownerId = localStorage.getItem('ownerId');
      const response = await fetch('/api/portal-propietario/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-id': ownerId || '',
        },
        body: JSON.stringify({
          ...settings,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/portal-propietario')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">Gestiona tu perfil y preferencias</p>
          </div>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Información Personal</CardTitle>
            </div>
            <CardDescription>Actualiza tu información de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreCompleto">Nombre Completo</Label>
                <Input
                  id="nombreCompleto"
                  value={settings.nombreCompleto}
                  onChange={(e) => setSettings({ ...settings, nombreCompleto: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={settings.telefono}
                  onChange={(e) => setSettings({ ...settings, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={settings.direccion}
                  onChange={(e) => setSettings({ ...settings, direccion: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>Preferencias de Notificación</CardTitle>
            </div>
            <CardDescription>Elige qué notificaciones deseas recibir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificarPagos" className="cursor-pointer">
                    Notificaciones de Pagos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe alertas sobre pagos recibidos y pendientes
                  </p>
                </div>
                <Switch
                  id="notificarPagos"
                  checked={settings.notificarPagos}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notificarPagos: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificarOcupacion" className="cursor-pointer">
                    Notificaciones de Ocupación
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe alertas sobre cambios en la ocupación de propiedades
                  </p>
                </div>
                <Switch
                  id="notificarOcupacion"
                  checked={settings.notificarOcupacion}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notificarOcupacion: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificarMantenimiento" className="cursor-pointer">
                    Notificaciones de Mantenimiento
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe alertas sobre solicitudes y trabajos de mantenimiento
                  </p>
                </div>
                <Switch
                  id="notificarMantenimiento"
                  checked={settings.notificarMantenimiento}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notificarMantenimiento: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificarVencimientos" className="cursor-pointer">
                    Notificaciones de Vencimientos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe alertas sobre contratos próximos a vencer
                  </p>
                </div>
                <Switch
                  id="notificarVencimientos"
                  checked={settings.notificarVencimientos}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notificarVencimientos: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <CardTitle>Configuración Regional</CardTitle>
            </div>
            <CardDescription>Personaliza el idioma y zona horaria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idioma">Idioma</Label>
                <Select
                  value={settings.idioma}
                  onValueChange={(value) => setSettings({ ...settings, idioma: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ca">Català</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zona">Zona Horaria</Label>
                <Select
                  value={settings.zona || 'Europe/Madrid'}
                  onValueChange={(value) => setSettings({ ...settings, zona: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles (GMT-8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <CardTitle>Cambiar Contraseña</CardTitle>
            </div>
            <CardDescription>Actualiza tu contraseña para mayor seguridad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push('/portal-propietario')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
