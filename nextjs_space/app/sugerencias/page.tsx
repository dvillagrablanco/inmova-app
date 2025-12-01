'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lightbulb, Bug, Plus, ArrowLeft, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function SugerenciasPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'mejora_producto' as 'mejora_producto' | 'reporte_bug' | 'nueva_funcionalidad' | 'otro',
    prioridad: 'media' as 'baja' | 'media' | 'alta' | 'critica',
  });

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Recopilar información del navegador
      const navegador = navigator.userAgent;
      const sistemaOperativo = navigator.platform;
      const urlOrigen = window.location.href;

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          navegador,
          sistemaOperativo,
          urlOrigen,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar la sugerencia');
      }

      toast.success('¡Sugerencia enviada!', {
        description: 'Hemos recibido tu sugerencia. Te notificaremos cuando sea revisada.',
      });

      // Resetear formulario
      setFormData({
        titulo: '',
        descripcion: '',
        categoria: 'mejora_producto',
        prioridad: 'media',
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al enviar sugerencia', {
        description: error.message || 'Ocurrió un error al procesar tu solicitud',
      });
    } finally {
      setLoading(false);
    }
  };

  const categoriaIcons: Record<string, any> = {
    mejora_producto: Lightbulb,
    reporte_bug: Bug,
    nueva_funcionalidad: Plus,
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <PageHeader
        title="💡 Buzón de Sugerencias"
        description="Comparte tus ideas para mejorar la plataforma"
        action={
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      />

      <div className="grid gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Envía tu Sugerencia</CardTitle>
            <CardDescription>
              Tu opinión es muy importante para nosotros. Comparte tus ideas, reporta errores o propón nuevas funcionalidades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Resumen breve de tu sugerencia"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  minLength={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value: any) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mejora_producto">
                        <div className="flex items-center">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Mejora de Producto
                        </div>
                      </SelectItem>
                      <SelectItem value="reporte_bug">
                        <div className="flex items-center">
                          <Bug className="h-4 w-4 mr-2" />
                          Reporte de Error
                        </div>
                      </SelectItem>
                      <SelectItem value="nueva_funcionalidad">
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Funcionalidad
                        </div>
                      </SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value: any) => setFormData({ ...formData, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe tu sugerencia en detalle..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                  minLength={10}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Cuanto más detalles proporciones, mejor podremos entender y abordar tu sugerencia.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Sugerencia
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">👋 ¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Completa el formulario con tu sugerencia o reporte</li>
              <li>Nuestro equipo recibirá una notificación inmediata</li>
              <li>Revisaremos tu sugerencia y te responderemos</li>
              <li>Recibirás notificaciones sobre el estado de tu sugerencia</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}