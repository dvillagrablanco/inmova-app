'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Book, 
  MessageCircle, 
  AlertCircle,
  ThumbsUp,
  Mail,
  Gift
} from 'lucide-react';

export default function GuestExperiencePage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([
    { id: '1', guest: 'John Doe', property: 'Apartamento Malasaña', rating: 5, date: '2024-12-01', comment: 'Excelente estancia, muy limpio y bien ubicado' },
    { id: '2', guest: 'Jane Smith', property: 'Loft Retiro', rating: 4, date: '2024-12-03', comment: 'Muy bueno, solo pequeños detalles a mejorar' },
    { id: '3', guest: 'Mike Johnson', property: 'Piso Salamanca', rating: 5, date: '2024-12-05', comment: 'Perfecto, sin duda volveremos' }
  ]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Guest Experience</h1>
            <p className="text-muted-foreground">Mejora la experiencia de tus huéspedes</p>
          </div>
          <Button onClick={() => router.push('/str-advanced')}>
            Volver al Dashboard
          </Button>
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
              <div className="text-3xl font-bold">4.8</div>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reseñas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">127</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Guías Digitales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Respuesta Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">15min</div>
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
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Solicitar Reseñas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                        </div>
                        <p className="text-sm">{review.comment}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Responder
                          </Button>
                          <Button variant="outline" size="sm">
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
                <p className="text-sm mt-2">Los huéspedes pueden reportar problemas en tiempo real</p>
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
  );
}
