/**
 * Gestión de API Keys
 * Dashboard > Integraciones > API Keys
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Key,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKey, setNewKey] = useState<{
    key?: string;
    data?: any;
  } | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    try {
      const res = await fetch('/api/v1/api-keys');
      const data = await res.json();
      setApiKeys(data.data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Error cargando API keys');
    } finally {
      setLoading(false);
    }
  }

  async function createApiKey(formData: {
    name: string;
    description?: string;
    scopes: string[];
    rateLimit: number;
    expiresInDays?: number;
  }) {
    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error creando API key');
      }

      setNewKey({
        key: data.key,
        data: data.data,
      });

      loadApiKeys();
      toast.success('API key creada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error creando API key');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => (window.location.href = '/dashboard/integrations')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔑 API Keys</h1>
            <p className="text-gray-600">
              Gestiona las claves de API para acceder a Inmova programáticamente
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear API Key
          </Button>
        </div>
      </div>

      {/* Alerta de seguridad */}
      {newKey && (
        <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-2">
                ⚠️ Guarda esta clave de forma segura
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                Esta es la única vez que verás la clave completa. Guárdala en un lugar seguro.
              </p>

              <div className="bg-white p-4 rounded border border-yellow-300 mb-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono break-all">{newKey.key}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newKey.key!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={() => setNewKey(null)} variant="outline" size="sm">
                Entendido
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de API Keys */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <Card className="p-12 text-center">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No tienes API keys</h3>
          <p className="text-gray-600 mb-4">
            Crea una API key para empezar a usar la API de Inmova
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primera API Key
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{apiKey.name}</h3>
                    <Badge variant={apiKey.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {apiKey.status}
                    </Badge>
                  </div>

                  {apiKey.description && (
                    <p className="text-sm text-gray-600 mb-3">{apiKey.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <code className="font-mono">{apiKey.keyPrefix}...</code>
                    </div>
                    {apiKey.lastUsedAt && (
                      <div>Último uso: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</div>
                    )}
                    {apiKey.expiresAt && (
                      <div>Expira: {new Date(apiKey.expiresAt).toLocaleDateString()}</div>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      <strong>Scopes:</strong>{' '}
                      {apiKey.scopes.map((scope: string) => (
                        <Badge key={scope} variant="outline" className="ml-1">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Rate limit:</strong> {apiKey.rateLimit} req/min
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de crear API Key */}
      {showCreateDialog && (
        <CreateAPIKeyDialog onClose={() => setShowCreateDialog(false)} onCreate={createApiKey} />
      )}
    </div>
  );
}

function CreateAPIKeyDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scopes: ['properties:read', 'properties:write'],
    rateLimit: 1000,
    expiresInDays: 365,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate(formData);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Crear API Key</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Production API Key"
              required
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Para integración con..."
            />
          </div>

          <div>
            <Label>Rate Limit (requests/min)</Label>
            <Input
              type="number"
              value={formData.rateLimit}
              onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
              min={100}
              max={10000}
            />
          </div>

          <div>
            <Label>Expira en (días)</Label>
            <Input
              type="number"
              value={formData.expiresInDays}
              onChange={(e) =>
                setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })
              }
              min={1}
              max={3650}
            />
            <p className="text-sm text-gray-500 mt-1">
              365 días = 1 año. Dejarlo vacío = sin expiración.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Crear API Key
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
