'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Bell,
  FileText,
  CreditCard,
  Globe,
  Shield,
  Mail,
  MessageSquare,
  Smartphone,
  Check,
  Save,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// TIPOS
// ==========================================

interface NotificationSettings {
  contractExpiry: { enabled: boolean; daysBefore: number; channels: string[] };
  paymentReminder: { enabled: boolean; daysBefore: number; channels: string[] };
  checkIn: { enabled: boolean; hoursBefore: number; channels: string[] };
  checkOut: { enabled: boolean; hoursBefore: number; channels: string[] };
  renewal: { enabled: boolean; daysBefore: number; channels: string[] };
}

interface ContractSettings {
  defaultDuration: number;
  autoRenewal: boolean;
  maxRenewals: number;
  earlyTerminationPenalty: number;
  noticePeriod: number;
  depositMonths: number;
  utilityDeposit: number;
}

interface PortalSettings {
  spotahome: { enabled: boolean; autoSync: boolean; apiKey: string };
  housingAnywhere: { enabled: boolean; autoSync: boolean; apiKey: string };
  uniplaces: { enabled: boolean; autoSync: boolean; apiKey: string };
  idealista: { enabled: boolean; autoSync: boolean; apiKey: string };
}

interface PaymentSettings {
  stripeEnabled: boolean;
  autoCharge: boolean;
  chargeDay: number;
  gracePeriod: number;
  lateFee: number;
  autoInvoice: boolean;
}

// ==========================================
// ESTADO INICIAL
// ==========================================

const defaultNotifications: NotificationSettings = {
  contractExpiry: { enabled: true, daysBefore: 30, channels: ['email', 'push'] },
  paymentReminder: { enabled: true, daysBefore: 5, channels: ['email'] },
  checkIn: { enabled: true, hoursBefore: 24, channels: ['email', 'sms', 'push'] },
  checkOut: { enabled: true, hoursBefore: 48, channels: ['email', 'push'] },
  renewal: { enabled: true, daysBefore: 45, channels: ['email'] },
};

const defaultContract: ContractSettings = {
  defaultDuration: 6,
  autoRenewal: true,
  maxRenewals: 2,
  earlyTerminationPenalty: 30,
  noticePeriod: 30,
  depositMonths: 2,
  utilityDeposit: 200,
};

const defaultPortals: PortalSettings = {
  spotahome: { enabled: true, autoSync: true, apiKey: '' },
  housingAnywhere: { enabled: false, autoSync: false, apiKey: '' },
  uniplaces: { enabled: false, autoSync: false, apiKey: '' },
  idealista: { enabled: true, autoSync: true, apiKey: '' },
};

const defaultPayment: PaymentSettings = {
  stripeEnabled: true,
  autoCharge: true,
  chargeDay: 1,
  gracePeriod: 5,
  lateFee: 5,
  autoInvoice: true,
};

// ==========================================
// COMPONENTES
// ==========================================

function NotificationConfig({ 
  settings, 
  onChange 
}: { 
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
}) {
  const updateSetting = (key: keyof NotificationSettings, field: string, value: any) => {
    onChange({
      ...settings,
      [key]: {
        ...settings[key],
        [field]: value,
      },
    });
  };

  const toggleChannel = (key: keyof NotificationSettings, channel: string) => {
    const current = settings[key].channels;
    const updated = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    updateSetting(key, 'channels', updated);
  };

  const notificationTypes = [
    { key: 'contractExpiry' as const, label: 'Expiración de contrato', description: 'Aviso antes de que expire el contrato', unit: 'días antes' },
    { key: 'paymentReminder' as const, label: 'Recordatorio de pago', description: 'Aviso antes del vencimiento del pago', unit: 'días antes' },
    { key: 'checkIn' as const, label: 'Check-in', description: 'Aviso antes de la entrada del inquilino', unit: 'horas antes' },
    { key: 'checkOut' as const, label: 'Check-out', description: 'Aviso antes de la salida del inquilino', unit: 'horas antes' },
    { key: 'renewal' as const, label: 'Propuesta de renovación', description: 'Aviso para iniciar proceso de renovación', unit: 'días antes' },
  ];

  return (
    <div className="space-y-6">
      {notificationTypes.map(({ key, label, description, unit }) => (
        <Card key={key}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings[key].enabled}
                    onCheckedChange={(checked) => updateSetting(key, 'enabled', checked)}
                  />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>

                {settings[key].enabled && (
                  <div className="mt-4 ml-12 space-y-4">
                    <div className="flex items-center gap-3">
                      <Label>Enviar</Label>
                      <Input
                        type="number"
                        className="w-20"
                        value={key === 'checkIn' || key === 'checkOut' 
                          ? settings[key].hoursBefore 
                          : settings[key].daysBefore}
                        onChange={(e) => updateSetting(
                          key, 
                          key === 'checkIn' || key === 'checkOut' ? 'hoursBefore' : 'daysBefore',
                          parseInt(e.target.value)
                        )}
                      />
                      <span className="text-sm text-muted-foreground">{unit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="mr-2">Canales:</Label>
                      {['email', 'sms', 'push'].map((channel) => (
                        <Button
                          key={channel}
                          variant={settings[key].channels.includes(channel) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleChannel(key, channel)}
                        >
                          {channel === 'email' && <Mail className="h-4 w-4 mr-1" />}
                          {channel === 'sms' && <MessageSquare className="h-4 w-4 mr-1" />}
                          {channel === 'push' && <Smartphone className="h-4 w-4 mr-1" />}
                          {channel.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ContractConfig({ 
  settings, 
  onChange 
}: { 
  settings: ContractSettings;
  onChange: (settings: ContractSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Duración y Renovación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duración por defecto (meses)</Label>
              <Select
                value={settings.defaultDuration.toString()}
                onValueChange={(v) => onChange({ ...settings, defaultDuration: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => (
                    <SelectItem key={m} value={m.toString()}>{m} {m === 1 ? 'mes' : 'meses'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Máximo de renovaciones</Label>
              <Select
                value={settings.maxRenewals.toString()}
                onValueChange={(v) => onChange({ ...settings, maxRenewals: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Renovación automática</p>
              <p className="text-sm text-muted-foreground">
                Proponer renovación automáticamente al acercarse la expiración
              </p>
            </div>
            <Switch
              checked={settings.autoRenewal}
              onCheckedChange={(checked) => onChange({ ...settings, autoRenewal: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Penalizaciones y Plazos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Penalización por desistimiento (días de renta)</Label>
              <Input
                type="number"
                value={settings.earlyTerminationPenalty}
                onChange={(e) => onChange({ ...settings, earlyTerminationPenalty: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Se cobrará el equivalente a estos días de renta si el inquilino termina antes
              </p>
            </div>

            <div className="space-y-2">
              <Label>Días de preaviso requeridos</Label>
              <Input
                type="number"
                value={settings.noticePeriod}
                onChange={(e) => onChange({ ...settings, noticePeriod: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Depósitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fianza (mensualidades)</Label>
              <Select
                value={settings.depositMonths.toString()}
                onValueChange={(v) => onChange({ ...settings, depositMonths: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3].map((m) => (
                    <SelectItem key={m} value={m.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Depósito suministros (€)</Label>
              <Input
                type="number"
                value={settings.utilityDeposit}
                onChange={(e) => onChange({ ...settings, utilityDeposit: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PortalsConfig({ 
  settings, 
  onChange 
}: { 
  settings: PortalSettings;
  onChange: (settings: PortalSettings) => void;
}) {
  const portals = [
    { key: 'spotahome' as const, name: 'Spotahome', logo: '🏠', url: 'https://spotahome.com' },
    { key: 'housingAnywhere' as const, name: 'HousingAnywhere', logo: '🌍', url: 'https://housinganywhere.com' },
    { key: 'uniplaces' as const, name: 'Uniplaces', logo: '🎓', url: 'https://uniplaces.com' },
    { key: 'idealista' as const, name: 'Idealista', logo: '📍', url: 'https://idealista.com' },
  ];

  return (
    <div className="space-y-4">
      {portals.map(({ key, name, logo, url }) => (
        <Card key={key}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{logo}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{name}</p>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">Portal especializado en media estancia</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {settings[key].enabled && (
                  <Badge variant={settings[key].apiKey ? 'default' : 'secondary'}>
                    {settings[key].apiKey ? 'Conectado' : 'Sin configurar'}
                  </Badge>
                )}
                <Switch
                  checked={settings[key].enabled}
                  onCheckedChange={(checked) => onChange({
                    ...settings,
                    [key]: { ...settings[key], enabled: checked },
                  })}
                />
              </div>
            </div>

            {settings[key].enabled && (
              <div className="mt-4 ml-14 space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="Introduce tu API Key"
                    value={settings[key].apiKey}
                    onChange={(e) => onChange({
                      ...settings,
                      [key]: { ...settings[key], apiKey: e.target.value },
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Sincronización automática</p>
                    <p className="text-xs text-muted-foreground">
                      Actualizar disponibilidad y precios automáticamente
                    </p>
                  </div>
                  <Switch
                    checked={settings[key].autoSync}
                    onCheckedChange={(checked) => onChange({
                      ...settings,
                      [key]: { ...settings[key], autoSync: checked },
                    })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PaymentConfig({ 
  settings, 
  onChange 
}: { 
  settings: PaymentSettings;
  onChange: (settings: PaymentSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Integración Stripe</CardTitle>
          <CardDescription>Configuración de pagos recurrentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-2xl">💳</div>
              <div>
                <p className="font-medium">Stripe Payments</p>
                <p className="text-sm text-muted-foreground">Cobros con tarjeta y SEPA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={settings.stripeEnabled ? 'default' : 'secondary'}>
                {settings.stripeEnabled ? 'Activo' : 'Inactivo'}
              </Badge>
              <Switch
                checked={settings.stripeEnabled}
                onCheckedChange={(checked) => onChange({ ...settings, stripeEnabled: checked })}
              />
            </div>
          </div>

          {settings.stripeEnabled && (
            <>
              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cobro automático</p>
                  <p className="text-sm text-muted-foreground">
                    Cobrar automáticamente el día de vencimiento
                  </p>
                </div>
                <Switch
                  checked={settings.autoCharge}
                  onCheckedChange={(checked) => onChange({ ...settings, autoCharge: checked })}
                />
              </div>

              {settings.autoCharge && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Día de cobro</Label>
                    <Select
                      value={settings.chargeDay.toString()}
                      onValueChange={(v) => onChange({ ...settings, chargeDay: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                          <SelectItem key={d} value={d.toString()}>Día {d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Período de gracia (días)</Label>
                    <Input
                      type="number"
                      value={settings.gracePeriod}
                      onChange={(e) => onChange({ ...settings, gracePeriod: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Recargo por mora (%)</Label>
                    <Input
                      type="number"
                      value={settings.lateFee}
                      onChange={(e) => onChange({ ...settings, lateFee: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Facturación automática</p>
                  <p className="text-sm text-muted-foreground">
                    Generar y enviar facturas automáticamente
                  </p>
                </div>
                <Switch
                  checked={settings.autoInvoice}
                  onCheckedChange={(checked) => onChange({ ...settings, autoInvoice: checked })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function ConfiguracionPage() {
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [contract, setContract] = useState(defaultContract);
  const [portals, setPortals] = useState(defaultPortals);
  const [payment, setPayment] = useState(defaultPayment);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('Configuración guardada correctamente');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Personaliza el comportamiento del módulo de media estancia
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Contratos</span>
          </TabsTrigger>
          <TabsTrigger value="portals" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">Portales</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Pagos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones Automáticas</CardTitle>
              <CardDescription>
                Configura cuándo y cómo enviar notificaciones a propietarios e inquilinos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationConfig settings={notifications} onChange={setNotifications} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Contratos</CardTitle>
              <CardDescription>
                Valores por defecto para nuevos contratos de media estancia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractConfig settings={contract} onChange={setContract} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portals">
          <Card>
            <CardHeader>
              <CardTitle>Portales Inmobiliarios</CardTitle>
              <CardDescription>
                Conecta con portales especializados en alquiler temporal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortalsConfig settings={portals} onChange={setPortals} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pagos</CardTitle>
              <CardDescription>
                Configuración de cobros y facturación automática
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentConfig settings={payment} onChange={setPayment} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
