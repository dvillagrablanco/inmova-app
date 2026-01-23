'use client';

export const dynamic = 'force-dynamic';

/**
 * Portal Proveedor - Reseñas
 * 
 * Sistema de valoraciones y reseñas de proveedores de servicios
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

// Datos cargados desde API /api/portal-proveedor/reviews

export default function PortalProveedorReseñasPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<{stars: number; count: number}[]>([]);
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
  const avgRating = totalReviews > 0 ? ratingDistribution.reduce((sum, r) => sum + r.stars * r.count, 0) / totalReviews : 0;

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) {
      toast.error('Escribe una respuesta');
      return;
    }

    try {
      setSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setReviews(reviews.map(r =>
        r.id === selectedReview.id
          ? {
              ...r,
              respondida: true,
              respuesta: replyText,
              fechaRespuesta: new Date().toISOString().split('T')[0],
            }
          : r
      ));

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
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.respondida;
    if (filter === 'responded') return r.respondida;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.respondida).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mis Reseñas</h1>
        <p className="text-muted-foreground">
          Valoraciones y comentarios de tus clientes
        </p>
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
                <p className="text-sm text-muted-foreground mt-1">
                  {totalReviews} reseñas
                </p>
              </div>

              {/* Distribution */}
              <div className="flex-1 space-y-2">
                {ratingDistribution.map(({ stars, count }) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-3">{stars}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Progress
                      value={(count / totalReviews) * 100}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-8">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pendientes</span>
              <Badge variant={pendingCount > 0 ? 'destructive' : 'secondary'}>
                {pendingCount}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Este mes</span>
              <span className="font-semibold">+{reviews.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Satisfacción</span>
              <span className="font-semibold text-green-600">
                {totalReviews > 0 && ratingDistribution.length >= 2 
                  ? Math.round(((ratingDistribution[0]?.count || 0) + (ratingDistribution[1]?.count || 0)) / totalReviews * 100) 
                  : 0}%
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <Award className="h-5 w-5" />
                <span className="font-medium">Top Proveedor</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mantienes una valoración excelente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas ({reviews.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Pendientes ({pendingCount})
            </Button>
            <Button
              variant={filter === 'responded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('responded')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Respondidas ({reviews.length - pendingCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Reseñas</h3>
            <p className="text-sm text-muted-foreground">
              No hay reseñas que coincidan con el filtro seleccionado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Review Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {review.clienteNombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.clienteNombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {review.servicio}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.puntuacion)}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(review.fecha), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>

                  {/* Review Content */}
                  <p className="text-sm">{review.comentario}</p>

                  {/* Helpfulness */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {review.util} útil
                    </span>
                    {review.noUtil > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" />
                        {review.noUtil}
                      </span>
                    )}
                  </div>

                  {/* Response */}
                  {review.respondida && review.respuesta && (
                    <div className="ml-8 p-4 bg-muted/50 rounded-lg border-l-2 border-primary">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Tu respuesta</span>
                        <span className="text-xs text-muted-foreground">
                          {review.fechaRespuesta && format(parseISO(review.fechaRespuesta), "d MMM", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm">{review.respuesta}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {!review.respondida && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          setSelectedReview(review);
                          setIsReplyDialogOpen(true);
                        }}
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        Responder
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder a {selectedReview?.clienteNombre}</DialogTitle>
            <DialogDescription>
              Tu respuesta será visible públicamente
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 py-4">
              {/* Original Review */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.puntuacion)}
                  <span className="text-sm font-medium">{selectedReview.servicio}</span>
                </div>
                <p className="text-sm">{selectedReview.comentario}</p>
              </div>

              {/* Reply Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tu respuesta</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe una respuesta profesional y cortés..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Agradece el feedback y ofrece soluciones si hay quejas
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReplyDialogOpen(false);
                setReplyText('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleReply} disabled={submitting}>
              {submitting ? 'Publicando...' : 'Publicar Respuesta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
