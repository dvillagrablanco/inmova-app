'use client';

/**
 * GESTOR DE FUNCIONES SIMPLIFICADO
 * Lenguaje claro sin términos técnicos
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Circle,
  Star,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleModule {
  id: string;
  name: string;
  simpleDescription: string;  // Descripción en lenguaje claro
  whatYouCanDo: string[];     // Lista de cosas que puedes hacer
  isActive: boolean;
  isRecommended: boolean;
  category: 'essential' | 'useful' | 'advanced';
}

const MODULE_CATEGORIES = {
  essential: {
    title: 'Funciones Básicas',
    subtitle: 'Lo esencial para empezar',
    color: 'blue'
  },
  useful: {
    title: 'Funciones Útiles',
    subtitle: 'Para sacar más provecho',
    color: 'purple'
  },
  advanced: {
    title: 'Funciones Avanzadas',
    subtitle: 'Para usuarios experimentados',
    color: 'green'
  }
};

export function SimplifiedModuleManager() {
  const [modules, setModules] = useState<SimpleModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const response = await fetch('/api/modules?view=all');
      const data = await response.json();

      if (data.success) {
        // Convertir módulos técnicos a lenguaje simple
        const simplified = convertToSimpleModules(data.modules);
        setModules(simplified);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Error cargando funciones');
    } finally {
      setLoading(false);
    }
  };

  const convertToSimpleModules = (technicalModules: any[]): SimpleModule[] => {
    // Mapeo de módulos técnicos a lenguaje simple
    const simpleDescriptions: Record<string, any> = {
      edificios: {
        name: 'Edificios y Propiedades',
        simpleDescription: 'Guarda información de tus inmuebles: direcciones, fotos, documentos.',
        whatYouCanDo: [
          'Ver todos tus edificios en un mapa',
          'Subir fotos de cada propiedad',
          'Guardar documentos importantes',
          'Organizar por zonas o ciudades'
        ],
        category: 'essential'
      },
      unidades: {
        name: 'Pisos y Locales',
        simpleDescription: 'Cada piso o local dentro de un edificio.',
        whatYouCanDo: [
          'Ver qué pisos están ocupados',
          'Marcar pisos disponibles para alquilar',
          'Guardar características (habitaciones, baños, etc.)',
          'Subir fotos de cada piso'
        ],
        category: 'essential'
      },
      inquilinos: {
        name: 'Inquilinos',
        simpleDescription: 'Información de las personas que alquilan contigo.',
        whatYouCanDo: [
          'Ver datos de contacto de cada inquilino',
          'Enviar mensajes directos',
          'Ver historial de pagos',
          'Guardar documentos (DNI, nóminas, etc.)'
        ],
        category: 'essential'
      },
      contratos: {
        name: 'Contratos de Alquiler',
        simpleDescription: 'Todos tus contratos organizados y fáciles de encontrar.',
        whatYouCanDo: [
          'Crear contratos desde plantillas',
          'Firmar digitalmente sin papeles',
          'Ver contratos que vencen pronto',
          'Descargar contratos en PDF'
        ],
        category: 'essential'
      },
      pagos: {
        name: 'Pagos y Cobros',
        simpleDescription: 'Control de todos los pagos: alquileres, facturas, gastos.',
        whatYouCanDo: [
          'Ver qué pagos están pendientes',
          'Marcar pagos como cobrados',
          'Ver historial completo',
          'Generar recordatorios automáticos'
        ],
        category: 'essential'
      },
      mantenimiento: {
        name: 'Mantenimiento y Averías',
        simpleDescription: 'Registro de reparaciones, averías y trabajos en las propiedades.',
        whatYouCanDo: [
          'Anotar averías cuando ocurren',
          'Asignar trabajos a proveedores',
          'Subir fotos del problema',
          'Ver historial de reparaciones'
        ],
        category: 'useful'
      },
      calendario: {
        name: 'Calendario',
        simpleDescription: 'Agenda de vencimientos, citas y recordatorios.',
        whatYouCanDo: [
          'Ver todos los vencimientos de contratos',
          'Agendar visitas a propiedades',
          'Recordatorios de pagos',
          'Sincronizar con tu calendario personal'
        ],
        category: 'useful'
      },
      chat: {
        name: 'Mensajería',
        simpleDescription: 'Comunícate con inquilinos, proveedores y tu equipo.',
        whatYouCanDo: [
          'Enviar mensajes a inquilinos',
          'Crear grupos de conversación',
          'Historial de todas las conversaciones',
          'Recibir respuestas por email'
        ],
        category: 'useful'
      },
      documentos: {
        name: 'Documentos',
        simpleDescription: 'Biblioteca de todos tus archivos y documentos importantes.',
        whatYouCanDo: [
          'Subir cualquier tipo de documento',
          'Organizar en carpetas',
          'Buscar documentos por nombre',
          'Compartir con inquilinos o proveedores'
        ],
        category: 'useful'
      },
      reportes: {
        name: 'Informes y Estadísticas',
        simpleDescription: 'Reportes automáticos de ingresos, gastos y ocupación.',
        whatYouCanDo: [
          'Ver ingresos por mes o año',
          'Comparar gastos vs ingresos',
          'Exportar a Excel',
          'Generar reportes para impuestos'
        ],
        category: 'advanced'
      },
      crm: {
        name: 'Gestión de Contactos',
        simpleDescription: 'Base de datos de todos tus contactos: inquilinos, proveedores, clientes.',
        whatYouCanDo: [
          'Guardar todos tus contactos',
          'Anotar llamadas y reuniones',
          'Ver historial de interacciones',
          'Buscar contactos rápidamente'
        ],
        category: 'advanced'
      }
    };

    return technicalModules.map(mod => {
      const simple = simpleDescriptions[mod.id] || {
        name: mod.name,
        simpleDescription: mod.description,
        whatYouCanDo: mod.features || [],
        category: 'useful'
      };

      return {
        id: mod.id,
        name: simple.name,
        simpleDescription: simple.simpleDescription,
        whatYouCanDo: simple.whatYouCanDo,
        isActive: mod.isActive || false,
        isRecommended: mod.isRecommended || false,
        category: simple.category
      };
    });
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
        // Actualizar estado local
        setModules(prev => prev.map(m => 
          m.id === moduleId ? { ...m, isActive: !currentlyActive } : m
        ));
        toast.success(currentlyActive ? 'Función desactivada' : 'Función activada');
      } else {
        toast.error(data.error || 'No se pudo cambiar');
      }
    } catch (error) {
      console.error('Error toggling module:', error);
      toast.error('Error al cambiar. Verifica tu conexión');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      essential: 'blue',
      useful: 'purple',
      advanced: 'green'
    };
    return colors[category] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Agrupar por categoría
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, SimpleModule[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Activa las funciones que necesites</h2>
            <p className="text-gray-600">
              Empieza con lo básico. Puedes activar más funciones cuando las necesites. Las funciones desactivadas no aparecen en el menú.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Funciones activas</p>
              <p className="text-3xl font-bold text-gray-900">
                {modules.filter(m => m.isActive).length} de {modules.length}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Activar todas las esenciales
                modules.filter(m => m.category === 'essential' && !m.isActive).forEach(m => {
                  toggleModule(m.id, false);
                });
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Activar básicas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Categories */}
      {(['essential', 'useful', 'advanced'] as const).map(categoryKey => {
        const category = MODULE_CATEGORIES[categoryKey];
        const categoryModules = modulesByCategory[categoryKey] || [];

        if (categoryModules.length === 0) return null;

        return (
          <div key={categoryKey} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center gap-3">
              <div className={`h-1 w-12 rounded-full bg-${category.color}-500`}></div>
              <div>
                <h3 className="font-semibold text-gray-900">{category.title}</h3>
                <p className="text-sm text-gray-600">{category.subtitle}</p>
              </div>
            </div>

            {/* Modules in Category */}
            <div className="grid gap-3 md:grid-cols-2">
              {categoryModules.map(module => (
                <Card 
                  key={module.id}
                  className={`transition-all duration-200 ${module.isActive ? 'border-2 border-indigo-200 shadow-md' : 'border-gray-200'}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{module.name}</CardTitle>
                          {module.isRecommended && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {module.simpleDescription}
                        </CardDescription>
                      </div>
                      <Switch
                        checked={module.isActive}
                        onCheckedChange={() => toggleModule(module.id, module.isActive)}
                      />
                    </div>
                  </CardHeader>

                  {/* Expandable Details */}
                  {expandedModule === module.id ? (
                    <CardContent className="pt-0">
                      <div className="space-y-2 mb-3">
                        <p className="text-sm font-medium text-gray-700">¿Qué puedes hacer?</p>
                        <ul className="space-y-1">
                          {module.whatYouCanDo.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedModule(null)}
                        className="w-full"
                      >
                        Ver menos
                        <ChevronUp className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  ) : (
                    <CardContent className="pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedModule(module.id)}
                        className="w-full"
                      >
                        Ver más detalles
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Help Card */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>¿Necesitas ayuda?</strong> Si no estás seguro de qué funciones activar, empieza con las básicas.
          Puedes activar más funciones cuando las necesites. Los cambios son instantáneos.
        </AlertDescription>
      </Alert>
    </div>
  );
}
