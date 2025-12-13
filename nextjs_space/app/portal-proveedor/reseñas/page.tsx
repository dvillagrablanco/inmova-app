'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  calificacionGeneral: number;
  calidadTrabajo?: number;
  puntualidad?: number;
  profesionalismo?: number;
  limpieza?: number;
  comunicacion?: number;
  comentario?: string;
  createdAt: string;
  workOrder: {
    id: string;
    titulo: string;
    building: {
      id: string;
      nombre: string;
    };
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  categoryAverages: {
    calidadTrabajo: number;
    puntualidad: number;
    profesionalismo: number;
    limpieza: number;
    comunicacion: number;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
}

export default function ReseñasPage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portal-proveedor/reviews', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Error al cargar reseñas');
      const reviewData = await response.json();
      setData(reviewData);
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
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

  const CategoryBar = ({ label, value }: { label: string; value: number }) => {
    const percentage = (value / 5) * 100;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{value.toFixed(1)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8">
          <p className="text-gray-500">No se pudieron cargar las reseñas</p>
        </div>
      </div>
    );
  }

  const { reviews, stats } = data;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reseñas y Calificaciones</h1>
        <p className="text-gray-600">Visualiza las valoraciones de tu trabajo</p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Calificación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <div className="text-gray-500 mb-1">/5.0</div>
            </div>
            <div className="mt-2">{renderStars(Math.round(stats.averageRating))}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total de Reseñas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalReviews}</div>
            <p className="text-sm text-gray-500 mt-1">Valoraciones recibidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />5 Estrellas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.ratingDistribution[5] || 0}</div>
            <p className="text-sm text-gray-500 mt-1">
              {stats.totalReviews > 0
                ? `${Math.round((stats.ratingDistribution[5] / stats.totalReviews) * 100)}% del total`
                : 'Sin valoraciones'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Recomendación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalReviews > 0
                ? `${Math.round(((stats.ratingDistribution[5] + stats.ratingDistribution[4]) / stats.totalReviews) * 100)}%`
                : '0%'}
            </div>
            <p className="text-sm text-gray-500 mt-1">4-5 estrellas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Distribución de calificaciones */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Distribución de Calificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Promedios por categoría */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calificaciones por Categoría</CardTitle>
            <CardDescription>Desglose de tu desempeño en diferentes áreas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CategoryBar
              label="Calidad del Trabajo"
              value={stats.categoryAverages.calidadTrabajo}
            />
            <CategoryBar label="Puntualidad" value={stats.categoryAverages.puntualidad} />
            <CategoryBar label="Profesionalismo" value={stats.categoryAverages.profesionalismo} />
            <CategoryBar label="Limpieza" value={stats.categoryAverages.limpieza} />
            <CategoryBar label="Comunicación" value={stats.categoryAverages.comunicacion} />
          </CardContent>
        </Card>
      </div>

      {/* Listado de reseñas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reseñas Recibidas</CardTitle>
          <CardDescription>
            {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aún no has recibido reseñas</p>
              <p className="text-sm text-gray-400 mt-2">
                Las reseñas aparecerán aquí cuando los clientes evalúen tu trabajo
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {renderStars(review.calificacionGeneral)}
                        <span className="text-sm font-medium">
                          {review.calificacionGeneral.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {review.workOrder.titulo} - {review.workOrder.building.nombre}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(review.createdAt), 'dd MMM yyyy', {
                        locale: es,
                      })}
                    </span>
                  </div>

                  {review.comentario && (
                    <p className="text-sm text-gray-700 mb-3 italic">"{review.comentario}"</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-3 border-t">
                    {review.calidadTrabajo && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Calidad</p>
                        <p className="text-sm font-medium">{review.calidadTrabajo.toFixed(1)}</p>
                      </div>
                    )}
                    {review.puntualidad && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Puntualidad</p>
                        <p className="text-sm font-medium">{review.puntualidad.toFixed(1)}</p>
                      </div>
                    )}
                    {review.profesionalismo && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Profesionalismo</p>
                        <p className="text-sm font-medium">{review.profesionalismo.toFixed(1)}</p>
                      </div>
                    )}
                    {review.limpieza && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Limpieza</p>
                        <p className="text-sm font-medium">{review.limpieza.toFixed(1)}</p>
                      </div>
                    )}
                    {review.comunicacion && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Comunicación</p>
                        <p className="text-sm font-medium">{review.comunicacion.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
