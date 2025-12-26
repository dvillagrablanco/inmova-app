'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Sparkles, Zap, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

/**
 * PÁGINA DE CONFIGURACIÓN DE MODO UI
 *
 * Permite al usuario cambiar entre Simple / Standard / Advanced
 */
export default function UIModePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<string>('standard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar el modo actual
  useEffect(() => {
    const fetchCurrentMode = async () => {
      try {
        const res = await fetch('/api/user/ui-mode');
        if (res.ok) {
          const data = await res.json();
          setCurrentMode(data.profile.uiMode || 'standard');
        }
      } catch (error) {
        console.error('Error al cargar modo UI:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchCurrentMode();
    }
  }, [status]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/ui-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uiMode: currentMode }),
      });

      if (res.ok) {
        toast.success('Modo de interfaz actualizado correctamente');
        // Recargar la página para aplicar cambios
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        toast.error('Error al actualizar el modo');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modo de Interfaz</h1>
          <p className="text-muted-foreground mt-2">
            Personaliza cómo se muestra INMOVA según tu nivel de experiencia
          </p>
        </div>

        {/* Selector de Modo */}
        <Card>
          <CardHeader>
            <CardTitle>Elige tu modo de interfaz</CardTitle>
            <CardDescription>
              Puedes cambiar esto en cualquier momento desde Configuración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={currentMode} onValueChange={setCurrentMode}>
              {/* Modo Simple */}
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value="simple" id="simple" className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="simple" className="text-lg font-semibold cursor-pointer">
                          🌱 Modo Simple
                        </Label>
                        <Badge variant="secondary">Principiante</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Ideal para:</strong> Nuevos usuarios, propietarios con 1-5
                        propiedades
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Solo módulos esenciales</li>
                        <li>• Formularios simplificados (solo campos obligatorios)</li>
                        <li>• Dashboard con 4 métricas principales</li>
                        <li>• Tooltips de ayuda siempre visibles</li>
                        <li>• Acciones rápidas sugeridas</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modo Standard */}
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value="standard" id="standard" className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="standard" className="text-lg font-semibold cursor-pointer">
                          ⚡ Modo Estándar
                        </Label>
                        <Badge>Recomendado</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Ideal para:</strong> Usuarios con experiencia, 5-20 propiedades
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Módulos principales + intermedios</li>
                        <li>• Formularios estándar (campos importantes visibles)</li>
                        <li>• Dashboard con 6-8 métricas + gráficos básicos</li>
                        <li>• Tooltips opcionales</li>
                        <li>• Balance perfecto entre simplicidad y funcionalidad</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modo Advanced */}
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="advanced" className="text-lg font-semibold cursor-pointer">
                          🚀 Modo Avanzado
                        </Label>
                        <Badge variant="destructive">Experto</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Ideal para:</strong> Profesionales, +20 propiedades, power users
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Todos los módulos disponibles</li>
                        <li>• Formularios completos (todos los campos avanzados)</li>
                        <li>• Dashboard detallado con todas las métricas y gráficos</li>
                        <li>• Sin tooltips (interfaz limpia)</li>
                        <li>• Máximo control y personalización</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>

            {/* Botón Guardar */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Adicional */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 ¿No sabes qué modo elegir?</h3>
            <p className="text-sm text-blue-800">
              Empieza con el <strong>Modo Estándar</strong>. Es el balance perfecto entre
              funcionalidad y simplicidad. Puedes cambiarlo en cualquier momento según tu
              experiencia evolucione.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
