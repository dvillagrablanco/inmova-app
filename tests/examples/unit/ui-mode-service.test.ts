/**
 * UNIT TESTS: ui-mode-service
 * 
 * Tests para las funciones de lógica de adaptación de UI
 */

import {
  getRecommendedUIMode,
  getVisibleModules,
  shouldShowTooltips,
  shouldShowAdvancedFields,
  getDashboardDetailLevel,
  getVisibleFormFields,
} from '@/lib/ui-mode-service';
import type { UserProfile, FormFieldConfig } from '@/lib/ui-mode-service';

describe('ui-mode-service', () => {
  describe('getRecommendedUIMode', () => {
    it('debe recomendar "simple" para principiantes', () => {
      const profile: UserProfile = {
        experienceLevel: 'principiante',
        techSavviness: 'bajo',
        portfolioSize: 'size_1_5',
        uiMode: 'standard',
      };

      const result = getRecommendedUIMode(profile);
      expect(result).toBe('simple');
    });

    it('debe recomendar "advanced" para expertos con portfolio grande', () => {
      const profile: UserProfile = {
        experienceLevel: 'avanzado',
        techSavviness: 'alto',
        portfolioSize: 'size_100_plus',
        uiMode: 'standard',
      };

      const result = getRecommendedUIMode(profile);
      expect(result).toBe('advanced');
    });

    it('debe recomendar "standard" por defecto para intermedios', () => {
      const profile: UserProfile = {
        experienceLevel: 'intermedio',
        techSavviness: 'medio',
        portfolioSize: 'size_6_20',
        uiMode: 'standard',
      };

      const result = getRecommendedUIMode(profile);
      expect(result).toBe('standard');
    });

    it('debe recomendar "simple" si tech savviness es bajo', () => {
      const profile: UserProfile = {
        experienceLevel: 'intermedio',
        techSavviness: 'bajo',
        portfolioSize: 'size_6_20',
        uiMode: 'standard',
      };

      const result = getRecommendedUIMode(profile);
      expect(result).toBe('simple');
    });
  });

  describe('getVisibleModules', () => {
    it('debe filtrar módulos en modo simple', () => {
      const profile: UserProfile = {
        uiMode: 'simple',
        preferredModules: [],
        hiddenModules: [],
      };

      const modules = getVisibleModules('alquiler_tradicional', profile);
      const visibleModules = modules.filter((m) => m.visible);

      // En modo simple, solo se muestran módulos de baja complejidad o alta prioridad
      expect(visibleModules.length).toBeLessThan(8);
      expect(
        visibleModules.every((m) => m.complexity === 'low' || m.priority <= 4)
      ).toBe(true);
    });

    it('debe mostrar todos los módulos en modo advanced', () => {
      const profile: UserProfile = {
        uiMode: 'advanced',
        preferredModules: [],
        hiddenModules: [],
      };

      const modules = getVisibleModules('alquiler_tradicional', profile);

      // En modo advanced, todos los módulos deben ser visibles
      expect(modules.every((m) => m.visible)).toBe(true);
    });

    it('debe respetar módulos ocultos explícitamente', () => {
      const profile: UserProfile = {
        uiMode: 'advanced',
        preferredModules: [],
        hiddenModules: ['analytics', 'documentos'],
      };

      const modules = getVisibleModules('alquiler_tradicional', profile);
      const analytics = modules.find((m) => m.id === 'analytics');
      const documentos = modules.find((m) => m.id === 'documentos');

      expect(analytics?.visible).toBe(false);
      expect(analytics?.reason).toBe('hidden_by_user');
      expect(documentos?.visible).toBe(false);
    });

    it('debe destacar módulos preferidos', () => {
      const profile: UserProfile = {
        uiMode: 'standard',
        preferredModules: ['edificios', 'contratos'],
        hiddenModules: [],
      };

      const modules = getVisibleModules('alquiler_tradicional', profile);
      const edificios = modules.find((m) => m.id === 'edificios');
      const contratos = modules.find((m) => m.id === 'contratos');

      expect(edificios?.visible).toBe(true);
      expect(edificios?.featured).toBe(true);
      expect(edificios?.reason).toBe('preferred');
      expect(contratos?.featured).toBe(true);
    });

    it('debe funcionar correctamente para vertical STR', () => {
      const profile: UserProfile = {
        uiMode: 'standard',
        preferredModules: [],
        hiddenModules: [],
      };

      const modules = getVisibleModules('str', profile);
      const str = modules.find((m) => m.id === 'str');

      expect(str).toBeDefined();
      expect(str?.visible).toBe(true);
    });
  });

  describe('shouldShowTooltips', () => {
    it('debe mostrar tooltips para principiantes', () => {
      const profile: UserProfile = {
        experienceLevel: 'principiante',
        techSavviness: 'medio',
        uiMode: 'standard',
      };

      expect(shouldShowTooltips(profile)).toBe(true);
    });

    it('debe mostrar tooltips para tech savviness bajo', () => {
      const profile: UserProfile = {
        experienceLevel: 'intermedio',
        techSavviness: 'bajo',
        uiMode: 'standard',
      };

      expect(shouldShowTooltips(profile)).toBe(true);
    });

    it('debe mostrar tooltips en modo simple', () => {
      const profile: UserProfile = {
        experienceLevel: 'avanzado',
        techSavviness: 'alto',
        uiMode: 'simple',
      };

      expect(shouldShowTooltips(profile)).toBe(true);
    });

    it('no debe mostrar tooltips para avanzados', () => {
      const profile: UserProfile = {
        experienceLevel: 'avanzado',
        techSavviness: 'alto',
        uiMode: 'advanced',
      };

      expect(shouldShowTooltips(profile)).toBe(false);
    });
  });

  describe('shouldShowAdvancedFields', () => {
    it('debe mostrar campos avanzados en modo advanced', () => {
      const profile: UserProfile = {
        uiMode: 'advanced',
      };

      expect(shouldShowAdvancedFields(profile)).toBe(true);
    });

    it('no debe mostrar campos avanzados en otros modos', () => {
      expect(shouldShowAdvancedFields({ uiMode: 'simple' })).toBe(false);
      expect(shouldShowAdvancedFields({ uiMode: 'standard' })).toBe(false);
    });
  });

  describe('getDashboardDetailLevel', () => {
    it('debe devolver "basic" para modo simple', () => {
      expect(getDashboardDetailLevel({ uiMode: 'simple' })).toBe('basic');
    });

    it('debe devolver "detailed" para modo advanced', () => {
      expect(getDashboardDetailLevel({ uiMode: 'advanced' })).toBe('detailed');
    });

    it('debe devolver "standard" por defecto', () => {
      expect(getDashboardDetailLevel({ uiMode: 'standard' })).toBe('standard');
    });
  });

  describe('getVisibleFormFields', () => {
    const mockFields: FormFieldConfig[] = [
      {
        name: 'nombre',
        label: 'Nombre',
        type: 'text',
        required: true,
        visible: true,
        complexity: 'low',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        visible: true,
        complexity: 'low',
      },
      {
        name: 'referencia',
        label: 'Referencia Catastral',
        type: 'text',
        required: false,
        visible: true,
        complexity: 'high',
        helpText: 'Número de 20 dígitos',
      },
      {
        name: 'coordenadas',
        label: 'Coordenadas GPS',
        type: 'text',
        required: false,
        visible: true,
        complexity: 'medium',
      },
    ];

    it('debe mostrar solo campos obligatorios y baja complejidad en modo simple', () => {
      const profile: UserProfile = { uiMode: 'simple' };
      const visible = getVisibleFormFields(mockFields, profile);

      expect(visible).toHaveLength(2); // nombre y email
      expect(visible.every((f) => f.required || f.complexity === 'low')).toBe(true);
    });

    it('debe mostrar obligatorios + baja y media complejidad en modo standard', () => {
      const profile: UserProfile = { uiMode: 'standard' };
      const visible = getVisibleFormFields(mockFields, profile);

      expect(visible).toHaveLength(3); // nombre, email, coordenadas
      expect(visible.find((f) => f.name === 'referencia')).toBeUndefined();
    });

    it('debe mostrar todos los campos en modo advanced', () => {
      const profile: UserProfile = { uiMode: 'advanced' };
      const visible = getVisibleFormFields(mockFields, profile);

      expect(visible).toHaveLength(4); // todos
    });
  });
});
