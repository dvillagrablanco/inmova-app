'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Building2, 
  FileText, 
  Wrench, 
  Users,
  DollarSign,
  BarChart3,
  MapPin,
  Calendar,
  MessageSquare,
  Settings,
  ChevronRight,
  Info,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Module {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  icono?: string;
  activo: boolean;
  ruta: string;
  benefits: string[];
}

// Mapeo de iconos
const iconMap: Record<string, any> = {
  'TrendingUp': TrendingUp,
  'Building2': Building2,
  'FileText': FileText,
  'Wrench': Wrench,
  'Users': Users,
  'DollarSign': DollarSign,
  'BarChart3': BarChart3,
  'MapPin': MapPin,
  'Calendar': Calendar,
  'MessageSquare': MessageSquare,
  'Settings': Settings,
};

export default function InactiveModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    loadInactiveModules();
  }, []);

  const loadInactiveModules = async () => {
    try {
      const response = await fetch('/api/modules?status=inactive');
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      logger.error('Error loading inactive modules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateModule = async (moduleCode: string) => {
    try {
      const response = await fetch('/api/modules/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduloCodigo: moduleCode })
      });

      if (response.ok) {
        toast.success('Módulo activado correctamente', {
          description: 'Ya puedes acceder a sus funcionalidades desde el menú'
        });
        // Recargar módulos inactivos
        loadInactiveModules();
      } else {
        const error = await response.json();
        toast.error('Error al activar módulo', {
          description: error.message || 'Inténtalo nuevamente'
        });
      }
    } catch (error) {
      logger.error('Error activating module:', error);
      toast.error('Error al activar módulo');
    }
  };

  if (isLoading) {
    return null;
  }

  // No mostrar si no hay módulos inactivos
  if (!modules || modules.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Módulos Disponibles</CardTitle>
              <CardDescription>
                Expande tu plataforma activando módulos adicionales ({modules.length} disponibles)
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {modules.length} módulos
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.slice(0, 6).map((module) => {
            const IconComponent = module.icono ? iconMap[module.icono] : Settings;
            const isExpanded = expandedModule === module.codigo;

            return (
              <motion.div
                key={module.codigo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-border hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                        {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">{module.nombre}</h3>
                          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {module.descripcion}
                        </p>

                        {/* Beneficios (si están expandidos) */}
                        <AnimatePresence>
                          {isExpanded && module.benefits && module.benefits.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mb-3"
                            >
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {module.benefits.map((benefit, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <Zap className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleActivateModule(module.codigo)}
                            className="flex-1 h-8 text-xs"
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Activar
                          </Button>
                          {module.benefits && module.benefits.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedModule(isExpanded ? null : module.codigo)}
                              className="h-8 px-2"
                            >
                              <Info className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {modules.length > 6 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/modulos">
                Ver todos los módulos disponibles
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Info footer */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 Activa solo los módulos que necesites para mantener tu interfaz simple y enfocada
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
