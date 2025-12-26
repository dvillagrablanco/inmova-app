'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Link2,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Home,
  MapPin,
  Euro,
  Maximize2,
  ImageIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PropertyImporter() {
  const [activePortal, setActivePortal] = useState<'idealista' | 'pisos'>('idealista');
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [createAnalysis, setCreateAnalysis] = useState(true);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleImport = async () => {
    if (!url) {
      setError('Por favor ingresa una URL');
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/integrations/${activePortal}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          createAnalysis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error importando propiedad');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error importing property:', err);
      setError(err instanceof Error ? err.message : 'Error importando propiedad');
    } finally {
      setImporting(false);
    }
  };

  const viewProperty = () => {
    if (result?.property?.id) {
      router.push(`/propiedades/${result.property.id}`);
    }
  };

  const viewAnalysis = () => {
    if (result?.property?.id) {
      router.push(`/analisis-inversion?propertyId=${result.property.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Importar Propiedad desde Portales
          </CardTitle>
          <CardDescription>
            Importa propiedades directamente desde Idealista o Pisos.com
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activePortal} onValueChange={(v: any) => setActivePortal(v)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="idealista">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500" />
                  Idealista
                </div>
              </TabsTrigger>
              <TabsTrigger value="pisos">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Pisos.com
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="idealista" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idealista-url">URL de Idealista</Label>
                <Input
                  id="idealista-url"
                  type="url"
                  placeholder="https://www.idealista.com/inmueble/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={importing}
                />
                <p className="text-sm text-muted-foreground">
                  Copia y pega la URL completa de la propiedad en Idealista
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pisos" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pisos-url">URL de Pisos.com</Label>
                <Input
                  id="pisos-url"
                  type="url"
                  placeholder="https://www.pisos.com/vivienda/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={importing}
                />
                <p className="text-sm text-muted-foreground">
                  Copia y pega la URL completa de la propiedad en Pisos.com
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="create-analysis">Crear Análisis de Inversión Automático</Label>
              <p className="text-sm text-muted-foreground">
                Genera automáticamente un análisis de inversión con valores estimados
              </p>
            </div>
            <Switch
              id="create-analysis"
              checked={createAnalysis}
              onCheckedChange={setCreateAnalysis}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleImport} disabled={!url || importing} className="w-full" size="lg">
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Importar Propiedad
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && result.propertyData && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Propiedad Importada Exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vista previa */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <h3 className="font-bold text-lg">{result.propertyData.title}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {result.propertyData.address.city}, {result.propertyData.address.province}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  <Euro className="h-4 w-4 mr-1" />
                  {result.propertyData.price.toLocaleString()}
                </Badge>
              </div>

              {result.propertyData.images && result.propertyData.images.length > 0 && (
                <div className="relative h-48 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={result.propertyData.images[0]}
                    alt={result.propertyData.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    <ImageIcon className="inline h-3 w-3 mr-1" />
                    {result.propertyData.images.length} fotos
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                {result.propertyData.features.bedrooms && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{result.propertyData.features.bedrooms}</p>
                    <p className="text-sm text-muted-foreground">Habitaciones</p>
                  </div>
                )}
                {result.propertyData.features.bathrooms && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{result.propertyData.features.bathrooms}</p>
                    <p className="text-sm text-muted-foreground">Baños</p>
                  </div>
                )}
                {result.propertyData.features.squareMeters && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {result.propertyData.features.squareMeters}
                    </p>
                    <p className="text-sm text-muted-foreground">m²</p>
                  </div>
                )}
              </div>

              {result.propertyData.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm line-clamp-3">{result.propertyData.description}</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              <Button onClick={viewProperty} className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Ver Propiedad Completa
              </Button>

              {createAnalysis && (
                <Button onClick={viewAnalysis} className="w-full" variant="outline">
                  <Link2 className="h-4 w-4 mr-2" />
                  Ver Análisis de Inversión
                </Button>
              )}

              <Button
                onClick={() => window.open(result.propertyData.url, '_blank')}
                className="w-full"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver en {activePortal === 'idealista' ? 'Idealista' : 'Pisos.com'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PropertyImporter;
