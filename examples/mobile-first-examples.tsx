/**
 * Ejemplos prácticos de uso de componentes Mobile-First
 * Fase 3: Mobile-First UI Implementation
 * 
 * Este archivo contiene ejemplos completos de cómo usar los nuevos componentes
 * optimizados para móvil en diferentes escenarios comunes.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import {
  MobileOptimizedForm,
  FormSection,
  FormField,
} from '@/components/ui/mobile-optimized-form';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useSwipe } from '@/lib/hooks/useGestures';
import { useIsMobile, useDeviceType } from '@/lib/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Euro, ChevronRight, Plus } from 'lucide-react';

/**
 * EJEMPLO 1: Página de lista con tabla responsive
 * Muestra una lista de edificios que se convierte en cards en móvil
 */
export function BuildingsListExample() {
  const router = useRouter();
  const [buildings, setBuildings] = useState([
    {
      id: 1,
      name: 'Edificio Central',
      address: 'Calle Principal 123, Madrid',
      units: 10,
      occupied: 8,
      revenue: 15000,
      status: 'active',
    },
    {
      id: 2,
      name: 'Residencial Norte',
      address: 'Avenida Norte 456, Barcelona',
      units: 15,
      occupied: 12,
      revenue: 22500,
      status: 'active',
    },
    {
      id: 3,
      name: 'Torre Vista',
      address: 'Plaza Central 789, Valencia',
      units: 20,
      occupied: 18,
      revenue: 30000,
      status: 'maintenance',
    },
  ]);

  const handleRefresh = async () => {
    // Simular carga de datos
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Datos actualizados');
  };

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6">
          {/* Header con acción principal */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mis Edificios</h1>
              <p className="text-muted-foreground">Gestiona tus propiedades</p>
            </div>
            <Button size="default" className="touch-target">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </div>

          {/* Tabla responsive */}
          <ResponsiveTable
            data={buildings}
            columns={[
              {
                key: 'name',
                header: 'Nombre',
                mobileLabel: 'Edificio',
                render: (building) => (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">{building.name}</span>
                  </div>
                ),
              },
              {
                key: 'address',
                header: 'Dirección',
                hideOnMobile: true, // Ocultar en móvil para ahorrar espacio
              },
              {
                key: 'units',
                header: 'Unidades',
                mobileLabel: 'Ocupación',
                render: (building) => (
                  <span>
                    {building.occupied}/{building.units}
                  </span>
                ),
              },
              {
                key: 'revenue',
                header: 'Ingresos',
                className: 'text-right',
                render: (building) => (
                  <span className="font-semibold text-green-600">
                    €{building.revenue.toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (building) => (
                  <Badge
                    variant={building.status === 'active' ? 'default' : 'secondary'}
                  >
                    {building.status === 'active' ? 'Activo' : 'Mantenimiento'}
                  </Badge>
                ),
              },
            ]}
            keyExtractor={(building) => building.id}
            onRowClick={(building) => router.push(`/edificios/${building.id}`)}
            emptyMessage="No hay edificios disponibles"
          />
        </div>
      </PullToRefresh>
    </AuthenticatedLayout>
  );
}

/**
 * EJEMPLO 2: Formulario de creación optimizado para móvil
 * Formulario completo con secciones, validación y estados de carga
 */
export function CreateBuildingFormExample() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    // Validación simple
    const newErrors: Record<string, string> = {};
    if (!data.name) newErrors.name = 'El nombre es obligatorio';
    if (!data.address) newErrors.address = 'La dirección es obligatoria';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    // Simular envío
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setLoading(false);
    router.push('/edificios');
  };

  return (
    <AuthenticatedLayout maxWidth="5xl">
      <MobileOptimizedForm
        onSubmit={handleSubmit}
        title="Nuevo Edificio"
        description="Completa la información para agregar un nuevo edificio a tu cartera"
        submitLabel="Crear Edificio"
        cancelLabel="Cancelar"
        onCancel={() => router.back()}
        loading={loading}
      >
        {/* Sección 1: Información Básica */}
        <FormSection
          title="Información Básica"
          description="Datos principales del edificio"
        >
          <FormField
            label="Nombre del Edificio"
            required
            error={errors.name}
            hint="Nombre identificativo del edificio"
          >
            <Input
              name="name"
              placeholder="Ej: Edificio Central"
              className="touch-target"
            />
          </FormField>

          <FormField
            label="Dirección Completa"
            required
            error={errors.address}
            hint="Calle, número, ciudad y código postal"
          >
            <Input
              name="address"
              placeholder="Calle Principal 123, 28001 Madrid"
              className="touch-target"
            />
          </FormField>
        </FormSection>

        {/* Sección 2: Detalles */}
        <FormSection
          title="Detalles del Edificio"
          description="Información adicional"
        >
          <FormField
            label="Número de Unidades"
            hint="Total de unidades/apartamentos en el edificio"
          >
            <Input
              type="number"
              name="units"
              placeholder="10"
              min="1"
              className="touch-target"
            />
          </FormField>

          <FormField
            label="Año de Construcción"
            hint="Año en que se construyó el edificio"
          >
            <Input
              type="number"
              name="year"
              placeholder="2020"
              min="1900"
              max={new Date().getFullYear()}
              className="touch-target"
            />
          </FormField>
        </FormSection>

        {/* Sección 3: Información Financiera */}
        <FormSection
          title="Información Financiera"
          description="Datos económicos del edificio"
        >
          <FormField
            label="Precio de Compra"
            hint="Precio de adquisición del edificio"
          >
            <Input
              type="number"
              name="purchasePrice"
              placeholder="500000"
              step="1000"
              className="touch-target"
            />
          </FormField>

          <FormField
            label="Renta Mensual Estimada"
            hint="Ingresos mensuales esperados"
          >
            <Input
              type="number"
              name="estimatedRevenue"
              placeholder="5000"
              step="100"
              className="touch-target"
            />
          </FormField>
        </FormSection>
      </MobileOptimizedForm>
    </AuthenticatedLayout>
  );
}

/**
 * EJEMPLO 3: Card con gestos de swipe
 * Card que responde a gestos táctiles
 */
export function SwipeableCardExample() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const properties = ['Propiedad 1', 'Propiedad 2', 'Propiedad 3'];

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (currentIndex < properties.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    },
    threshold: 50,
  });

  return (
    <Card {...swipeHandlers} className="swipeable touch-feedback">
      <CardHeader>
        <CardTitle>{properties[currentIndex]}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Desliza para ver más propiedades</p>
        <div className="mt-4 flex justify-center gap-2">
          {properties.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * EJEMPLO 4: Dashboard adaptativo
 * Dashboard que se adapta según el dispositivo
 */
export function AdaptiveDashboardExample() {
  const deviceType = useDeviceType();
  const isMobile = useIsMobile();

  const stats = [
    {
      label: 'Total Edificios',
      value: '24',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Inquilinos Activos',
      value: '156',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Ingresos Mensuales',
      value: '€45,000',
      icon: Euro,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Dispositivo: {deviceType}</p>
        </div>

        {/* Grid adaptativo */}
        <div
          className={`grid gap-4 ${
            isMobile
              ? 'grid-cols-1'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="touch-feedback">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contenido adicional según dispositivo */}
        {isMobile ? (
          <Card>
            <CardHeader>
              <CardTitle>Vista Móvil</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Contenido optimizado para dispositivos móviles.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Vista Desktop</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Contenido expandido para pantallas grandes.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

/**
 * EJEMPLO 5: Lista con pull-to-refresh
 * Lista simple que se puede actualizar arrastrando
 */
export function RefreshableListExample() {
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1', date: new Date().toLocaleDateString() },
    { id: 2, name: 'Item 2', date: new Date().toLocaleDateString() },
    { id: 3, name: 'Item 3', date: new Date().toLocaleDateString() },
  ]);

  const handleRefresh = async () => {
    // Simular carga de nuevos datos
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const newItem = {
      id: items.length + 1,
      name: `Item ${items.length + 1}`,
      date: new Date().toLocaleDateString(),
    };
    
    setItems([newItem, ...items]);
  };

  return (
    <AuthenticatedLayout>
      <h1 className="mb-6 text-3xl font-bold">Lista Actualizable</h1>
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="touch-feedback">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PullToRefresh>
    </AuthenticatedLayout>
  );
}
