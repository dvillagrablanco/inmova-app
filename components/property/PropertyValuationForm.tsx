/**
 * Formulario de Valoración Automática con IA
 * Componente que permite valorar propiedades usando Anthropic Claude
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Home, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

const valuationSchema = z.object({
  address: z.string().min(5, 'Dirección requerida'),
  postalCode: z.string().min(4, 'Código postal requerido'),
  city: z.string().min(2, 'Ciudad requerida'),
  province: z.string().optional(),
  neighborhood: z.string().optional(),
  squareMeters: z.number().positive('Superficie debe ser positiva'),
  rooms: z.number().int().positive(),
  bathrooms: z.number().int().positive(),
  floor: z.number().int().optional(),
  hasElevator: z.boolean(),
  hasParking: z.boolean(),
  hasGarden: z.boolean(),
  hasPool: z.boolean(),
  hasTerrace: z.boolean(),
  hasGarage: z.boolean(),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_RENOVATION', 'POOR']),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
});

type ValuationFormData = z.infer<typeof valuationSchema>;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PropertyValuationForm({ unitId }: { unitId?: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      hasElevator: false,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasTerrace: false,
      hasGarage: false,
      condition: 'GOOD',
    },
  });

  const onSubmit = async (data: ValuationFormData) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/valuations/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, unitId }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Error en la valoración');
      }

      setResult(json.data);
      toast.success('¡Valoración completada!');

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>📍 Ubicación</CardTitle>
              <CardDescription>Datos de la propiedad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle Mayor 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Madrid" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input placeholder="28013" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>🏠 Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="squareMeters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Superficie (m²)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Habitaciones</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baños</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NEW">Nuevo</SelectItem>
                        <SelectItem value="EXCELLENT">Excelente</SelectItem>
                        <SelectItem value="GOOD">Bueno</SelectItem>
                        <SelectItem value="FAIR">Aceptable</SelectItem>
                        <SelectItem value="NEEDS_RENOVATION">Necesita reforma</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkboxes */}
              <div className="grid grid-cols-3 gap-4">
                {['hasElevator', 'hasParking', 'hasGarden', 'hasPool', 'hasTerrace', 'hasGarage'].map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as any}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">
                          {name.replace('has', '').replace(/([A-Z])/g, ' $1')}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Valorando con IA...
              </>
            ) : (
              '🤖 Valorar Propiedad con IA'
            )}
          </Button>
        </form>
      </Form>

      {/* Resultado */}
      {result && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Resultado de la Valoración
            </CardTitle>
            <CardDescription>
              Valoración generada por IA • Confianza: {result.confidenceScore}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Valor Estimado</div>
                <div className="text-2xl font-bold text-green-600">
                  {result.estimatedValue.toLocaleString('es-ES')}€
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Mínimo</div>
                <div className="text-xl font-semibold text-blue-600">
                  {result.minValue.toLocaleString('es-ES')}€
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">Máximo</div>
                <div className="text-xl font-semibold text-purple-600">
                  {result.maxValue.toLocaleString('es-ES')}€
                </div>
              </div>
            </div>

            {result.reasoning && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold mb-2">💡 Análisis:</div>
                <p className="text-sm text-gray-700">{result.reasoning}</p>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <div className="font-semibold mb-2">✨ Recomendaciones:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
