'use client';

/**
 * PANEL DE PREFERENCIAS
 * Configuración de experiencia, tooltips, chatbot, etc.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Preferences {
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado';
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  enableTooltips: boolean;
  enableChatbot: boolean;
  enableVideos: boolean;
  autoplayTours: boolean;
  notificationsEnabled: boolean;
  activeModules: string[];
}

interface Stats {
  totalModules: number;
  activeModules: number;
  completedTours: number;
  experienceLevel: string;
  utilizationRate: number;
}

export function PreferencesPanel() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/preferences?stats=true');
      const data = await response.json();

      if (data.success) {
        setPreferences(data.preferences);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Error cargando preferencias');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (adjustModules: boolean = false) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          adjustModulesOnExperienceChange: adjustModules
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        if (adjustModules && data.activeModules) {
          setPreferences(prev => prev ? { ...prev, activeModules: data.activeModules } : null);
        }
        fetchPreferences(); // Refrescar stats
      } else {
        toast.error(data.error || 'Error guardando preferencias');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error guardando preferencias');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
  };

  const getExperienceLevelDescription = (level: string) => {
    switch (level) {
      case 'principiante':
        return 'Incluye videos, tooltips y asistencia paso a paso';
      case 'intermedio':
        return 'Balance entre guía y autonomía';
      case 'avanzado':
        return 'Acceso directo sin tutoriales, máxima velocidad';
      default:
        return '';
    }
  };

  if (loading || !preferences) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Preferencias</h2>
        <p className="text-gray-600 mt-1">
          Personaliza tu experiencia en la plataforma
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.activeModules}</div>
              <p className="text-sm text-gray-600">Módulos activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.completedTours}</div>
              <p className="text-sm text-gray-600">Tours completados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.utilizationRate}%</div>
              <p className="text-sm text-gray-600">Utilización</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Badge className="capitalize">{stats.experienceLevel}</Badge>
              <p className="text-sm text-gray-600 mt-1">Nivel actual</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nivel de Experiencia */}
      <Card>
        <CardHeader>
          <CardTitle>Nivel de Experiencia</CardTitle>
          <CardDescription>
            Ajusta el nivel de asistencia y tutoriales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecciona tu nivel</Label>
            <Select
              value={preferences.experienceLevel}
              onValueChange={(value: any) => updatePreference('experienceLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="principiante">
                  🌱 Principiante
                </SelectItem>
                <SelectItem value="intermedio">
                  📈 Intermedio
                </SelectItem>
                <SelectItem value="avanzado">
                  🚀 Avanzado
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              {getExperienceLevelDescription(preferences.experienceLevel)}
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Al cambiar el nivel, puedes optar por ajustar automáticamente los módulos activos 
              según las recomendaciones para ese nivel.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={() => savePreferences(false)}>
              <Save className="h-4 w-4 mr-2" />
              Guardar solo nivel
            </Button>
            <Button variant="outline" onClick={() => savePreferences(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Guardar y ajustar módulos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Asistencia Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Asistencia Visual</CardTitle>
          <CardDescription>
            Configura tooltips, videos y elementos de ayuda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tooltips</Label>
              <p className="text-sm text-gray-600">
                Mostrar ayuda contextual al pasar el mouse
              </p>
            </div>
            <Switch
              checked={preferences.enableTooltips}
              onCheckedChange={(checked) => updatePreference('enableTooltips', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Videos tutoriales</Label>
              <p className="text-sm text-gray-600">
                Incluir videos en tours y guías
              </p>
            </div>
            <Switch
              checked={preferences.enableVideos}
              onCheckedChange={(checked) => updatePreference('enableVideos', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tours automáticos</Label>
              <p className="text-sm text-gray-600">
                Iniciar tours al acceder a nuevas secciones
              </p>
            </div>
            <Switch
              checked={preferences.autoplayTours}
              onCheckedChange={(checked) => updatePreference('autoplayTours', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chatbot */}
      <Card>
        <CardHeader>
          <CardTitle>Chatbot de Ayuda</CardTitle>
          <CardDescription>
            Asistente virtual para soporte y guía
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Chatbot activado</Label>
              <p className="text-sm text-gray-600">
                Muestra el chatbot en la esquina inferior derecha
              </p>
            </div>
            <Switch
              checked={preferences.enableChatbot}
              onCheckedChange={(checked) => updatePreference('enableChatbot', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>
            Tema e idioma de la interfaz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value: any) => updatePreference('theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">☀️ Claro</SelectItem>
                <SelectItem value="dark">🌙 Oscuro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select
              value={preferences.language}
              onValueChange={(value: any) => updatePreference('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>
            Alertas y avisos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones activadas</Label>
              <p className="text-sm text-gray-600">
                Recibe avisos de pagos, vencimientos y más
              </p>
            </div>
            <Switch
              checked={preferences.notificationsEnabled}
              onCheckedChange={(checked) => updatePreference('notificationsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guardar cambios */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={fetchPreferences}>
          Cancelar
        </Button>
        <Button onClick={() => savePreferences(false)} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
