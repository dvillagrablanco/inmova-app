'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, Car, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { BackButton } from '@/components/ui/back-button';
import logger from '@/lib/logger';

interface Building {
  id: string;
  nombre: string;
  direccion: string;
}

export default function NuevoGarajeTrasteroPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [formData, setFormData] = useState({
    tipo: 'garaje' as 'garaje' | 'trastero',
    numero: '',
    buildingId: '',
    superficie: '',
    planta: '',
    orientacion: '',
    rentaMensual: '',
    descripcion: '',
    estado: 'disponible',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchBuildings();
    }
  }, [session]);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (error) {
      logger.error('Error fetching buildings:', error);
      toast.error('Error al cargar edificios');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.tipo || !formData.numero || !formData.buildingId || !formData.superficie || !formData.rentaMensual) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: formData.tipo,
          numero: formData.numero,
          buildingId: formData.buildingId,
          superficie: parseFloat(formData.superficie),
          planta: formData.planta ? parseInt(formData.planta) : null,
          orientacion: formData.orientacion || null,
          rentaMensual: parseFloat(formData.rentaMensual),
          descripcion: formData.descripcion || null,
          estado: formData.estado,
          // Campos por defecto para garajes/trasteros
          habitaciones: 0,
          banos: 0,
          aireAcondicionado: false,
          calefaccion: false,
          terraza: false,
          balcon: false,
          amueblado: false,
        }),
      });

      if (response.ok) {
        toast.success(`${formData.tipo === 'garaje' ? 'Garaje' : 'Trastero'} creado correctamente`);
        router.push('/garajes-trasteros');
      } else {
        const error = await response.json();
        toast.error(error.error || `Error al crear ${formData.tipo}`);
      }
    } catch (error) {
      logger.error('Error creating unit:', error);
      toast.error('Error al crear el espacio');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-bg">
        <LoadingState message="Cargando formulario..." size="lg" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-bg p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/garajes-trasteros">
                    Garajes y Trasteros
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nuevo Espacio</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="space-y-4">
              <BackButton href="/garajes-trasteros" label="Volver a Garajes y Trasteros" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight gradient-text">
                  Nuevo Garaje o Trastero
                </h1>
                <p className="text-muted-foreground mt-1">
                  Registra un nuevo espacio de almacenamiento o estacionamiento
                </p>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Información del Espacio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tipo de Espacio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Espacio *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: 'garaje' | 'trastero') =>
                          setFormData({ ...formData, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="garaje">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              Garaje
                            </div>
                          </SelectItem>
                          <SelectItem value="trastero">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Trastero
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero">Número / Identificador *</Label>
                      <Input
                        id="numero"
                        placeholder="Ej: G-01, T-15, Plaza 23"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Edificio */}
                  <div className="space-y-2">
                    <Label htmlFor="buildingId">Edificio *</Label>
                    <Select
                      value={formData.buildingId}
                      onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un edificio" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.nombre} - {building.direccion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ubicación */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="planta">Planta</Label>
                      <Input
                        id="planta"
                        type="number"
                        placeholder="Ej: -1, 0, 1, 2"
                        value={formData.planta}
                        onChange={(e) => setFormData({ ...formData, planta: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Sótanos con número negativo (Ej: -1, -2)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orientacion">Orientación / Ubicación</Label>
                      <Input
                        id="orientacion"
                        placeholder="Ej: Norte, Pasillo B, Zona 2"
                        value={formData.orientacion}
                        onChange={(e) =>
                          setFormData({ ...formData, orientacion: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Características */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="superficie">Superficie (m²) *</Label>
                      <Input
                        id="superficie"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 12.5"
                        value={formData.superficie}
                        onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rentaMensual">Renta Mensual (€) *</Label>
                      <Input
                        id="rentaMensual"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 75.00"
                        value={formData.rentaMensual}
                        onChange={(e) =>
                          setFormData({ ...formData, rentaMensual: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado Inicial</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponible">Disponible</SelectItem>
                        <SelectItem value="ocupada">Ocupado</SelectItem>
                        <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción / Notas</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Información adicional sobre el espacio..."
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <span className="animate-spin mr-2">●</span>
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Crear {formData.tipo === 'garaje' ? 'Garaje' : 'Trastero'}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/garajes-trasteros')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
