'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Webhook,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import toast from 'react-hot-toast';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  lastStatus: 'success' | 'failed' | 'pending';
  lastTriggered?: string;
}

const AVAILABLE_EVENTS = [
  { id: 'company.created', label: 'Empresa creada', category: 'Empresas' },
  { id: 'company.updated', label: 'Empresa actualizada', category: 'Empresas' },
  { id: 'user.created', label: 'Usuario creado', category: 'Usuarios' },
  { id: 'user.updated', label: 'Usuario actualizado', category: 'Usuarios' },
  { id: 'subscription.created', label: 'Suscripción creada', category: 'Pagos' },
  { id: 'subscription.cancelled', label: 'Suscripción cancelada', category: 'Pagos' },
  { id: 'payment.received', label: 'Pago recibido', category: 'Pagos' },
  { id: 'payment.failed', label: 'Pago fallido', category: 'Pagos' },
  { id: 'contract.created', label: 'Contrato creado', category: 'Contratos' },
  { id: 'contract.expired', label: 'Contrato vencido', category: 'Contratos' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      // En una implementación real, esto llamaría a una API
      // Por ahora, mostramos un estado inicial vacío
      setWebhooks([]);
    } catch (error) {
      toast.error('Error al cargar webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return 'whsec_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const webhook: WebhookConfig = {
        id: `wh_${Date.now()}`,
        ...newWebhook,
        secret: generateSecret(),
        active: true,
        lastStatus: 'pending',
      };
      
      setWebhooks([...webhooks, webhook]);
      setNewWebhook({ name: '', url: '', events: [] });
      setIsCreating(false);
      toast.success('Webhook creado correctamente');
    } catch (error) {
      toast.error('Error al crear webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      setWebhooks(webhooks.filter(w => w.id !== id));
      toast.success('Webhook eliminado');
    } catch (error) {
      toast.error('Error al eliminar webhook');
    }
  };

  const handleToggleActive = async (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ));
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    toast.loading('Enviando test...');
    // Simular envío de test
    setTimeout(() => {
      toast.dismiss();
      toast.success('Test enviado correctamente');
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const toggleEventSelection = (eventId: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
            <p className="text-muted-foreground">
              Configura endpoints para recibir eventos en tiempo real
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Webhook
          </Button>
        </div>

        {/* Create Webhook Form */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Webhook</CardTitle>
              <CardDescription>
                Define la URL y los eventos que deseas recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Mi webhook"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL del Endpoint</Label>
                  <Input
                    id="url"
                    placeholder="https://tu-servidor.com/webhook"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        newWebhook.events.includes(event.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleEventSelection(event.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{event.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {event.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateWebhook}>
                  Crear Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhooks List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Cargando webhooks...
            </CardContent>
          </Card>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay webhooks configurados</h3>
              <p className="text-muted-foreground mb-4">
                Configura un webhook para recibir eventos en tiempo real
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Webhook className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{webhook.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {webhook.url}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          {getStatusIcon(webhook.lastStatus)}
                          <Switch
                            checked={webhook.active}
                            onCheckedChange={() => handleToggleActive(webhook.id)}
                          />
                        </div>
                      </div>

                      {/* Secret */}
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Secret:</span>
                        <code className="text-sm font-mono flex-1">
                          {showSecrets[webhook.id]
                            ? webhook.secret
                            : '••••••••••••••••••••••••••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowSecrets({ ...showSecrets, [webhook.id]: !showSecrets[webhook.id] })}
                        >
                          {showSecrets[webhook.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(webhook.secret)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Events */}
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary">
                            {event}
                          </Badge>
                        ))}
                      </div>

                      {webhook.lastTriggered && (
                        <p className="text-xs text-muted-foreground">
                          Último envío: {new Date(webhook.lastTriggered).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Documentación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Verificación de Firma</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Cada webhook incluye un header <code className="bg-muted px-1 rounded">X-Inmova-Signature</code> 
                que puedes usar para verificar la autenticidad de la petición.
              </p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === 'sha256=' + expectedSignature;
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
