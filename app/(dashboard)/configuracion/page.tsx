export const metadata = {
  title: 'Configuración | Inmova',
  description: 'Configura tu experiencia y módulos activos'
};

/**
 * PÁGINA: Configuración
 * Gestión de preferencias, módulos y tours
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PreferencesPanel } from '@/components/preferences/PreferencesPanel';
import { ModuleManager } from '@/components/modules/ModuleManager';
import { ToursList } from '@/components/tours/ToursList';

export default function ConfiguracionPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-gray-600 mt-2">
          Personaliza tu experiencia en la plataforma
        </p>
      </div>

      <Tabs defaultValue="preferencias" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="preferencias">
            ⚙️ Preferencias
          </TabsTrigger>
          <TabsTrigger value="modulos">
            📦 Módulos
          </TabsTrigger>
          <TabsTrigger value="tours">
            🎓 Tours
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferencias" className="mt-6">
          <PreferencesPanel />
        </TabsContent>

        <TabsContent value="modulos" className="mt-6">
          <ModuleManager />
        </TabsContent>

        <TabsContent value="tours" className="mt-6">
          <ToursList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
