/**
 * Marketplace de Integraciones
 * Dashboard > Integraciones
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle2, AlertCircle, Settings, ExternalLink, Key } from 'lucide-react';
import { INTEGRATION_PROVIDERS } from '@/lib/integration-manager';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredProviders = INTEGRATION_PROVIDERS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'payment', label: 'Pagos' },
    { value: 'communication', label: 'Comunicación' },
    { value: 'accounting', label: 'Contabilidad' },
    { value: 'channel_manager', label: 'Channel Managers' },
    { value: 'signature', label: 'Firma Digital' },
    { value: 'automation', label: 'Automatización' },
    { value: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔌 Integraciones</h1>
        <p className="text-gray-600 mb-6">
          Conecta Inmova con tus herramientas favoritas para automatizar tu trabajo
        </p>

        {/* Link a API Keys */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/dashboard/integrations/api-keys')}
          >
            <Key className="h-4 w-4 mr-2" />
            Gestionar API Keys
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('https://developers.inmovaapp.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Documentación API
          </Button>
        </div>

        {/* Búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar integraciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de integraciones */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando integraciones...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProviders.map((provider) => {
            const config = integrations.find((i) => i.provider === provider.id);
            const isConfigured = config?.isConfigured;
            const isEnabled = config?.enabled;

            return (
              <Card
                key={provider.id}
                className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                {/* Logo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {provider.logo ? (
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <Settings className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  {provider.status === 'beta' && <Badge variant="outline">BETA</Badge>}
                  {provider.status === 'coming_soon' && (
                    <Badge variant="secondary">PRÓXIMAMENTE</Badge>
                  )}
                </div>

                {/* Nombre y descripción */}
                <h3 className="font-bold text-lg mb-2">{provider.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{provider.description}</p>

                {/* Estado */}
                <div className="flex items-center gap-2 mb-4">
                  {isEnabled ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Activo</span>
                    </>
                  ) : isConfigured ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600 font-medium">Inactivo</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">No configurado</span>
                  )}
                </div>

                {/* Acciones */}
                {provider.status === 'coming_soon' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Próximamente
                  </Button>
                ) : isConfigured ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      (window.location.href = `/dashboard/integrations/${provider.id}`)
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() =>
                      (window.location.href = `/dashboard/integrations/${provider.id}/setup`)
                    }
                  >
                    Activar
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron integraciones con esos filtros</p>
        </div>
      )}
    </div>
  );
}
