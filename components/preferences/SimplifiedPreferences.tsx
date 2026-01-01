'use client';

/**
 * CONFIGURACIÓN SIMPLIFICADA
 * Para usuarios no técnicos - lenguaje claro y simple
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Eye, 
  EyeOff, 
  Video, 
  MessageCircle, 
  Bell, 
  Sparkles,
  Save,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface SimplePreferences {
  showHelp: boolean;         // Mostrar ayuda y tutoriales
  showVideos: boolean;        // Mostrar videos explicativos
  chatbotActive: boolean;     // Asistente virtual activo
  notifications: boolean;     // Recibir notificaciones
  autoStart: boolean;         // Tutoriales automáticos
}

const PREFERENCE_CARDS = [
  {
    id: 'showHelp',
    icon: Eye,
    title: 'Ayuda Visual',
    description: 'Muestra consejos y explicaciones en toda la aplicación',
    subtitle: 'Recomendado si estás empezando',
    color: 'blue'
  },
  {
    id: 'showVideos',
    icon: Video,
    title: 'Videos Tutoriales',
    description: 'Incluye videos cortos que explican cómo usar cada función',
    subtitle: 'Videos de 1-2 minutos',
    color: 'purple'
  },
  {
    id: 'chatbotActive',
    icon: MessageCircle,
    title: 'Asistente Virtual',
    description: 'Un ayudante disponible 24/7 que responde tus preguntas',
    subtitle: 'Respuestas instantáneas',
    color: 'green'
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notificaciones',
    description: 'Avisos sobre pagos, contratos próximos a vencer y tareas pendientes',
    subtitle: 'Solo lo importante',
    color: 'orange'
  },
  {
    id: 'autoStart',
    icon: Sparkles,
    title: 'Tutoriales Automáticos',
    description: 'Guías paso a paso cuando entras a una sección nueva',
    subtitle: 'Puedes saltarlos cuando quieras',
    color: 'pink'
  }
];

export function SimplifiedPreferences() {
  const [preferences, setPreferences] = useState<SimplePreferences>({
    showHelp: true,
    showVideos: true,
    chatbotActive: true,
    notifications: true,
    autoStart: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      const data = await response.json();

      if (data.success) {
        // Mapear preferencias técnicas a simples
        setPreferences({
          showHelp: data.preferences.enableTooltips ?? true,
          showVideos: data.preferences.enableVideos ?? true,
          chatbotActive: data.preferences.enableChatbot ?? true,
          notifications: data.preferences.notificationsEnabled ?? true,
          autoStart: data.preferences.autoplayTours ?? true
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key: keyof SimplePreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);

      // Mapear preferencias simples a técnicas
      const technicalPrefs = {
        enableTooltips: preferences.showHelp,
        enableVideos: preferences.showVideos,
        enableChatbot: preferences.chatbotActive,
        notificationsEnabled: preferences.notifications,
        autoplayTours: preferences.autoStart
      };

      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(technicalPrefs)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Configuración guardada correctamente');
        setHasChanges(false);
      } else {
        toast.error('Error al guardar. Intenta de nuevo');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar. Verifica tu conexión');
    } finally {
      setSaving(false);
    }
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Personaliza tu experiencia</h2>
            <p className="text-gray-600">
              Configura la aplicación según tu nivel de experiencia. Si eres nuevo, te recomendamos dejar todo activado.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <strong>¿No estás seguro qué activar?</strong> No te preocupes. Puedes cambiar estas opciones
                cuando quieras. Recomendamos empezar con todo activado y desactivar lo que no necesites más adelante.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preference Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {PREFERENCE_CARDS.map((card, index) => {
          const Icon = card.icon;
          const isActive = preferences[card.id as keyof SimplePreferences];

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full transition-all duration-200 ${isActive ? 'border-2 border-indigo-200 shadow-md' : 'border-gray-200'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorClass(card.color)} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => togglePreference(card.id as keyof SimplePreferences)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Preset Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración rápida</CardTitle>
          <CardDescription>O elige una configuración predefinida</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setPreferences({
                showHelp: true,
                showVideos: true,
                chatbotActive: true,
                notifications: true,
                autoStart: true
              });
              setHasChanges(true);
            }}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Soy nuevo
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPreferences({
                showHelp: true,
                showVideos: false,
                chatbotActive: true,
                notifications: true,
                autoStart: false
              });
              setHasChanges(true);
            }}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Tengo experiencia
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPreferences({
                showHelp: false,
                showVideos: false,
                chatbotActive: false,
                notifications: true,
                autoStart: false
              });
              setHasChanges(true);
            }}
            className="flex-1"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Modo avanzado
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        {hasChanges && (
          <p className="text-sm text-amber-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Hay cambios sin guardar
          </p>
        )}
        <Button
          onClick={savePreferences}
          disabled={!hasChanges || saving}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      {/* Success Message */}
      {!hasChanges && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">
            Configuración guardada. Los cambios se aplicarán inmediatamente.
          </p>
        </motion.div>
      )}
    </div>
  );
}
