'use client';

import { useState, useEffect } from 'react';
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
import { Calculator, Info, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Room {
  id: string;
  name: string;
  occupants: number;
  superficie: number;
  rentaMensual: number;
}

interface ProrationResult {
  roomId: string;
  roomName: string;
  baseRent: number;
  utilityShare: number;
  totalAmount: number;
  percentage: number;
}

export function ProrationCalculator() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Habitación 1', occupants: 1, superficie: 20, rentaMensual: 400 },
    { id: '2', name: 'Habitación 2', occupants: 2, superficie: 25, rentaMensual: 500 },
    { id: '3', name: 'Habitación 3', occupants: 1, superficie: 18, rentaMensual: 380 },
  ]);

  const [totalUtilityAmount, setTotalUtilityAmount] = useState<number>(150);
  const [method, setMethod] = useState<'by_occupants' | 'by_surface' | 'combined' | 'equal'>(
    'combined'
  );
  const [results, setResults] = useState<ProrationResult[]>([]);

  useEffect(() => {
    calculateProration();
  }, [rooms, totalUtilityAmount, method]);

  const calculateProration = () => {
    if (rooms.length === 0 || totalUtilityAmount <= 0) {
      setResults([]);
      return;
    }

    let newResults: ProrationResult[] = [];

    switch (method) {
      case 'by_occupants':
        newResults = calculateByOccupants();
        break;
      case 'by_surface':
        newResults = calculateBySurface();
        break;
      case 'combined':
        newResults = calculateCombined();
        break;
      case 'equal':
        newResults = calculateEqual();
        break;
    }

    setResults(newResults);
  };

  const calculateByOccupants = (): ProrationResult[] => {
    const totalOccupants = rooms.reduce((sum, room) => sum + room.occupants, 0);

    if (totalOccupants === 0) {
      return rooms.map((room) => ({
        roomId: room.id,
        roomName: room.name,
        baseRent: room.rentaMensual,
        utilityShare: 0,
        totalAmount: room.rentaMensual,
        percentage: 0,
      }));
    }

    return rooms.map((room) => {
      const percentage = (room.occupants / totalOccupants) * 100;
      const utilityShare = (room.occupants / totalOccupants) * totalUtilityAmount;

      return {
        roomId: room.id,
        roomName: room.name,
        baseRent: room.rentaMensual,
        utilityShare: parseFloat(utilityShare.toFixed(2)),
        totalAmount: parseFloat((room.rentaMensual + utilityShare).toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });
  };

  const calculateBySurface = (): ProrationResult[] => {
    const totalSurface = rooms.reduce((sum, room) => sum + room.superficie, 0);

    if (totalSurface === 0) {
      return rooms.map((room) => ({
        roomId: room.id,
        roomName: room.name,
        baseRent: room.rentaMensual,
        utilityShare: 0,
        totalAmount: room.rentaMensual,
        percentage: 0,
      }));
    }

    return rooms.map((room) => {
      const percentage = (room.superficie / totalSurface) * 100;
      const utilityShare = (room.superficie / totalSurface) * totalUtilityAmount;

      return {
        roomId: room.id,
        roomName: room.name,
        baseRent: room.rentaMensual,
        utilityShare: parseFloat(utilityShare.toFixed(2)),
        totalAmount: parseFloat((room.rentaMensual + utilityShare).toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });
  };

  const calculateCombined = (): ProrationResult[] => {
    const totalOccupants = rooms.reduce((sum, room) => sum + room.occupants, 0);
    const totalSurface = rooms.reduce((sum, room) => sum + room.superficie, 0);

    // Si ambos son 0, retornar sin prorrateo
    if (totalOccupants === 0 && totalSurface === 0) {
      return rooms.map((room) => ({
        roomId: room.id,
        roomName: room.name,
        baseRent: room.rentaMensual,
        utilityShare: 0,
        totalAmount: room.rentaMensual,
        percentage: 0,
      }));
    }

    // Si uno es 0, usar solo el otro
    if (totalOccupants === 0) return calculateBySurface();
    if (totalSurface === 0) return calculateByOccupants();

    // Método combinado: 50% por ocupantes, 50% por superficie
    return rooms.map((room) => {
      const occupantWeight = room.occupants / totalOccupants;
      const surfaceWeight = room.superficie / totalSurface;
      const combinedWeight = (occupantWeight + surfaceWeight) / 2;

      const percentage = combinedWeight * 100;
      const utilityShare = combinedWeight * totalUtilityAmount;

      return {
        roomId: room.id,
        roomName: room.name,
        baseRent: room.rentaMensual,
        utilityShare: parseFloat(utilityShare.toFixed(2)),
        totalAmount: parseFloat((room.rentaMensual + utilityShare).toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });
  };

  const calculateEqual = (): ProrationResult[] => {
    const sharePerRoom = totalUtilityAmount / rooms.length;

    return rooms.map((room) => ({
      roomId: room.id,
      roomName: room.name,
      baseRent: room.rentaMensual,
      utilityShare: parseFloat(sharePerRoom.toFixed(2)),
      totalAmount: parseFloat((room.rentaMensual + sharePerRoom).toFixed(2)),
      percentage: parseFloat((100 / rooms.length).toFixed(2)),
    }));
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      name: `Habitación ${rooms.length + 1}`,
      occupants: 1,
      superficie: 20,
      rentaMensual: 400,
    };
    setRooms([...rooms, newRoom]);
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };

  const updateRoom = (id: string, field: keyof Room, value: any) => {
    setRooms(rooms.map((room) => (room.id === id ? { ...room, [field]: value } : room)));
  };

  const totalRent = results.reduce((sum, r) => sum + r.baseRent, 0);
  const totalUtilities = results.reduce((sum, r) => sum + r.utilityShare, 0);
  const grandTotal = results.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Prorrateo de Gastos
          </CardTitle>
          <CardDescription>
            Calcula automáticamente cómo distribuir los gastos comunes entre las habitaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuración Global */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total-utility">
                Monto Total de Gastos (€)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Suma de todos los gastos comunes del mes (agua, luz, gas, internet, etc.)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="total-utility"
                type="number"
                min="0"
                step="0.01"
                value={totalUtilityAmount}
                onChange={(e) => setTotalUtilityAmount(parseFloat(e.target.value) || 0)}
                placeholder="150.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">
                Método de Prorrateo
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        <p>
                          <strong>Por ocupantes:</strong> Divide según número de personas
                        </p>
                        <p>
                          <strong>Por superficie:</strong> Divide según metros cuadrados
                        </p>
                        <p>
                          <strong>Combinado:</strong> 50% ocupantes + 50% superficie
                        </p>
                        <p>
                          <strong>Igualitario:</strong> Divide en partes iguales
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select value={method} onValueChange={(value: any) => setMethod(value)}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combinado (Recomendado)</SelectItem>
                  <SelectItem value="by_occupants">Por Ocupantes</SelectItem>
                  <SelectItem value="by_surface">Por Superficie</SelectItem>
                  <SelectItem value="equal">Igualitario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Habitaciones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Habitaciones</h3>
              <Button onClick={addRoom} variant="outline" size="sm">
                + Agregar Habitación
              </Button>
            </div>

            <div className="space-y-4">
              {rooms.map((room) => (
                <Card key={room.id} className="border-l-4 border-l-indigo-500">
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-5">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${room.id}`}>Nombre</Label>
                        <Input
                          id={`name-${room.id}`}
                          value={room.name}
                          onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`occupants-${room.id}`}>Ocupantes</Label>
                        <Input
                          id={`occupants-${room.id}`}
                          type="number"
                          min="0"
                          value={room.occupants}
                          onChange={(e) =>
                            updateRoom(room.id, 'occupants', parseInt(e.target.value) || 0)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`superficie-${room.id}`}>m²</Label>
                        <Input
                          id={`superficie-${room.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={room.superficie}
                          onChange={(e) =>
                            updateRoom(room.id, 'superficie', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`rent-${room.id}`}>Renta (€)</Label>
                        <Input
                          id={`rent-${room.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={room.rentaMensual}
                          onChange={(e) =>
                            updateRoom(room.id, 'rentaMensual', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeRoom(room.id)}
                          disabled={rooms.length === 1}
                          className="w-full"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <Card className="border-t-4 border-t-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Resultados del Prorrateo
            </CardTitle>
            <CardDescription>Distribución automática según el método seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Habitación</th>
                    <th className="text-right py-3 px-4">Renta Base</th>
                    <th className="text-right py-3 px-4">% Gastos</th>
                    <th className="text-right py-3 px-4">Gastos</th>
                    <th className="text-right py-3 px-4 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.roomId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{result.roomName}</td>
                      <td className="text-right py-3 px-4">€{result.baseRent.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {result.percentage.toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4 text-orange-600">
                        +€{result.utilityShare.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-green-600">
                        €{result.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold bg-muted/30">
                    <td className="py-3 px-4">TOTAL</td>
                    <td className="text-right py-3 px-4">€{totalRent.toFixed(2)}</td>
                    <td className="text-right py-3 px-4">100%</td>
                    <td className="text-right py-3 px-4 text-orange-600">
                      €{totalUtilities.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-green-600">
                      €{grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Información del Método
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {method === 'combined' &&
                  'Método combinado: Los gastos se distribuyen 50% según número de ocupantes y 50% según superficie de cada habitación.'}
                {method === 'by_occupants' &&
                  'Los gastos se distribuyen proporcionalmente según el número de ocupantes en cada habitación.'}
                {method === 'by_surface' &&
                  'Los gastos se distribuyen proporcionalmente según los metros cuadrados de cada habitación.'}
                {method === 'equal' &&
                  'Los gastos se distribuyen en partes iguales entre todas las habitaciones, independientemente de ocupantes o tamaño.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProrationCalculator;
