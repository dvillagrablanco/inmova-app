'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface RatingFormProps {
  onSuccess?: () => void;
}

const ratingTypes = [
  { value: 'general', label: 'General', description: 'Valoración general del servicio' },
  { value: 'plataforma', label: 'Plataforma', description: 'Usabilidad de la plataforma' },
  { value: 'atencion_cliente', label: 'Atención al Cliente', description: 'Servicio de atención al cliente' },
  { value: 'mantenimiento', label: 'Mantenimiento', description: 'Servicio de mantenimiento' },
  { value: 'comunicacion', label: 'Comunicación', description: 'Comunicación y respuesta' },
];

export default function RatingForm({ onSuccess }: RatingFormProps) {
  const [tipo, setTipo] = useState<string>('');
  const [puntuacion, setPuntuacion] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comentario, setComentario] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipo) {
      toast.error('Por favor selecciona un tipo de valoración');
      return;
    }

    if (puntuacion === 0) {
      toast.error('Por favor selecciona una puntuación');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/portal-inquilino/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          puntuacion,
          comentario: comentario.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar valoración');
      }

      toast.success('¡Gracias por tu valoración!');
      
      // Resetear formulario
      setTipo('');
      setPuntuacion(0);
      setComentario('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      logger.error('Error submitting rating:', error);
      toast.error(error.message || 'Error al enviar la valoración');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Valoración</CardTitle>
        <CardDescription>
          Tu opinión nos ayuda a mejorar el servicio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de valoración */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Valoración</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecciona el tipo de valoración" />
              </SelectTrigger>
              <SelectContent>
                {ratingTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipo && (
              <p className="text-xs text-gray-500">
                {ratingTypes.find((t) => t.value === tipo)?.description}
              </p>
            )}
          </div>

          {/* Puntuación con estrellas */}
          <div className="space-y-2">
            <Label>Puntuación</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPuntuacion(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || puntuacion)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {puntuacion > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {puntuacion} {puntuacion === 1 ? 'estrella' : 'estrellas'}
                </span>
              )}
            </div>
          </div>

          {/* Comentario */}
          <div className="space-y-2">
            <Label htmlFor="comentario">Comentario (Opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">
              {comentario.length}/1000 caracteres
            </p>
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            disabled={submitting || !tipo || puntuacion === 0}
            className="w-full bg-black hover:bg-gray-800"
          >
            {submitting ? 'Enviando...' : 'Enviar Valoración'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
