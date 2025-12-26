'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { categorizeTicket } from '@/lib/ai-automation-service';
import { AIAssistant } from '@/components/automation/AIAssistant';
import { logError } from '@/lib/logger';

export default function SoportePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
  });
  const [categorization, setCategorization] = useState<any>(null);
  const [showAutoResponse, setShowAutoResponse] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  const handleAnalyze = async () => {
    if (!formData.subject || !formData.description) {
      toast.error('Por favor completa el asunto y la descripción');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await categorizeTicket({
        subject: formData.subject,
        description: formData.description,
      });
      setCategorization(result);
      setShowAutoResponse(!!result.autoResponse);
      toast.success('Ticket categorizado automáticamente');
    } catch (error) {
      toast.error('Error al analizar el ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.description) {
      toast.error('Por favor completa el asunto y la descripción');
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear el ticket con respuesta automática de IA
      const response = await fetch('/api/support/ai-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          category: categorization?.category || 'question',
          priority: categorization?.priority || 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el ticket');
      }

      const data = await response.json();

      // Mostrar la respuesta de IA
      if (data.aiResponse) {
        setCategorization(data.aiResponse);
        setShowAutoResponse(true);
      }

      toast.success(
        data.aiResponse?.canAutoResolve
          ? '¡Tu consulta ha sido resuelta automáticamente!'
          : '¡Ticket creado exitosamente! Te contactaremos pronto.'
      );

      // Reset después de 3 segundos para que el usuario pueda ver la respuesta
      setTimeout(() => {
        setFormData({ subject: '', description: '' });
        setCategorization(null);
        setShowAutoResponse(false);
      }, 3000);
    } catch (error) {
      toast.error('Error al crear el ticket');
      logError(
        new Error(error instanceof Error ? error.message : 'Error creating support ticket'),
        {
          context: 'SoportePage - handleAnalyze',
          subject: formData.subject,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
      high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      medium: { label: 'Media', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Baja', className: 'bg-green-100 text-green-800' },
    };
    const variant = variants[priority] || variants.medium;
    return (
      <Badge variant="secondary" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: 'Técnico',
      billing: 'Facturación',
      feature_request: 'Solicitud de funcionalidad',
      bug: 'Error/Bug',
      training: 'Capacitación',
      general: 'General',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-4xl mx-auto">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Soporte</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Centro de Soporte</h1>
              <p className="text-muted-foreground">
                Estamos aquí para ayudarte. Nuestro sistema de IA categorizará automáticamente tu
                consulta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/knowledge-base')}
              >
                <CardHeader>
                  <BookOpen className="h-8 w-8 text-indigo-600 mb-2" />
                  <CardTitle className="text-lg">Base de Conocimientos</CardTitle>
                  <CardDescription>
                    Encuentra respuestas rápidas en nuestra documentación
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <MessageSquare className="h-8 w-8 text-indigo-600 mb-2" />
                  <CardTitle className="text-lg">Asistente IA</CardTitle>
                  <CardDescription>Chatea con nuestro asistente inteligente 24/7</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <HelpCircle className="h-8 w-8 text-indigo-600 mb-2" />
                  <CardTitle className="text-lg">Crear Ticket</CardTitle>
                  <CardDescription>Nuestro equipo te responderá en menos de 24h</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Crear Ticket de Soporte</CardTitle>
                <CardDescription>
                  Completa el formulario y nuestro sistema lo categorizará automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Asunto*</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Ej: No puedo crear un contrato"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción detallada*</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe tu problema o consulta con el mayor detalle posible..."
                      required
                      rows={6}
                    />
                  </div>

                  {categorization && (
                    <Card className="bg-indigo-50 border-indigo-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Categorización Automática
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Categoría:</span>
                          <Badge variant="secondary">
                            {getCategoryLabel(categorization.category)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Prioridad:</span>
                          {getPriorityBadge(categorization.priority)}
                        </div>
                        {categorization.suggestedAssignee && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Asignado a:</span>
                            <span className="text-sm">{categorization.suggestedAssignee}</span>
                          </div>
                        )}
                        {categorization.relatedArticles &&
                          categorization.relatedArticles.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">
                                Artículos relacionados que pueden ayudarte:
                              </p>
                              <div className="space-y-2">
                                {categorization.relatedArticles.map((article: any, idx: number) => (
                                  <Button
                                    key={idx}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(article.url)}
                                    className="w-full justify-start text-left"
                                  >
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    {article.title}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  )}

                  {showAutoResponse && categorization?.autoResponse && (
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Respuesta Automática
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {categorization.autoResponse}
                        </p>
                        <div className="mt-4 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData({ subject: '', description: '' });
                              setCategorization(null);
                              setShowAutoResponse(false);
                              toast.success('Problema resuelto');
                            }}
                          >
                            Problema resuelto
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAutoResponse(false)}
                          >
                            Aún necesito ayuda
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-3">
                    {!categorization ? (
                      <Button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isSubmitting}
                        className="flex-1 gradient-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analizando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Analizar Ticket
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 gradient-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Ticket
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}
