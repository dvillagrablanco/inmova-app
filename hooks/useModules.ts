'use client';

/**
 * HOOK: useModules
 * Gestión de módulos activos del usuario
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

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

export function useModules() {
  const { data: session } = useSession();
  const [activeModules, setActiveModules] = useState<Module[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [recommendedModules, setRecommendedModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      
      // Obtener módulos activos
      const activeResponse = await fetch('/api/modules?view=active');
      const activeData = await activeResponse.json();

      if (activeData.success) {
        setActiveModules(activeData.modules || []);
      }

      // Obtener todos los módulos
      const allResponse = await fetch('/api/modules?view=all');
      const allData = await allResponse.json();

      if (allData.success) {
        setAllModules(allData.allModules || []);
      }

      // Obtener recomendados
      const recommendedResponse = await fetch('/api/modules?view=recommended');
      const recommendedData = await recommendedResponse.json();

      if (recommendedData.success) {
        setRecommendedModules(recommendedData.modules || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const activateModule = async (moduleId: string) => {
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          moduleId
        })
      });

      const data = await response.json();

      if (data.success) {
        setActiveModules(data.activeModules);
        return { success: true };
      }

      return { success: false, error: data.error };
    } catch (error: any) {
      console.error('Error activating module:', error);
      return { success: false, error: error.message };
    }
  };

  const deactivateModule = async (moduleId: string) => {
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          moduleId
        })
      });

      const data = await response.json();

      if (data.success) {
        setActiveModules(data.activeModules);
        return { success: true };
      }

      return { success: false, error: data.error };
    } catch (error: any) {
      console.error('Error deactivating module:', error);
      return { success: false, error: error.message };
    }
  };

  const isModuleActive = (moduleId: string) => {
    return activeModules.some(m => m.id === moduleId);
  };

  return {
    activeModules,
    allModules,
    recommendedModules,
    loading,
    activateModule,
    deactivateModule,
    isModuleActive,
    refetch: fetchModules
  };
}
