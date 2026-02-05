'use client';

export const dynamic = 'force-dynamic';

/**
 * Portal Proveedor - Reseñas (ASCII)
 * Alias para evitar rutas con caracteres especiales.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Reply,
  Flag,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Review {
  id: string;
  clienteNombre: string;
  servicio: string;
  puntuacion: number;
  comentario: string;
  fecha: string;
  respondida: boolean;
  respuesta?: string;
  fechaRespuesta?: string;
  util: number;
  noUtil: number;
}

// Datos mock (cargados desde API en producción)
const RATING_DISTRIBUTION = [
  { stars: 5, count: 45 },
  { stars: 4, count: 28 },
  { stars: 3, count: 12 },
  { stars: 2, count: 5 },
  { stars: 1, count: 2 },
];

export default function PortalProveedorResenasPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<{ stars: number; count: number }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all');

  // Cargar datos desde API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/portal-proveedor/reviews');
        if (response.ok) {
          const result = await response.json();
          setReviews(result.data?.reviews || []);
          setRatingDistribution(result.data?.ratingDistribution || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const totalReviews = ratingDistribution.reduce((sum, r) => sum + r.count, 0);
  const avgRating =
    totalReviews > 0
      ? ratingDistribution.reduce((sum, r) => sum + r.stars * r.count, 0) / totalReviews
      : 0;

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) {
      toast.error('Escribe una respuesta');
      return;
    }

    try {
      setSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReviews(
        reviews.map((r) =>
          r.id === selectedReview.id
            ? {
                ...r,
                respondida: true,
                respuesta: replyText,
                fechaRespuesta: new Date().toISOString().split('T')[0],
              }
            : r
        )
      );

      toast.success('Respuesta publicada');
      setIsReplyDialogOpen(false);
      setReplyText('');
      setSelectedReview(null);
    } catch (error) {
      toast.error('Error al publicar respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'pending') return !r.respondida;
    if (filter === 'responded') return r.respondida;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.respondida).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mis Reseñas</h1>
        <p className="text-muted-foreground">Valoraciones y comentarios de tus clientes</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Rating Overview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              Resumen de Valoraciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Average Score */}
              <div className="text-center md:text-left">
                <p className="text-5xl font-bold">{avgRating.toFixed(1)}</p>
                <div className="flex justify-center md:justify-start mt-2">
                  {renderStars(Math.round(avgRating))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{totalReviews} reseñas</p>
              </div>

              {/* Distribution */}
              <div className="flex-1 space-y-2">
                {RATING_DISTRIBUTION.map(({ stars, count }) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-3">{stars}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Progress value={(count / totalReviews) * 100} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Promedio</p>
                  <p className="text-xl font-bold">{avgRating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{totalReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </Button>
          <Button
            variant={filter === 'responded' ? 'default' : 'outline'}
            onClick={() => setFilter('responded')}
          >
            Respondidas
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Cargando reseñas...</p>
            </CardContent>
          </Card>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No hay reseñas para mostrar.</p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {review.clienteNombre
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{review.clienteNombre}</CardTitle>
                      <CardDescription>{review.servicio}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={review.respondida ? 'secondary' : 'default'}>
                    {review.respondida ? 'Respondida' : 'Pendiente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {renderStars(review.puntuacion)}
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(review.fecha), 'PPP', { locale: es })}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">{review.comentario}</p>

                {review.respondida && review.respuesta && (
                  <div className="bg-muted/50 rounded-md p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Reply className="h-4 w-4" />
                      Respuesta
                    </div>
                    <p className="text-sm">{review.respuesta}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {review.util}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      {review.noUtil}
                    </span>
                  </div>

                  {!review.respondida && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReview(review);
                        setIsReplyDialogOpen(true);
                      }}
                    >
                      Responder
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder a reseña</DialogTitle>
            <DialogDescription>
              Responde de forma profesional para mejorar la confianza del cliente.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escribe tu respuesta..."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReplyDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleReply} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
