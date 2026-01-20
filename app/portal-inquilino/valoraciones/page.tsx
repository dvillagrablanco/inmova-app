'use client';

/**
 * Portal Inquilino - Valoraciones y Feedback
 * 
 * Permite al inquilino valorar la propiedad y el servicio de gestión
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Home,
  UserCheck,
  Wrench,
  ThumbsUp,
  Calendar,
  Send,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Rating {
  id: string;
  tipo: 'propiedad' | 'servicio' | 'mantenimiento';
  puntuacion: number;
  comentario: string;
  createdAt: string;
  respuestaAdmin?: string;
  respuestaFecha?: string;
}

const RATING_TYPES = [
  { 
    id: 'propiedad', 
    nombre: 'Propiedad', 
    icon: Home, 
    description: 'Valora el estado y comodidad de tu vivienda',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  { 
    id: 'servicio', 
    nombre: 'Servicio de Gestión', 
    icon: UserCheck, 
    description: 'Valora la atención y comunicación con tu gestor',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  { 
    id: 'mantenimiento', 
    nombre: 'Mantenimiento', 
    icon: Wrench, 
    description: 'Valora la rapidez y calidad de las reparaciones',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
];

export default function PortalInquilinoValoracionesPage() {
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    tipo: 'propiedad',
    puntuacion: 0,
    comentario: '',
  });

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portal-inquilino/ratings');
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesión expirada');
          return;
        }
        throw new Error('Error al cargar valoraciones');
      }

      const data = await response.json();
      setRatings(data);
    } catch (error) {
      toast.error('Error al cargar valoraciones');
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.puntuacion === 0) {
      toast.error('Por favor selecciona una puntuación');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/portal-inquilino/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar valoración');
      }

      toast.success('¡Gracias por tu valoración!');
      setIsDialogOpen(false);
      setFormData({
        tipo: 'propiedad',
        puntuacion: 0,
        comentario: '',
      });
      setSelectedType(null);
      loadRatings();
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar valoración');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDialog = (tipo: string) => {
    setSelectedType(tipo);
    setFormData({ ...formData, tipo, puntuacion: 0, comentario: '' });
    setIsDialogOpen(true);
  };

  const getAverageRating = (tipo: string) => {
    const typeRatings = ratings.filter((r) => r.tipo === tipo);
    if (typeRatings.length === 0) return null;
    const avg = typeRatings.reduce((acc, r) => acc + r.puntuacion, 0) / typeRatings.length;
    return avg.toFixed(1);
  };

  const renderStars = (puntuacion: number, interactive = false, onChange?: (value: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          >
            <Star
              className={`h-6 w-6 ${
                star <= puntuacion
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const hasRatedType = (tipo: string) => {
    return ratings.some((r) => r.tipo === tipo);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando valoraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Valoraciones y Feedback</h1>
        <p className="text-muted-foreground">
          Tu opinión nos ayuda a mejorar
        </p>
      </div>

      {/* Rating Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {RATING_TYPES.map((type) => {
          const avgRating = getAverageRating(type.id);
          const rated = hasRatedType(type.id);
          
          return (
            <Card key={type.id} className={type.bgColor}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <type.icon className={`h-8 w-8 ${type.color}`} />
                  {rated && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Valorado
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{type.nombre}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {avgRating ? (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl font-bold">{avgRating}</span>
                    {renderStars(parseFloat(avgRating))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    Sin valoraciones todavía
                  </p>
                )}
                <Button
                  onClick={() => handleOpenDialog(type.id)}
                  className="w-full"
                  variant={rated ? 'outline' : 'default'}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {rated ? 'Actualizar valoración' : 'Valorar'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Previous Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Historial de Valoraciones
          </CardTitle>
          <CardDescription>
            Tus valoraciones anteriores y respuestas del equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aún no has realizado ninguna valoración
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ¡Tu feedback es muy importante para nosotros!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => {
                const type = RATING_TYPES.find((t) => t.id === rating.tipo);
                return (
                  <div key={rating.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {type && <type.icon className={`h-5 w-5 ${type.color}`} />}
                        <span className="font-medium">{type?.nombre}</span>
                        <Badge variant="outline">
                          {renderStars(rating.puntuacion)}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(rating.createdAt), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    
                    {rating.comentario && (
                      <p className="text-sm text-muted-foreground mt-2">
                        "{rating.comentario}"
                      </p>
                    )}

                    {rating.respuestaAdmin && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                        <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          Respuesta del equipo
                          {rating.respuestaFecha && (
                            <span className="text-muted-foreground ml-2">
                              {format(parseISO(rating.respuestaFecha), "d MMM", { locale: es })}
                            </span>
                          )}
                        </p>
                        <p className="text-sm">{rating.respuestaAdmin}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedType && RATING_TYPES.find((t) => t.id === selectedType)?.icon && (
                (() => {
                  const type = RATING_TYPES.find((t) => t.id === selectedType);
                  const Icon = type?.icon;
                  return Icon ? <Icon className={`h-5 w-5 ${type?.color}`} /> : null;
                })()
              )}
              Valorar {RATING_TYPES.find((t) => t.id === selectedType)?.nombre}
            </DialogTitle>
            <DialogDescription>
              Tu valoración es anónima y nos ayuda a mejorar
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>¿Cómo valorarías tu experiencia?</Label>
                <div className="flex justify-center py-4">
                  {renderStars(formData.puntuacion, true, (value) =>
                    setFormData({ ...formData, puntuacion: value })
                  )}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {formData.puntuacion === 0 && 'Selecciona una puntuación'}
                  {formData.puntuacion === 1 && 'Muy malo'}
                  {formData.puntuacion === 2 && 'Malo'}
                  {formData.puntuacion === 3 && 'Regular'}
                  {formData.puntuacion === 4 && 'Bueno'}
                  {formData.puntuacion === 5 && 'Excelente'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentario">Comentario (opcional)</Label>
                <Textarea
                  id="comentario"
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  placeholder="Cuéntanos más sobre tu experiencia..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={formData.puntuacion === 0 || submitting}>
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Enviando...' : 'Enviar Valoración'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
