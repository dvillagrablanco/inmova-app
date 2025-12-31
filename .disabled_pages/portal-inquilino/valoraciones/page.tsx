'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, MessageSquare, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import RatingForm from '@/components/portal-inquilino/RatingForm';
import logger from '@/lib/logger';

interface Rating {
  id: string;
  tipo: string;
  puntuacion: number;
  comentario: string | null;
  visible: boolean;
  respuestaAdmin: string | null;
  createdAt: string;
  updatedAt: string;
}

const ratingTypeLabels: Record<string, string> = {
  general: 'General',
  plataforma: 'Plataforma',
  atencion_cliente: 'Atención al Cliente',
  mantenimiento: 'Mantenimiento',
  comunicacion: 'Comunicación',
};

export default function TenantRatingsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/portal-inquilino/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchRatings();
    }
  }, [session]);

  const fetchRatings = async () => {
    try {
      const response = await fetch('/api/portal-inquilino/ratings');
      if (!response.ok) throw new Error('Error al cargar valoraciones');
      const data = await response.json();
      setRatings(data.ratings || []);
    } catch (error) {
      logger.error('Error fetching ratings:', error);
      toast.error('Error al cargar las valoraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSuccess = () => {
    fetchRatings();
    setShowForm(false);
    setTimeout(() => setShowForm(true), 100); // Reset form
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Valoraciones y Feedback</h1>
        <p className="text-gray-600">Comparte tu opinión y ayuda a mejorar el servicio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de Nueva Valoración */}
        <div>{showForm && <RatingForm onSuccess={handleRatingSuccess} />}</div>

        {/* Historial de Valoraciones */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Mis Valoraciones</CardTitle>
              <CardDescription>Historial de tus valoraciones enviadas</CardDescription>
            </CardHeader>
            <CardContent>
              {ratings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Aún no has enviado ninguna valoración</p>
                  <p className="text-sm mt-2">
                    Utiliza el formulario de la izquierda para enviar tu primera valoración
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div
                      key={rating.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {ratingTypeLabels[rating.tipo] || rating.tipo}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {renderStars(rating.puntuacion)}
                            <span className="text-sm font-semibold">{rating.puntuacion}/5</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(rating.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      {/* Comentario */}
                      {rating.comentario && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {rating.comentario}
                          </p>
                        </div>
                      )}

                      {/* Respuesta del Admin */}
                      {rating.respuestaAdmin && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-900">
                              Respuesta del Equipo
                            </span>
                          </div>
                          <p className="text-sm text-blue-800">{rating.respuestaAdmin}</p>
                        </div>
                      )}

                      {/* Estado */}
                      {!rating.visible && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          No visible públicamente
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estadísticas */}
      {ratings.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">{ratings.length}</p>
                  <p className="text-sm text-gray-600">Valoraciones Totales</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">
                    {(ratings.reduce((sum, r) => sum + r.puntuacion, 0) / ratings.length).toFixed(
                      1
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Puntuación Media</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">
                    {ratings.filter((r) => r.respuestaAdmin).length}
                  </p>
                  <p className="text-sm text-gray-600">Con Respuesta</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">
                    {ratings.filter((r) => r.visible).length}
                  </p>
                  <p className="text-sm text-gray-600">Públicas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
