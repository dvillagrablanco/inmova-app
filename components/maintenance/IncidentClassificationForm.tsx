'use client';

/**
 * Formulario de Clasificación Automática de Incidencias
 * 
 * Permite reportar una incidencia y obtener clasificación automática con IA
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

const incidentSchema = z.object({
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  location: z.string().optional(),
  unitId: z.string().optional(),
  createRequest: z.boolean().default(false),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

// ============================================================================
// COMPONENTE
// ============================================================================

export function IncidentClassificationForm({ unitId }: { unitId?: string }) {
  const [loading, setLoading] = useState(false);
  const [classification, setClassification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      unitId: unitId || '',
      createRequest: false,
    },
  });

  const onSubmit = async (data: IncidentFormData) => {
    setLoading(true);
    setError(null);
    setClassification(null);

    try {
      const response = await fetch('/api/v1/maintenance/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al clasificar incidencia');
      }

      const result = await response.json();
      setClassification(result.data.classification);

      if (data.createRequest) {
        // Resetear formulario si se creó solicitud
        reset();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reportar Incidencia</CardTitle>
          <CardDescription>
            Describe el problema y obtendrás una clasificación automática con estimación de costos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Descripción */}
            <div>
              <Label htmlFor="description">Descripción del Problema *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Ej: Hay una fuga de agua en el grifo del baño principal que gotea constantemente..."
                rows={4}
                className="mt-1"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Ubicación */}
            <div>
              <Label htmlFor="location">Ubicación (opcional)</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Ej: Baño principal, cocina, sala de estar..."
                className="mt-1"
              />
            </div>

            {/* Checkbox: Crear solicitud */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createRequest"
                {...register('createRequest')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="createRequest" className="text-sm font-normal cursor-pointer">
                Crear solicitud de mantenimiento automáticamente
              </Label>
            </div>

            {/* Botón Submit */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clasificando...
                </>
              ) : (
                'Clasificar Incidencia'
              )}
            </Button>
          </form>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resultados de Clasificación */}
      {classification && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Clasificación Automática</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categoría y Urgencia */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Categoría</Label>
                <Badge variant="outline" className="mt-1">
                  {classification.category}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Urgencia</Label>
                <Badge
                  variant={
                    classification.urgency === 'CRITICAL'
                      ? 'destructive'
                      : classification.urgency === 'HIGH'
                      ? 'default'
                      : 'secondary'
                  }
                  className="mt-1"
                >
                  {classification.urgency}
                </Badge>
              </div>
            </div>

            {/* Costo Estimado */}
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Costo Estimado
              </Label>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {classification.estimatedCost}€
              </p>
              <p className="text-sm text-gray-500">
                Rango: {classification.estimatedCostRange.min}€ -{' '}
                {classification.estimatedCostRange.max}€
              </p>
            </div>

            {/* Tiempo Estimado */}
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tiempo Estimado
              </Label>
              <p className="text-gray-900 mt-1">{classification.timeEstimate}</p>
            </div>

            {/* Proveedor Recomendado */}
            <div>
              <Label className="text-sm text-gray-600">Proveedor Recomendado</Label>
              <p className="text-gray-900 mt-1">{classification.providerType}</p>
            </div>

            {/* Acción Requerida */}
            <div>
              <Label className="text-sm text-gray-600">Acción Requerida</Label>
              <p className="text-gray-900 mt-1">{classification.actionRequired}</p>
            </div>

            {/* Razonamiento IA */}
            <div>
              <Label className="text-sm text-gray-600">Análisis IA</Label>
              <p className="text-sm text-gray-700 mt-1 italic">{classification.reasoning}</p>
            </div>

            {/* Recomendaciones */}
            {classification.recommendations && classification.recommendations.length > 0 && (
              <div>
                <Label className="text-sm text-gray-600">Recomendaciones</Label>
                <ul className="list-disc list-inside text-sm text-gray-700 mt-1 space-y-1">
                  {classification.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alerta de Emergencia */}
            {classification.requiresEmergencyCall && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ Esta incidencia requiere atención inmediata. Contacta al proveedor urgentemente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IncidentClassificationForm;
