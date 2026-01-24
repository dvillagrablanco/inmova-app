'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star, Book, MessageCircle, AlertCircle, ThumbsUp, Mail, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  guest: string;
  property: string;
  rating: number;
  date: string;
  comment: string;
  response?: string | null;
  respondedAt?: string | null;
}

interface Metrics {
  avgRating: number;
  totalReviews: number;
  guidesCount: number;
  avgResponseTimeMinutes: number;
}

export default function GuestExperiencePage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    avgRating: 0,
    totalReviews: 0,
    guidesCount: 0,
    avgResponseTimeMinutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/str-advanced/guest-experience');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar datos');
      }
      const data = (await response.json()) as { metrics: Metrics; reviews: Review[] };
      setMetrics(data.metrics);
      setReviews(data.reviews || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReviews = async () => {
    try {
      setIsRequesting(true);
      const response = await fetch('/api/str-advanced/guest-experience/request-reviews', {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error solicitando reseñas');
      }
      const data = (await response.json()) as { requested: number };
      toast.success('Solicitudes de reseñas enviadas', {
        description: `${data.requested} solicitudes generadas`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error solicitando reseñas';
      toast.error(message);
    } finally {
      setIsRequesting(false);
    }
  };

  const openResponseDialog = (review: Review, preset?: string) => {
    setSelectedReview(review);
    setResponseText(preset ?? review.response ?? '');
    setResponseDialogOpen(true);
  };

  const submitResponse = async () => {
    if (!selectedReview) return;
    if (responseText.trim().length < 2) {
      toast.error('La respuesta debe tener al menos 2 caracteres');
      return;
    }

    try {
      setIsResponding(true);
      const response = await fetch(
        `/api/str-advanced/guest-experience/reviews/${selectedReview.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response: responseText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al responder');
      }

      const data = (await response.json()) as {
        data: { id: string; response: string; respondedAt: string | null };
      };

      setReviews((prev) =>
        prev.map((review) =>
          review.id === data.data.id
            ? { ...review, response: data.data.response, respondedAt: data.data.respondedAt }
            : review
        )
      );
      toast.success('Respuesta enviada');
      setResponseDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al responder';
      toast.error(message);
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Guest Experience</h1>
              <p className="text-muted-foreground">Mejora la experiencia de tus huéspedes</p>
            </div>
            <Button onClick={() => router.push('/str-advanced')}>Volver al Dashboard</Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">
                  {loading ? '--' : metrics.avgRating.toFixed(1)}
                </div>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Reseñas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '--' : metrics.totalReviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Guías Digitales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '--' : metrics.guidesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Respuesta Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? '--' : `${metrics.avgResponseTimeMinutes}min`}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
            <TabsTrigger value="guides">Guías Digitales</TabsTrigger>
            <TabsTrigger value="issues">Incidencias</TabsTrigger>
            <TabsTrigger value="communication">Comunicación</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reseñas Recientes</CardTitle>
                    <CardDescription>Opiniones de tus huéspedes</CardDescription>
                  </div>
                  <Button onClick={handleRequestReviews} disabled={isRequesting || loading}>
                    <Mail className="h-4 w-4 mr-2" />
                    {isRequesting ? 'Enviando...' : 'Solicitar Reseñas'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  {reviews.length === 0 && !loading && (
                    <div className="text-center text-muted-foreground py-8">
                      No hay reseñas registradas
                    </div>
                  )}
                  {reviews.map((review) => (
                    <Card key={review.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{review.guest}</h3>
                              <p className="text-sm text-muted-foreground">{review.property}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.date).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm">{review.comment}</p>
                          {review.response && (
                            <div className="rounded-md bg-muted/40 p-3 text-sm">
                              <p className="font-medium">Respuesta:</p>
                              <p>{review.response}</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openResponseDialog(review)}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Responder
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openResponseDialog(
                                  review,
                                  'Gracias por tu reseña. Nos alegra saber que la estancia fue positiva.'
                                )
                              }
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Agradecer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Guías Digitales</CardTitle>
                    <CardDescription>Información para tus huéspedes</CardDescription>
                  </div>
                  <Button>
                    <Book className="h-4 w-4 mr-2" />
                    Nueva Guía
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground p-8">
                  <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Gestión de guías digitales</p>
                  <p className="text-sm mt-2">Crea guías personalizadas para cada propiedad</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>Incidencias Reportadas</CardTitle>
                <CardDescription>Problemas reportados por huéspedes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground p-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sin incidencias activas</p>
                  <p className="text-sm mt-2">
                    Los huéspedes pueden reportar problemas en tiempo real
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <CardTitle>Comunicación Automatizada</CardTitle>
                <CardDescription>Mensajes automáticos para huéspedes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Mensaje de Bienvenida</h3>
                          <p className="text-sm text-muted-foreground">
                            Enviado 24h antes del check-in
                          </p>
                        </div>
                        <Badge variant="default">Activo</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Solicitud de Reseña</h3>
                          <p className="text-sm text-muted-foreground">
                            Enviado 2 días después del check-out
                          </p>
                        </div>
                        <Badge variant="default">Activo</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder reseña</DialogTitle>
            <DialogDescription>Respuesta visible para el huésped.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submitResponse} disabled={isResponding}>
                {isResponding ? 'Enviando...' : 'Enviar respuesta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
