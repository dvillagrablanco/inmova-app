/**
 * CENTRO DE CONTROL DE INTEGRACIONES
 * Dashboard para gestionar todas las integraciones externas
 * Cada empresa puede configurar sus propias credenciales
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Zap,
  TrendingUp,
  Shield,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronRight,
  Activity,
  CreditCard,
  MessageSquare,
  Home,
  Calculator,
  Share2,
  FileSignature,
  Building2,
  BarChart3,
  Database,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Integration {
  id: string;
  provider: string;
  name: string;
  category: string;
  enabled: boolean;
  isConfigured: boolean;
  lastSyncAt: Date | null;
  lastTestAt: Date | null;
  testStatus: string | null;
  providerInfo: any;
}

interface Provider {
  id: string;
  name: string;
  category: string;
  description: string;
  logo?: string;
  website?: string;
  status: 'active' | 'beta' | 'coming_soon';
  isPremium?: boolean;
  credentialFields: any[];
}

// Iconos y colores por categoría
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  payment: { icon: CreditCard, color: 'text-green-600', bgColor: 'bg-green-100' },
  communication: { icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  channel_manager: { icon: Home, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  accounting: { icon: Calculator, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  social_media: { icon: Share2, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  signature: { icon: FileSignature, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  banking: { icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  analytics: { icon: BarChart3, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  storage: { icon: Database, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'categories'>('categories');

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [integrationsRes, catalogRes] = await Promise.all([
        fetch('/api/integrations'),
        fetch('/api/integrations/catalog'),
      ]);

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(data.data || []);
      }

      if (catalogRes.ok) {
        const data = await catalogRes.json();
        setCatalog(data.data);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredProviders = catalog?.providers?.filter((p: Provider) => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  }) || [];

  const filteredIntegrations = integrations.filter((i) => {
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      i.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.enabled).length,
    configured: integrations.filter(i => i.isConfigured).length,
    lastSync: integrations.filter(i => i.lastSyncAt).length,
  };

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleConfigureIntegration = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowConfigModal(true);
  };

  const handleSaveIntegration = async (credentials: any, settings: any) => {
    if (!selectedProvider) return;

    setConfiguring(true);
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider.id,
          credentials,
          settings,
        }),
      });

      if (response.ok) {
        await loadData();
        setShowConfigModal(false);
        setSelectedProvider(null);
      } else {
        alert('Error al guardar la integración');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la integración');
    } finally {
      setConfiguring(false);
    }
  };

  const handleToggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST',
      });

      const result = await response.json();
      
      alert(result.success ? '✅ Conexión exitosa' : '❌ ' + result.message);
      
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al probar la integración');
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta integración?')) return;

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Centro de Integraciones</h1>
            <p className="text-gray-600">Gestiona todas tus conexiones externas desde un solo lugar</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Integraciones</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Settings className="h-10 w-10 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activas</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Configuradas</p>
              <p className="text-3xl font-bold text-purple-600">{stats.configured}</p>
            </div>
            <Shield className="h-10 w-10 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sincronizadas</p>
              <p className="text-3xl font-bold text-orange-600">{stats.lastSync}</p>
            </div>
            <Activity className="h-10 w-10 text-orange-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Top Row: Tabs + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mis Integraciones ({integrations.length})
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'available'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Explorar ({catalog?.providers?.length || 0})
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar integraciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Pills - Solo visible en tab "Disponibles" */}
          {activeTab === 'available' && catalog && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({catalog.providers?.length || 0})
              </button>
              {Object.entries(catalog.categories).map(([key, label]: any) => {
                const count = catalog.groupedByCategory?.[key]?.length || 0;
                const config = CATEGORY_CONFIG[key] || { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-100' };
                const Icon = config.icon;
                
                return (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      categoryFilter === key
                        ? `${config.bgColor} ${config.color} shadow-md ring-2 ring-offset-1 ring-${config.color.split('-')[1]}-300`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'active' ? (
        <ActiveIntegrationsView
          integrations={filteredIntegrations}
          onToggle={handleToggleIntegration}
          onTest={handleTestIntegration}
          onDelete={handleDeleteIntegration}
          onReload={loadData}
        />
      ) : (
        <AvailableIntegrationsView
          providers={filteredProviders}
          configuredProviders={integrations.map(i => i.provider)}
          onConfigure={handleConfigureIntegration}
          catalog={catalog}
          categoryFilter={categoryFilter}
        />
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedProvider && (
        <ConfigurationModal
          provider={selectedProvider}
          onSave={handleSaveIntegration}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedProvider(null);
          }}
          loading={configuring}
        />
      )}
    </div>
  );
}

// ============================================================================
// ACTIVE INTEGRATIONS VIEW
// ============================================================================

function ActiveIntegrationsView({
  integrations,
  onToggle,
  onTest,
  onDelete,
  onReload,
}: {
  integrations: Integration[];
  onToggle: (id: string, enabled: boolean) => void;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
  onReload: () => void;
}) {
  if (integrations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes integraciones configuradas</h3>
        <p className="text-gray-600 mb-6">Comienza agregando tu primera integración</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <div
          key={integration.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{integration.category}</p>
              </div>
            </div>
            
            {/* Status Badge */}
            {integration.enabled ? (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <CheckCircle className="h-3 w-3" />
                Activa
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                <XCircle className="h-3 w-3" />
                Inactiva
              </span>
            )}
          </div>

          {/* Test Status */}
          {integration.lastTestAt && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Último test:</span>
                <span className={`font-medium ${
                  integration.testStatus === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {integration.testStatus === 'success' ? '✓ Exitoso' : '✗ Fallido'}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(integration.id, !integration.enabled)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                integration.enabled
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {integration.enabled ? 'Desactivar' : 'Activar'}
            </button>
            
            <button
              onClick={() => onTest(integration.id)}
              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              title="Probar conexión"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => onDelete(integration.id)}
              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// AVAILABLE INTEGRATIONS VIEW
// ============================================================================

function AvailableIntegrationsView({
  providers,
  configuredProviders,
  onConfigure,
  catalog,
  categoryFilter,
}: {
  providers: Provider[];
  configuredProviders: string[];
  onConfigure: (provider: Provider) => void;
  catalog: any;
  categoryFilter: string;
}) {
  // Si hay filtro de categoría específico, mostrar grid normal
  if (categoryFilter !== 'all') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <IntegrationCard
            key={provider.id}
            provider={provider}
            isConfigured={configuredProviders.includes(provider.id)}
            onConfigure={onConfigure}
          />
        ))}
      </div>
    );
  }

  // Mostrar por categorías
  return (
    <div className="space-y-8">
      {Object.entries(catalog.categories).map(([categoryKey, categoryLabel]: any) => {
        const categoryProviders = catalog.groupedByCategory?.[categoryKey] || [];
        
        if (categoryProviders.length === 0) return null;

        const config = CATEGORY_CONFIG[categoryKey] || { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-100' };
        const Icon = config.icon;

        return (
          <div key={categoryKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Category Header */}
            <div className={`${config.bgColor} px-6 py-4 border-b border-gray-200`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                  <Icon className={`h-6 w-6 ${config.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{categoryLabel}</h2>
                  <p className="text-sm text-gray-600">{categoryProviders.length} integraciones disponibles</p>
                </div>
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categoryProviders.map((provider: Provider) => (
                  <IntegrationCard
                    key={provider.id}
                    provider={provider}
                    isConfigured={configuredProviders.includes(provider.id)}
                    onConfigure={onConfigure}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// INTEGRATION CARD COMPONENT
// ============================================================================

function IntegrationCard({
  provider,
  isConfigured,
  onConfigure,
  compact = false,
}: {
  provider: Provider;
  isConfigured: boolean;
  onConfigure: (provider: Provider) => void;
  compact?: boolean;
}) {
  const config = CATEGORY_CONFIG[provider.category] || { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  const Icon = config.icon;

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all ${
        isConfigured ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
      } ${compact ? '' : 'shadow-sm'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 ${config.bgColor} rounded-lg`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{provider.name}</h3>
            {provider.status === 'beta' && (
              <span className="inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                BETA
              </span>
            )}
          </div>
        </div>

        {isConfigured && (
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
        )}
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{provider.description}</p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onConfigure(provider)}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isConfigured
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isConfigured ? 'Reconfigurar' : 'Configurar'}
        </button>
        
        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Más información"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONFIGURATION MODAL
// ============================================================================

function ConfigurationModal({
  provider,
  onSave,
  onClose,
  loading,
}: {
  provider: Provider;
  onSave: (credentials: any, settings: any) => void;
  loading: boolean;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(credentials, settings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Configurar {provider.name}</h2>
          <p className="text-gray-600 mt-1">{provider.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Credentials */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Credenciales</h3>
              <div className="space-y-4">
                {provider.credentialFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-600 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={credentials[field.key] || ''}
                        onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        {field.options?.map((opt: any) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={credentials[field.key] || ''}
                        onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    
                    {field.helpText && (
                      <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            {provider.settingsFields && provider.settingsFields.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h3>
                <div className="space-y-4">
                  {provider.settingsFields.map((field) => (
                    <div key={field.key}>
                      <label className="flex items-center gap-2">
                        {field.type === 'boolean' ? (
                          <>
                            <input
                              type="checkbox"
                              checked={settings[field.key] !== undefined ? settings[field.key] : field.defaultValue}
                              onChange={(e) => setSettings({ ...settings, [field.key]: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{field.label}</span>
                          </>
                        ) : (
                          <input
                            type={field.type}
                            value={settings[field.key] || field.defaultValue || ''}
                            onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                      </label>
                      {field.helpText && (
                        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
