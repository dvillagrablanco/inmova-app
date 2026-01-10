'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Wifi, Thermometer, Lock, Lightbulb, Zap, Activity } from 'lucide-react';

const deviceTypes = [
  { value: 'thermostat', label: 'Termostato', icon: Thermometer },
  { value: 'lock', label: 'Cerradura Inteligente', icon: Lock },
  { value: 'light', label: 'Iluminación', icon: Lightbulb },
  { value: 'sensor', label: 'Sensor', icon: Activity },
  { value: 'meter', label: 'Medidor de Consumo', icon: Zap },
];

const deviceBrands = {
  thermostat: ['Nest', 'Ecobee', 'Honeywell', 'Tado', 'Otro'],
  lock: ['Yale', 'August', 'Nuki', 'Schlage', 'Otro'],
  light: ['Philips Hue', 'LIFX', 'Nanoleaf', 'Yeelight', 'Otro'],
  sensor: ['Aqara', 'Fibaro', 'SmartThings', 'Eve', 'Otro'],
  meter: ['Shelly', 'Emporia', 'Sense', 'Otro'],
};

export default function NuevoDispositivoIOTPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    type: 'thermostat',
    brand: '',
    model: '',
    serialNumber: '',
    buildingId: '',
    unitId: '',
    location: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchBuildings();
    }
  }, [status, router]);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  const fetchUnits = async (buildingId: string) => {
    try {
      const response = await fetch(`/api/units?buildingId=${buildingId}`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleBuildingChange = (buildingId: string) => {
    setForm({ ...form, buildingId, unitId: '' });
    fetchUnits(buildingId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/iot/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Dispositivo añadido exitosamente');
        router.push('/iot');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al añadir el dispositivo');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al añadir el dispositivo');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const currentBrands = deviceBrands[form.type as keyof typeof deviceBrands] || [];

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wifi className="h-8 w-8 text-blue-600" />
              Añadir Dispositivo IoT
            </h1>
            <p className="text-muted-foreground mt-1">
              Conecta un nuevo dispositivo inteligente a tu propiedad
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Dispositivo */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Dispositivo</CardTitle>
              <CardDescription>Selecciona el tipo de dispositivo que deseas añadir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {deviceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: type.value, brand: '' })}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        form.type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Información del Dispositivo */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Dispositivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del dispositivo *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ej: Termostato Salón Principal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Select
                    value={form.brand}
                    onValueChange={(v) => setForm({ ...form, brand: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="ej: Learning 3rd Gen"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Serie</Label>
                <Input
                  id="serialNumber"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  placeholder="Número de serie del dispositivo"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>¿Dónde está instalado el dispositivo?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildingId">Edificio *</Label>
                  <Select value={form.buildingId} onValueChange={handleBuildingChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitId">Unidad (opcional)</Label>
                  <Select
                    value={form.unitId}
                    onValueChange={(v) => setForm({ ...form, unitId: v })}
                    disabled={!form.buildingId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Área común</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.numero}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación específica</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="ej: Salón, Entrada Principal, Cuadro Eléctrico"
                />
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.name || !form.buildingId}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Añadiendo...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Añadir Dispositivo
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
