'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Star,
  MessageSquare,
  TrendingUp,
  Award,
  ThumbsUp,
  AlertCircle,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  channel: string;
  rating: number;
  comment: string;
  date: string;
  responded: boolean;
  response?: string;
  categories: {
    cleanliness: number;
    communication: number;
    location: number;
    value: number;
  };
}

export default function STRReviewsPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      loadReviews();
    }
  }, [status]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/str/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : data.data || []);
      }

    } catch (error) {
      toast.error('Error al cargar reviews');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.propertyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'pending') return matchesSearch && !review.responded;
    if (filter === 'responded') return matchesSearch && review.responded;
    return matchesSearch;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const pendingResponses = reviews.filter(r => !r.responded).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando reviews...</p>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Reviews</h1>
                <p className="text-muted-foreground mt-2">
                  Centraliza y responde reviews de todos los canales
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold">{avgRating}</div>
                    <div className="flex">{renderStars(Math.round(parseFloat(avgRating)))}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pendientes Respuesta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{pendingResponses}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Tasa Respuesta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {reviews.length > 0
                      ? Math.round((reviews.filter(r => r.responded).length / reviews.length) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Respondidas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Reviews Positivas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {reviews.filter(r => r.rating >= 4).length}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ThumbsUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">
                      {reviews.length > 0
                        ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)
                        : 0}% del total
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por huésped o propiedad..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      Todas
                    </Button>
                    <Button
                      variant={filter === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('pending')}
                    >
                      Pendientes
                    </Button>
                    <Button
                      variant={filter === 'responded' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('responded')}
                    >
                      Respondidas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <Badge variant="outline">{review.channel}</Badge>
                          {review.responded ? (
                            <Badge className="bg-green-500">Respondida</Badge>
                          ) : (
                            <Badge className="bg-yellow-500">Pendiente</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{review.guestName}</CardTitle>
                        <CardDescription>
                          {review.propertyName} • {formatDate(review.date)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm">{review.comment}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Limpieza</p>
                        <div className="flex items-center gap-1">
                          <div className="flex">{renderStars(review.categories.cleanliness)}</div>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Comunicación</p>
                        <div className="flex items-center gap-1">
                          <div className="flex">{renderStars(review.categories.communication)}</div>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Ubicación</p>
                        <div className="flex items-center gap-1">
                          <div className="flex">{renderStars(review.categories.location)}</div>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Relación calidad/precio</p>
                        <div className="flex items-center gap-1">
                          <div className="flex">{renderStars(review.categories.value)}</div>
                        </div>
                      </div>
                    </div>

                    {review.responded && review.response && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-900 mb-1">Tu respuesta:</p>
                            <p className="text-sm text-blue-800">{review.response}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!review.responded && (
                      <div className="pt-3 border-t">
                        <Textarea
                          placeholder="Escribe tu respuesta..."
                          className="mb-2"
                        />
                        <Button
                          size="sm"
                          onClick={() => toast.success('Respuesta enviada correctamente')}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar Respuesta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron reviews</h3>
                  <p className="text-muted-foreground">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </AuthenticatedLayout>
  );
}
