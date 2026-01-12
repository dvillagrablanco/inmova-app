'use client';

/**
 * PÁGINA: Configuración
 * Gestión de preferencias, módulos, tours y cuenta - VERSIÓN SIMPLIFICADA
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimplifiedPreferences } from '@/components/preferences/SimplifiedPreferences';
import { SimplifiedModuleManager } from '@/components/modules/SimplifiedModuleManager';
import { ToursList } from '@/components/tours/ToursList';
import { AccountDeletion } from '@/components/account/AccountDeletion';
import { Settings, Sparkles, Video, UserCog } from 'lucide-react';

export default function ConfiguracionPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-gray-600 mt-2">
          Ajusta la aplicación a tu gusto y necesidades
        </p>
      </div>

      <Tabs defaultValue="preferencias" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
          <TabsTrigger value="preferencias" className="flex items-center gap-2">
            <Settings size={16} />
            Mi Experiencia
          </TabsTrigger>
          <TabsTrigger value="modulos" className="flex items-center gap-2">
            <Sparkles size={16} />
            Funciones
          </TabsTrigger>
          <TabsTrigger value="tours" className="flex items-center gap-2">
            <Video size={16} />
            Tutoriales
          </TabsTrigger>
          <TabsTrigger value="cuenta" className="flex items-center gap-2">
            <UserCog size={16} />
            Mi Cuenta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferencias" className="mt-6">
          <SimplifiedPreferences />
        </TabsContent>

        <TabsContent value="modulos" className="mt-6">
          <SimplifiedModuleManager />
        </TabsContent>

        <TabsContent value="tours" className="mt-6">
          <ToursList />
        </TabsContent>

        <TabsContent value="cuenta" className="mt-6">
          <AccountDeletion />
        </TabsContent>
      </Tabs>
    </div>
  );
}
