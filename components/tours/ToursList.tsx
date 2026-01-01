'use client';

/**
 * LISTA DE TOURS DISPONIBLES
 * Muestra todos los tours relevantes para el usuario
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { VirtualTourPlayer } from './VirtualTourPlayer';
import { toast } from 'sonner';

interface Tour {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'feature' | 'advanced' | 'troubleshooting';
  estimatedDuration: number;
  priority: number;
  steps: any[];
}

export function ToursList() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tours?view=all');
      const data = await response.json();

      if (data.success) {
        setTours(data.tours);
        setCompletedTours(data.completedTours || 0);
        setProgress(data.progress || 0);
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast.error('Error cargando tours');
    } finally {
      setLoading(false);
    }
  };

  const startTour = (tour: Tour) => {
    setActiveTour(tour);
  };

  const handleTourComplete = () => {
    setActiveTour(null);
    fetchTours(); // Refrescar lista
    toast.success('Tour completado');
  };

  const handleTourSkip = () => {
    setActiveTour(null);
    toast.info('Tour saltado');
  };

  const resetTour = async (tourId: string) => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          tourId
        })
      });

      const data = await response.json();

      if (data.success) {
        fetchTours();
        toast.success('Tour reseteado');
      }
    } catch (error) {
      console.error('Error resetting tour:', error);
      toast.error('Error reseteando tour');
    }
  };

  const isTourCompleted = (tourId: string) => {
    return completedTours.includes(tourId);
  };

  const getCategoryColor = (category: Tour['category']) => {
    switch (category) {
      case 'onboarding': return 'bg-blue-100 text-blue-800';
      case 'feature': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'troubleshooting': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: Tour['category']) => {
    switch (category) {
      case 'onboarding': return 'Introducción';
      case 'feature': return 'Funcionalidad';
      case 'advanced': return 'Avanzado';
      case 'troubleshooting': return 'Solución de problemas';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Tours Virtuales</h2>
        <p className="text-gray-600 mt-1">
          Aprende a usar la plataforma con guías interactivas
        </p>
      </div>

      {/* Progress global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tu Progreso</CardTitle>
          <CardDescription>
            {completedTours.length} de {tours.length} tours completados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">{progress}% completado</p>
        </CardContent>
      </Card>

      {/* Lista de tours */}
      <div className="grid gap-4 md:grid-cols-2">
        {tours.map(tour => {
          const completed = isTourCompleted(tour.id);
          
          return (
            <Card key={tour.id} className={completed ? 'border-green-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tour.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {tour.description}
                    </CardDescription>
                  </div>
                  {completed && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(tour.category)}>
                    {getCategoryLabel(tour.category)}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{Math.ceil(tour.estimatedDuration / 60)} min</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {tour.steps.length} pasos
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => startTour(tour)}
                  className="flex-1"
                  variant={completed ? 'outline' : 'default'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {completed ? 'Ver de nuevo' : 'Iniciar tour'}
                </Button>
                {completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetTour(tour.id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {tours.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">¡Todo listo!</p>
            <p className="text-gray-600 text-center mt-2">
              Has completado todos los tours disponibles para tu perfil
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tour player activo */}
      {activeTour && (
        <VirtualTourPlayer
          tour={activeTour}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </div>
  );
}
