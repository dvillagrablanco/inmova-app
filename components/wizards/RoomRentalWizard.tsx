'use client';

import { useState } from 'react';
import { Wizard, WizardStep } from '@/components/ui/wizard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Home,
  Users,
  DollarSign,
  Calculator,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  PieChart
} from 'lucide-react';
import { validateRequiredFields } from '@/lib/wizard-utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface RoomRentalWizardProps {
  propertyId?: string;
  onComplete?: (config: any) => void;
  onCancel?: () => void;
}

interface Room {
  id: string;
  name: string;
  size: number; // m²
  basePrice: number;
  tenant?: {
    name: string;
    email: string;
    phone: string;
    moveInDate: string;
  };
}

interface Utility {
  id: string;
  name: string;
  amount: number;
  prorate: boolean;
  method: 'equal' | 'byPerson' | 'bySize' | 'custom';
}

interface RoomRentalFormData {
  // Property
  propertyName: string;
  address: string;
  totalRooms: number;
  
  // Rooms
  rooms: Room[];
  
  // Utilities
  utilities: Utility[];
  
  // Common Areas
  commonAreas: string[];
  
  // Rules
  quietHours: string;
  cleaningSchedule: 'daily' | 'weekly' | 'biweekly';
  petsAllowed: boolean;
  smokingAllowed: boolean;
}

const COMMON_UTILITIES = [
  { name: 'Electricidad', defaultMethod: 'byPerson' },
  { name: 'Agua', defaultMethod: 'equal' },
  { name: 'Gas', defaultMethod: 'byPerson' },
  { name: 'Internet/Wi-Fi', defaultMethod: 'equal' },
  { name: 'Calefacción', defaultMethod: 'bySize' },
  { name: 'Limpieza Zonas Comunes', defaultMethod: 'equal' },
];

const COMMON_AREAS_OPTIONS = [
  'Cocina',
  'Salón',
  'Baño Compartido',
  'Terraza',
  'Jardín',
  'Lavandería',
  'Gimnasio',
  'Zona de Estudio',
];

export function RoomRentalWizard({ propertyId, onComplete, onCancel }: RoomRentalWizardProps) {
  const router = useRouter();
  const [prorationPreview, setProrationPreview] = useState<any>(null);

  const calculateProration = (rooms: Room[], utility: Utility) => {
    if (!utility.prorate || rooms.length === 0) return {};

    const occupiedRooms = rooms.filter(r => r.tenant);
    if (occupiedRooms.length === 0) return {};

    let distribution: Record<string, number> = {};

    switch (utility.method) {
      case 'equal':
        const equalAmount = utility.amount / occupiedRooms.length;
        occupiedRooms.forEach(room => {
          distribution[room.id] = equalAmount;
        });
        break;

      case 'byPerson':
        // Assuming 1 person per room for simplicity
        const perPersonAmount = utility.amount / occupiedRooms.length;
        occupiedRooms.forEach(room => {
          distribution[room.id] = perPersonAmount;
        });
        break;

      case 'bySize':
        const totalSize = occupiedRooms.reduce((sum, r) => sum + r.size, 0);
        occupiedRooms.forEach(room => {
          distribution[room.id] = (room.size / totalSize) * utility.amount;
        });
        break;

      default:
        break;
    }

    return distribution;
  };

  const steps: WizardStep[] = [
    {
      id: 'property',
      title: 'Propiedad Co-living',
      description: 'Información de la propiedad',
      icon: <Home className="h-5 w-5" />,
      helpText: 'Configura la propiedad que compartirán múltiples inquilinos',
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyName">Nombre de la Propiedad *</Label>
            <Input
              id="propertyName"
              value={data.propertyName || ''}
              onChange={(e) => updateData({ propertyName: e.target.value })}
              placeholder="Ej: Coliving Malasaña, Piso Estudiantes Centro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              value={data.address || ''}
              onChange={(e) => updateData({ address: e.target.value })}
              placeholder="Calle, número, ciudad"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalRooms">Número de Habitaciones *</Label>
            <Input
              id="totalRooms"
              type="number"
              value={data.totalRooms || ''}
              onChange={(e) => {
                const num = parseInt(e.target.value);
                updateData({ totalRooms: num });
                // Initialize rooms array
                const rooms = Array.from({ length: num }, (_, i) => ({
                  id: `room-${i + 1}`,
                  name: `Habitación ${i + 1}`,
                  size: 12,
                  basePrice: 400,
                }));
                updateData({ rooms });
              }}
              min={1}
              max={20}
              placeholder="3-10"
              required
            />
            <p className="text-xs text-muted-foreground">
              Número de habitaciones privadas disponibles para alquiler
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              El sistema te ayudará a configurar cada habitación y prorratear gastos automáticamente.
            </AlertDescription>
          </Alert>
        </div>
      ),
      validate: async (data) => {
        return validateRequiredFields(data, ['propertyName', 'address', 'totalRooms']);
      },
    },
    {
      id: 'rooms',
      title: 'Configurar Habitaciones',
      description: 'Detalles de cada habitación',
      icon: <Users className="h-5 w-5" />,
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Define el tamaño y precio base de cada habitación. Puedes añadir inquilinos después.
          </p>

          {data.rooms?.map((room: Room, index: number) => (
            <Card key={room.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Habitación {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`room-name-${index}`} className="text-xs">
                      Nombre
                    </Label>
                    <Input
                      id={`room-name-${index}`}
                      value={room.name}
                      onChange={(e) => {
                        const updated = [...data.rooms];
                        updated[index].name = e.target.value;
                        updateData({ rooms: updated });
                      }}
                      placeholder="Habitación principal"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`room-size-${index}`} className="text-xs">
                      Tamaño (m²)
                    </Label>
                    <Input
                      id={`room-size-${index}`}
                      type="number"
                      value={room.size}
                      onChange={(e) => {
                        const updated = [...data.rooms];
                        updated[index].size = parseFloat(e.target.value);
                        updateData({ rooms: updated });
                      }}
                      min={5}
                      max={50}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`room-price-${index}`} className="text-xs">
                      Precio Base (€/mes)
                    </Label>
                    <Input
                      id={`room-price-${index}`}
                      type="number"
                      value={room.basePrice}
                      onChange={(e) => {
                        const updated = [...data.rooms];
                        updated[index].basePrice = parseFloat(e.target.value);
                        updateData({ rooms: updated });
                      }}
                      min={100}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ),
      validate: async (data) => {
        if (!data.rooms || data.rooms.length === 0) {
          return 'Debes configurar al menos una habitación';
        }

        for (const room of data.rooms) {
          if (!room.name || room.size <= 0 || room.basePrice <= 0) {
            return 'Completa los datos de todas las habitaciones';
          }
        }

        return true;
      },
    },
    {
      id: 'utilities',
      title: 'Gastos y Servicios',
      description: 'Configura el prorrateo de gastos',
      icon: <Calculator className="h-5 w-5" />,
      helpText: 'Define cómo se distribuirán los gastos entre los inquilinos',
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base">Gastos Comunes</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const utilities = data.utilities || [];
                const newUtility: Utility = {
                  id: `utility-${Date.now()}`,
                  name: '',
                  amount: 0,
                  prorate: true,
                  method: 'equal',
                };
                updateData({ utilities: [...utilities, newUtility] });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir Gasto
            </Button>
          </div>

          {/* Quick Add Common Utilities */}
          {(!data.utilities || data.utilities.length === 0) && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Gastos Comunes Típicos</CardTitle>
                <CardDescription className="text-xs">
                  Haz clic para añadir rápidamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {COMMON_UTILITIES.map((util) => (
                    <Badge
                      key={util.name}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-white"
                      onClick={() => {
                        const utilities = data.utilities || [];
                        updateData({
                          utilities: [
                            ...utilities,
                            {
                              id: `utility-${Date.now()}-${util.name}`,
                              name: util.name,
                              amount: 50,
                              prorate: true,
                              method: util.defaultMethod,
                            },
                          ],
                        });
                      }}
                    >
                      {util.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Utilities List */}
          {data.utilities?.map((utility: Utility, index: number) => (
            <Card key={utility.id}>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={utility.name}
                      onChange={(e) => {
                        const updated = [...data.utilities];
                        updated[index].name = e.target.value;
                        updateData({ utilities: updated });
                      }}
                      placeholder="Nombre del gasto"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const updated = data.utilities.filter((_: any, i: number) => i !== index);
                        updateData({ utilities: updated });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`utility-amount-${index}`} className="text-xs">
                        Importe Mensual (€)
                      </Label>
                      <Input
                        id={`utility-amount-${index}`}
                        type="number"
                        value={utility.amount}
                        onChange={(e) => {
                          const updated = [...data.utilities];
                          updated[index].amount = parseFloat(e.target.value) || 0;
                          updateData({ utilities: updated });
                        }}
                        min={0}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`utility-method-${index}`} className="text-xs">
                        Método de Prorrateo
                      </Label>
                      <Select
                        value={utility.method}
                        onValueChange={(value) => {
                          const updated = [...data.utilities];
                          updated[index].method = value as any;
                          updateData({ utilities: updated });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equal">Partes Iguales</SelectItem>
                          <SelectItem value="byPerson">Por Persona</SelectItem>
                          <SelectItem value="bySize">Por Tamaño (m²)</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Proration Preview */}
                  {utility.amount > 0 && data.rooms?.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <strong>Reparto:</strong>
                      {data.rooms.map((room: Room, roomIndex: number) => {
                        const distribution = calculateProration([room], {
                          ...utility,
                          prorate: true,
                        });
                        const amount = distribution[room.id] || 0;
                        return (
                          <div key={room.id}>
                            {room.name}: €{amount.toFixed(2)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {data.utilities && data.utilities.length > 0 && (
            <Alert>
              <PieChart className="h-4 w-4" />
              <AlertDescription>
                Total gastos mensuales: €
                {data.utilities.reduce((sum: number, u: Utility) => sum + u.amount, 0).toFixed(2)}
              </AlertDescription>
            </Alert>
          )}
        </div>
      ),
    },
    {
      id: 'common-areas',
      title: 'Áreas Comunes y Normas',
      description: 'Espacios compartidos y reglas de convivencia',
      icon: <Home className="h-5 w-5" />,
      optional: true,
      fields: ({ data, updateData }) => (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Áreas Comunes</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_AREAS_OPTIONS.map((area) => {
                const isSelected = data.commonAreas?.includes(area);
                return (
                  <Badge
                    key={area}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer justify-center py-2"
                    onClick={() => {
                      const current = data.commonAreas || [];
                      const updated = isSelected
                        ? current.filter((a: string) => a !== area)
                        : [...current, area];
                      updateData({ commonAreas: updated });
                    }}
                  >
                    {area}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="quietHours">Horario de Silencio</Label>
            <Input
              id="quietHours"
              value={data.quietHours || ''}
              onChange={(e) => updateData({ quietHours: e.target.value })}
              placeholder="Ej: 23:00 - 08:00"
            />
          </div>

          <div className="space-y-3">
            <Label>Frecuencia de Limpieza Zonas Comunes</Label>
            <Select
              value={data.cleaningSchedule || 'weekly'}
              onValueChange={(value) => updateData({ cleaningSchedule: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diaria</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quincenal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Políticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="pets">Mascotas Permitidas</Label>
                <Select
                  value={data.petsAllowed ? 'yes' : 'no'}
                  onValueChange={(value) => updateData({ petsAllowed: value === 'yes' })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="smoking">Fumar Permitido</Label>
                <Select
                  value={data.smokingAllowed ? 'yes' : 'no'}
                  onValueChange={(value) => updateData({ smokingAllowed: value === 'yes' })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'summary',
      title: 'Resumen y Confirmación',
      description: 'Revisa la configuración',
      icon: <CheckCircle className="h-5 w-5" />,
      fields: ({ data }) => (
        <div className="space-y-4">
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Tu propiedad co-living está lista para ser creada
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{data.propertyName}</CardTitle>
              <CardDescription className="text-xs">{data.address}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Habitaciones:</span>{' '}
                  <span className="font-medium">{data.rooms?.length || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gastos configurados:</span>{' '}
                  <span className="font-medium">{data.utilities?.length || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ingreso base total:</span>{' '}
                  <span className="font-medium">
                    €{data.rooms?.reduce((sum: number, r: Room) => sum + r.basePrice, 0).toFixed(2)}/mes
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gastos totales:</span>{' '}
                  <span className="font-medium">
                    €{data.utilities?.reduce((sum: number, u: Utility) => sum + u.amount, 0).toFixed(2)}/mes
                  </span>
                </div>
              </div>

              {data.commonAreas && data.commonAreas.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Áreas Comunes: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.commonAreas.map((area: string) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  const handleComplete = async (data: RoomRentalFormData) => {
    try {
      const response = await fetch('/api/room-rental/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyName: data.propertyName,
          address: data.address,
          rooms: data.rooms,
          utilities: data.utilities,
          commonAreas: data.commonAreas,
          quietHours: data.quietHours,
          cleaningSchedule: data.cleaningSchedule,
          petsAllowed: data.petsAllowed,
          smokingAllowed: data.smokingAllowed,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear propiedad co-living');
      }

      const result = await response.json();
      toast.success('¡Propiedad co-living creada con éxito!');
      
      if (onComplete) {
        onComplete(result);
      } else {
        router.push(`/room-rental/${result.propertyId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear propiedad');
      throw error;
    }
  };

  return (
    <Wizard
      steps={steps}
      title="Configurar Propiedad Co-living"
      description="Configura habitaciones, gastos y normas de convivencia"
      initialData={{
        rooms: [],
        utilities: [],
        commonAreas: [],
        cleaningSchedule: 'weekly',
        petsAllowed: false,
        smokingAllowed: false,
      }}
      onComplete={handleComplete}
      onCancel={onCancel}
      showPreview={false}
      className="max-w-4xl"
    />
  );
}

export default RoomRentalWizard;
