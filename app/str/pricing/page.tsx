'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  Settings,
  Star,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';

interface PricingSuggestion {
  listingId: string;
  listingName: string;
  currentPrice: number;
  suggestedPrice: number;
  change: number;
  changePercent: number;
  reason: string;
  confidence: number;
  factors: Array<{
    name: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

interface MarketData {
  date: string;
  myPrice: number;
  avgMarketPrice: number;
  occupancy: number;
}

export default function STRPricingPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<PricingSuggestion[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [autoPricingEnabled, setAutoPricingEnabled] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30); // días

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadPricingData();
    }
  }, [status, router, selectedPeriod]);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      const [suggestionsRes, marketRes, settingsRes] = await Promise.all([
        fetch('/api/str/pricing/suggestions'),
        fetch(`/api/str/pricing/market-data?period=${selectedPeriod}`),
        fetch('/api/str/pricing/settings'),
      ]);

      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestions(data);
      }

      if (marketRes.ok) {
        const data = await marketRes.json();
        setMarketData(data);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setAutoPricingEnabled(data.autoPricingEnabled || false);
      }
    } catch (error) {
      logger.error('Error loading pricing data:', error);
      toast.error('Error al cargar datos de pricing');
    } finally {
      setLoading(false);
    }
  };

  const applyPricing = async (listingId: string, newPrice: number) => {
    try {
      const response = await fetch('/api/str/pricing/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, price: newPrice }),
      });

      if (response.ok) {
        toast.success('Precio actualizado correctamente');
        loadPricingData();
      } else {
        toast.error('Error al actualizar precio');
      }
    } catch (error) {
      logger.error('Error applying pricing:', error);
      toast.error('Error al actualizar precio');
    }
  };

  const toggleAutoPricing = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/str/pricing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPricingEnabled: enabled }),
      });

      if (response.ok) {
        setAutoPricingEnabled(enabled);
        toast.success(enabled ? 'Pricing automático activado' : 'Pricing automático desactivado');
      } else {
        toast.error('Error al cambiar configuración');
      }
    } catch (error) {
      logger.error('Error toggling auto pricing:', error);
      toast.error('Error al cambiar configuración');
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge className="bg-green-500">Alta confianza</Badge>;
    if (confidence >= 60) return <Badge className="bg-yellow-500">Confianza media</Badge>;
    return <Badge variant="secondary">Baja confianza</Badge>;
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'text-red-600';
    if (impact === 'medium') return 'text-yellow-600';
    return 'text-blue-600';
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Cargando pricing dinámico...</p>
              </div>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pricing Dinámico IA
                </h1>
                <p className="text-muted-foreground mt-2">
                  Optimiza tus precios automáticamente para maximizar ingresos
                </p>
              </div>
              <Card className="w-full sm:w-auto">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div>
                    <Label htmlFor="auto-pricing" className="font-semibold">
                      Pricing Automático
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Ajuste diario de precios
                    </p>
                  </div>
                  <Switch
                    id="auto-pricing"
                    checked={autoPricingEnabled}
                    onCheckedChange={toggleAutoPricing}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Info Banner */}
            {autoPricingEnabled && (
              <Card className="border-l-4 border-l-green-500 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Pricing automático activado</p>
                      <p className="text-sm text-green-700">
                        Los precios se actualizarán automáticamente cada día a las 2:00 AM según las recomendaciones de la IA
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="suggestions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="suggestions">Recomendaciones</TabsTrigger>
                <TabsTrigger value="market">Análisis de Mercado</TabsTrigger>
                <TabsTrigger value="settings">Configuración</TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.listingId} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{suggestion.listingName}</CardTitle>
                          <CardDescription className="mt-1">{suggestion.reason}</CardDescription>
                        </div>
                        {getConfidenceBadge(suggestion.confidence)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Precio Actual</p>
                          <p className="text-2xl font-bold">€{suggestion.currentPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Precio Sugerido</p>
                          <p className="text-2xl font-bold text-blue-600">€{suggestion.suggestedPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cambio</p>
                          <div className="flex items-center gap-2">
                            {getChangeIcon(suggestion.change)}
                            <p className={`text-2xl font-bold ${getChangeColor(suggestion.change)}`}>
                              {suggestion.change > 0 ? '+' : ''}€{suggestion.change}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Porcentaje</p>
                          <p className={`text-2xl font-bold ${getChangeColor(suggestion.changePercent)}`}>
                            {suggestion.changePercent > 0 ? '+' : ''}
                            {suggestion.changePercent}%
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Factores Considerados</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {suggestion.factors.map((factor, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                factor.impact === 'high' ? 'bg-red-500' :
                                factor.impact === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${getImpactColor(factor.impact)}`}>
                                  {factor.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{factor.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          onClick={() => applyPricing(suggestion.listingId, suggestion.suggestedPrice)}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Aplicar Precio Sugerido
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/str/listings/${suggestion.listingId}`)}>
                          Ver Anuncio
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {suggestions.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No hay recomendaciones disponibles</h3>
                      <p className="text-sm text-muted-foreground">
                        Los precios actuales están optimizados
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="market" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Comparativa de Precios vs Mercado</CardTitle>
                    <CardDescription>
                      Evolución de tus precios comparados con la media del mercado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={marketData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="myPrice"
                          stroke="#4F46E5"
                          strokeWidth={2}
                          name="Tu Precio (€)"
                        />
                        <Line
                          type="monotone"
                          dataKey="avgMarketPrice"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Media Mercado (€)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ocupación vs Precio</CardTitle>
                    <CardDescription>
                      Correlación entre tus precios y la tasa de ocupación
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={marketData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="occupancy" fill="#4F46E5" name="Ocupación (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración del Pricing Dinámico</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-price">Precio Mínimo (€)</Label>
                      <Input id="min-price" type="number" placeholder="50" />
                      <p className="text-xs text-muted-foreground">
                        El sistema nunca bajará de este precio
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-price">Precio Máximo (€)</Label>
                      <Input id="max-price" type="number" placeholder="200" />
                      <p className="text-xs text-muted-foreground">
                        El sistema nunca subirá de este precio
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="strategy">Estrategia de Pricing</Label>
                      <select
                        id="strategy"
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="balanced">Balanceada (Ocupación + Ingresos)</option>
                        <option value="occupancy">Maximizar Ocupación</option>
                        <option value="revenue">Maximizar Ingresos</option>
                      </select>
                    </div>

                    <Button className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Guardar Configuración
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}
