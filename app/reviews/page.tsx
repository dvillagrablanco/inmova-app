'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import logger, { logError } from '@/lib/logger';;


interface Review {
  id: string;
  entityType: string;
  entityId: string;
  reviewerName: string;
  rating: number;
  titulo: string;
  comentario: string;
  aspectos?: any;
  estado: string;
  verificado: boolean;
  likes: number;
  dislikes: number;
  reportes: number;
  respuesta?: string;
  createdAt: string;
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchReviews();
    }
  }, [status, router]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar calificaciones');
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (id: string) => {
    try {
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: 'publicada' }),
      });
      toast.success('Review aprobada');
      fetchReviews();
    } catch (error) {
      toast.error('Error al aprobar');
    }
  };

  const rejectReview = async (id: string) => {
    try {
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: 'rechazada', motivoRechazo: 'Contenido inapropiado' }),
      });
      toast.success('Review rechazada');
      fetchReviews();
    } catch (error) {
      toast.error('Error al rechazar');
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

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' as const, icon: Clock },
      publicada: { label: 'Publicada', variant: 'default' as const, icon: CheckCircle },
      rechazada: { label: 'Rechazada', variant: 'destructive' as const, icon: XCircle },
      reportada: { label: 'Reportada', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.pendiente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-bg items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Calificaciones y Reviews</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reviews.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{avgRating}</span>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reviews.filter((r) => r.estado === 'pendiente').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reviews.filter((r) => r.estado === 'publicada').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Calificaciones y Reviews</h1>
            <p className="text-muted-foreground">
              Gestiona las valoraciones de proveedores, propiedades e inquilinos
            </p>
          </div>

          {/* Lista de Reviews */}
          <div className="grid grid-cols-1 gap-4">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No hay reviews disponibles
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{review.titulo}</h3>
                          {getStatusBadge(review.estado)}
                          {review.verificado && (
                            <Badge className="bg-blue-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
                          <span>{review.reviewerName}</span>
                          <span>•</span>
                          <span>{renderStars(review.rating)}</span>
                          <span>•</span>
                          <Badge variant="outline" className="capitalize">
                            {review.entityType.replace('_', ' ')}
                          </Badge>
                          <span>•</span>
                          <span>{new Date(review.createdAt).toLocaleDateString('es-ES')}</span>
                        </div>

                        <p className="text-sm mb-4">{review.comentario}</p>

                        {/* Aspectos Evaluados */}
                        {review.aspectos && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            {Object.entries(review.aspectos).map(([key, value]: [string, any]) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="capitalize">{key}</span>
                                  <span className="font-medium">{value}/5</span>
                                </div>
                                <Progress value={(value / 5) * 100} className="h-2" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Respuesta */}
                        {review.respuesta && (
                          <div className="bg-muted p-3 rounded-lg mt-3">
                            <p className="text-sm font-medium mb-1">Respuesta:</p>
                            <p className="text-sm text-muted-foreground">{review.respuesta}</p>
                          </div>
                        )}

                        {/* Interacciones */}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{review.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsDown className="h-4 w-4" />
                            <span>{review.dislikes}</span>
                          </div>
                          {review.reportes > 0 && (
                            <Badge variant="destructive">{review.reportes} reportes</Badge>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      {review.estado === 'pendiente' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveReview(review.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectReview(review.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
