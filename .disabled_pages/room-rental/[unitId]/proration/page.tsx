'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calculator,
  Zap,
  Droplet,
  Flame,
  Wifi,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import logger, { logError } from '@/lib/logger';

export default function ProrationPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [unit, setUnit] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [utilities, setUtilities] = useState({
    electricity: '',
    water: '',
    gas: '',
    internet: '',
    cleaning: '',
  });
  const [prorationMethod, setProrationMethod] = useState('combined');

  const unitId = params?.unitId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && unitId) {
      loadData();
    }
  }, [status, unitId, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [unitRes, roomsRes] = await Promise.all([
        fetch(`/api/units/${unitId}`),
        fetch(`/api/room-rental/rooms?unitId=${unitId}&estado=ocupada`),
      ]);

      if (unitRes.ok) setUnit(await unitRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    // Validar que haya al menos un suministro
    const hasUtility = Object.values(utilities).some((v) => v && parseFloat(v) > 0);
    if (!hasUtility) {
      toast.error('Ingresa al menos un monto de suministro');
      return;
    }

    if (rooms.length === 0) {
      toast.error('No hay habitaciones ocupadas en esta unidad');
      return;
    }

    try {
      setCalculating(true);

      const roomsData = rooms.map((room) => ({
        roomId: room.id,
        surface: room.superficie,
        occupants: 1, // Por ahora 1 por habitación
      }));

      // Calcular prorrateo para cada suministro que tenga valor
      const results: any = {};

      for (const [key, value] of Object.entries(utilities)) {
        if (value && parseFloat(value) > 0) {
          const res = await fetch(
            `/api/room-rental/proration?totalAmount=${value}&prorationMethod=${prorationMethod}&rooms=${encodeURIComponent(JSON.stringify(roomsData))}`
          );
          if (res.ok) {
            const data = await res.json();
            results[key] = data.distribution;
          }
        }
      }

      setPreview(results);
      toast.success('Cálculo completado');
    } catch (error) {
      logger.error('Error calculating proration:', error);
      toast.error('Error al calcular prorrateo');
    } finally {
      setCalculating(false);
    }
  }

  async function handleApply() {
    if (!preview) {
      toast.error('Primero calcula el prorrateo');
      return;
    }

    if (
      !confirm(
        '¿Aplicar prorrateo y generar pagos? Esta acción creará registros de pago para cada habitación ocupada.'
      )
    ) {
      return;
    }

    try {
      setCalculating(true);
      const res = await fetch('/api/room-rental/proration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          utilities: {
            electricity: utilities.electricity ? parseFloat(utilities.electricity) : undefined,
            water: utilities.water ? parseFloat(utilities.water) : undefined,
            gas: utilities.gas ? parseFloat(utilities.gas) : undefined,
            internet: utilities.internet ? parseFloat(utilities.internet) : undefined,
            cleaning: utilities.cleaning ? parseFloat(utilities.cleaning) : undefined,
          },
          prorationMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Prorrateo aplicado correctamente. Se crearon ${data.paymentsCreated.length} pagos.`
        );
        setPreview(null);
        setUtilities({
          electricity: '',
          water: '',
          gas: '',
          internet: '',
          cleaning: '',
        });
        router.push(`/room-rental/${unitId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al aplicar prorrateo');
      }
    } catch (error) {
      logger.error('Error applying proration:', error);
      toast.error('Error al aplicar prorrateo');
    } finally {
      setCalculating(false);
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center py-12">Cargando...</div>
          </main>
        </div>
      </div>
    );
  }

  const totalUtilities = Object.values(utilities).reduce(
    (sum, val) => sum + (val ? parseFloat(val) : 0),
    0
  );

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Calculator className="mr-3 h-8 w-8 text-blue-600" />
                Prorrateo de Suministros
              </h1>
              <p className="text-gray-600">
                {unit?.building?.nombre} - Unidad {unit?.numero} - {rooms.length} habitaciones
                ocupadas
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>1. Ingresa los Montos de Suministros</CardTitle>
                    <CardDescription>
                      Introduce los montos de las facturas mensuales que deseas prorratear
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="electricity" className="flex items-center">
                          <Zap className="mr-2 h-4 w-4 text-yellow-600" />
                          Electricidad (€)
                        </Label>
                        <Input
                          id="electricity"
                          type="number"
                          step="0.01"
                          value={utilities.electricity}
                          onChange={(e) =>
                            setUtilities({ ...utilities, electricity: e.target.value })
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label htmlFor="water" className="flex items-center">
                          <Droplet className="mr-2 h-4 w-4 text-blue-600" />
                          Agua (€)
                        </Label>
                        <Input
                          id="water"
                          type="number"
                          step="0.01"
                          value={utilities.water}
                          onChange={(e) => setUtilities({ ...utilities, water: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label htmlFor="gas" className="flex items-center">
                          <Flame className="mr-2 h-4 w-4 text-orange-600" />
                          Gas (€)
                        </Label>
                        <Input
                          id="gas"
                          type="number"
                          step="0.01"
                          value={utilities.gas}
                          onChange={(e) => setUtilities({ ...utilities, gas: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label htmlFor="internet" className="flex items-center">
                          <Wifi className="mr-2 h-4 w-4 text-purple-600" />
                          Internet (€)
                        </Label>
                        <Input
                          id="internet"
                          type="number"
                          step="0.01"
                          value={utilities.internet}
                          onChange={(e) => setUtilities({ ...utilities, internet: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor="cleaning" className="flex items-center">
                          <Sparkles className="mr-2 h-4 w-4 text-green-600" />
                          Limpieza (€)
                        </Label>
                        <Input
                          id="cleaning"
                          type="number"
                          step="0.01"
                          value={utilities.cleaning}
                          onChange={(e) => setUtilities({ ...utilities, cleaning: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>2. Selecciona el Método de Prorrateo</CardTitle>
                    <CardDescription>
                      Elige cómo distribuir los costos entre las habitaciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={prorationMethod} onValueChange={setProrationMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">
                          División Equitativa - Cada habitación paga igual
                        </SelectItem>
                        <SelectItem value="by_surface">
                          Por Superficie - Según los metros cuadrados
                        </SelectItem>
                        <SelectItem value="by_occupants">
                          Por Ocupantes - Según número de personas
                        </SelectItem>
                        <SelectItem value="combined">
                          Combinado - 50% superficie + 50% ocupantes (Recomendado)
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Método seleccionado:</strong>{' '}
                        {prorationMethod === 'equal' &&
                          'Los costos se dividen equitativamente entre todas las habitaciones.'}
                        {prorationMethod === 'by_surface' &&
                          'Los costos se distribuyen proporcionalmente según la superficie de cada habitación.'}
                        {prorationMethod === 'by_occupants' &&
                          'Los costos se distribuyen según el número de ocupantes en cada habitación.'}
                        {prorationMethod === 'combined' &&
                          'Los costos se calculan con una combinación de superficie y número de ocupantes. Este es el método más justo.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex space-x-3">
                  <Button
                    onClick={handlePreview}
                    disabled={calculating || rooms.length === 0}
                    className="flex-1"
                  >
                    {calculating ? 'Calculando...' : 'Calcular Prorrateo'}
                  </Button>
                  {preview && (
                    <Button
                      onClick={handleApply}
                      disabled={calculating}
                      variant="default"
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aplicar y Generar Pagos
                    </Button>
                  )}
                </div>
              </div>

              {/* Sidebar - Resumen */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Suministros:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        €{totalUtilities.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Habitaciones Ocupadas:</span>
                      <span className="text-lg font-semibold">{rooms.length}</span>
                    </div>
                    {totalUtilities > 0 && rooms.length > 0 && (
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-sm text-gray-600">Promedio por Habitación:</span>
                        <span className="text-lg font-semibold text-green-600">
                          €{(totalUtilities / rooms.length).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {rooms.length === 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-4">
                        <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          No hay habitaciones ocupadas. El prorrateo solo se aplica a habitaciones
                          con contratos activos.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vista Previa */}
                {preview && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Vista Previa del Prorrateo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {rooms.map((room: any, index: number) => {
                          const roomTotal = Object.keys(preview).reduce(
                            (sum: number, utilityKey: string) => {
                              const distribution = preview[utilityKey].find(
                                (d: any) => d.roomId === room.id
                              );
                              return sum + (distribution?.amount || 0);
                            },
                            0
                          );

                          return (
                            <div key={room.id} className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium mb-1">Habitación {room.numero}</p>
                              <p className="text-sm text-gray-600 mb-2">{room.superficie}m²</p>
                              <p className="text-lg font-bold text-green-600">
                                €{roomTotal.toFixed(2)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
