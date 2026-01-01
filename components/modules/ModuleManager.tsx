'use client';

/**
 * GESTOR DE MÓDULOS
 * Permite activar/desactivar módulos según necesidades
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'advanced' | 'specialized' | 'premium';
  features: string[];
  estimatedLearningTime: number;
  dependencies?: string[];
}

export function ModuleManager() {
  const [activeModules, setActiveModules] = useState<Module[]>([]);
  const [allModules, setAllModules] = useState<{
    core: Module[];
    advanced: Module[];
    specialized: Module[];
    premium: Module[];
  }>({ core: [], advanced: [], specialized: [], premium: [] });
  const [loading, setLoading] = useState(true);
  const [experienceLevel, setExperienceLevel] = useState<string>('intermedio');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/modules?view=categories');
      const data = await response.json();

      if (data.success) {
        setActiveModules(data.activeModules);
        setAllModules(data.categories);
        setExperienceLevel(data.experienceLevel);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Error cargando módulos');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleId: string, currentlyActive: boolean) => {
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentlyActive ? 'deactivate' : 'activate',
          moduleId
        })
      });

      const data = await response.json();

      if (data.success) {
        setActiveModules(data.activeModules);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Error al cambiar módulo');
      }
    } catch (error) {
      console.error('Error toggling module:', error);
      toast.error('Error al cambiar módulo');
    }
  };

  const isModuleActive = (moduleId: string) => {
    return activeModules.some(m => m.id === moduleId);
  };

  const getCategoryColor = (category: Module['category']) => {
    switch (category) {
      case 'core': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'specialized': return 'bg-green-100 text-green-800';
      case 'premium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: Module['category']) => {
    switch (category) {
      case 'core': return 'Esencial';
      case 'advanced': return 'Avanzado';
      case 'specialized': return 'Especializado';
      case 'premium': return 'Premium';
      default: return category;
    }
  };

  const renderModuleCard = (module: Module) => {
    const active = isModuleActive(module.id);
    const hasDependencies = module.dependencies && module.dependencies.length > 0;

    return (
      <Card key={module.id} className={active ? 'border-blue-500' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{module.icon}</span>
              <div>
                <CardTitle className="text-lg">{module.name}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </div>
            </div>
            <Switch
              checked={active}
              onCheckedChange={() => toggleModule(module.id, active)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={getCategoryColor(module.category)}>
              {getCategoryLabel(module.category)}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-3 w-3" />
              <span>{module.estimatedLearningTime} min</span>
            </div>
          </div>

          {module.features.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Funcionalidades:</p>
              <ul className="space-y-1">
                {module.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasDependencies && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Requiere: {module.dependencies?.map(d => allModules.core.find(m => m.id === d)?.name || d).join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        {active && (
          <CardFooter className="bg-blue-50 border-t">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Módulo activo</span>
            </div>
          </CardFooter>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Gestión de Módulos</h2>
        <p className="text-gray-600 mt-1">
          Activa o desactiva módulos según tus necesidades
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">
            {activeModules.length} módulos activos
          </Badge>
          <Badge variant="outline" className="capitalize">
            Nivel: {experienceLevel}
          </Badge>
        </div>
      </div>

      {/* Alert de experiencia */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los módulos mostrados están adaptados a tu nivel de experiencia ({experienceLevel}). 
          Puedes activar o desactivar módulos en cualquier momento.
        </AlertDescription>
      </Alert>

      {/* Tabs por categoría */}
      <Tabs defaultValue="core" className="w-full">
        <TabsList>
          <TabsTrigger value="core">
            Esenciales ({allModules.core.length})
          </TabsTrigger>
          <TabsTrigger value="advanced">
            Avanzados ({allModules.advanced.length})
          </TabsTrigger>
          <TabsTrigger value="specialized">
            Especializados ({allModules.specialized.length})
          </TabsTrigger>
          <TabsTrigger value="premium">
            Premium ({allModules.premium.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {allModules.core.map(renderModuleCard)}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {allModules.advanced.map(renderModuleCard)}
          </div>
        </TabsContent>

        <TabsContent value="specialized" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {allModules.specialized.map(renderModuleCard)}
          </div>
        </TabsContent>

        <TabsContent value="premium" className="space-y-4 mt-6">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Los módulos premium pueden requerir configuración adicional o suscripción.
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 md:grid-cols-2">
            {allModules.premium.map(renderModuleCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
